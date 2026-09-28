"""
Impact Court - Claims module
Decomposes a free-text impact claim into structured sub-claims via Gemini
(strict JSON), and scores sub-claims against gathered evidence using the
weights from the project doc (section 7.4). No DB access here - the API
layer fetches evidence and passes plain dicts in.
"""

import json
import os
from typing import Optional

from google import genai

MODEL_NAME = os.environ.get(
    "CLAIMS_LLM_MODEL",
    "gemini-2.5-flash-lite"
)

DECOMPOSE_SYSTEM_PROMPT = """You are a strict claim-decomposition engine for an NGO impact auditor.

Given a free-text impact claim and project context, break it into a JSON list of
checkable sub-claims.

Return ONLY valid JSON.
Do not return prose.
Do not return markdown.
Do not wrap the JSON in ```json fences.

Each sub-claim object must have exactly these fields:
- "id": short string like "sc1", "sc2"
- "type": one of "location", "time", "count", "change", "activity"
- "statement": short human-readable restatement of just this part of the claim
- "params": object with whatever fields are relevant, e.g.
    count type    -> {"target": "sapling", "value": 5000}
    location type -> {"site": "Site A"}
    time type     -> {"window": ["2026-03-01", "2026-06-30"]}
    change type   -> {"metric": "vegetation", "direction": "increase"}
    activity type -> {"label": "tree_planting"}

Always include a location sub-claim and a time sub-claim if the original
text mentions or implies either, even implicitly.

If the claim contains a number, always include a count sub-claim.

The output must be a JSON array of sub-claim objects.
"""


def decompose(claim_text: str, project: dict) -> list[dict]:
    """
    project: {"name": str, "site_lat": float, "site_lng": float,
              "window_start": str, "window_end": str}

    Returns a list of sub-claim dicts.

    Retries once with a stricter reminder if the model returns invalid JSON.

    Falls back to a single rule-based sub-claim if the Gemini call fails
    entirely, so a flaky API never hard-crashes the demo.
    """

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        # Keep the demo alive even if Gemini is not configured.
        return [{
            "id": "sc1",
            "type": "activity",
            "statement": claim_text,
            "params": {
                "label": "unknown",
                "raw_text": claim_text,
            },
        }]

    client = genai.Client(api_key=api_key)

    user_msg = json.dumps({
        "claim_text": claim_text,
        "project": project,
    })

    for attempt in range(2):
        try:
            prompt = (
                DECOMPOSE_SYSTEM_PROMPT
                + "\n\nINPUT:\n"
                + user_msg
            )

            if attempt == 1:
                prompt += (
                    "\n\nIMPORTANT: Your previous response was invalid. "
                    "Return ONLY a valid JSON array. Nothing else."
                )

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
            )

            raw = response.text.strip()

            # Handle accidental markdown fences defensively.
            if raw.startswith("```json"):
                raw = raw[len("```json"):]

            if raw.startswith("```"):
                raw = raw[len("```"):]

            if raw.endswith("```"):
                raw = raw[:-3]

            raw = raw.strip()

            subclaims = json.loads(raw)

            if isinstance(subclaims, list) and len(subclaims) > 0:
                return subclaims

        except Exception as exc:
            print(f"Gemini claim decomposition attempt {attempt + 1} failed: {exc}")

    # Rule-based fallback - keeps the demo alive even if the LLM call fails.
    return [{
        "id": "sc1",
        "type": "activity",
        "statement": claim_text,
        "params": {
            "label": "unknown",
            "raw_text": claim_text,
        },
    }]


# ---------- Scoring (project doc section 7.4 weights) ----------

WEIGHTS = {
    "geo_consistency": 0.25,
    "time_consistency": 0.20,
    "uniqueness": 0.20,
    "quantitative_agreement": 0.25,
    "evidence_volume": 0.10,
}


def score_subclaim(signals: dict) -> dict:
    """
    signals: dict with float scores 0..1 for each WEIGHTS key.

    A MISSING signal is treated as 0.5 ("unknown"), not 0.
    """

    confidence = round(
        sum(
            WEIGHTS[k] * signals.get(k, 0.5)
            for k in WEIGHTS
        ),
        3,
    )

    if confidence >= 0.75:
        verdict = "supported"
    elif confidence >= 0.40:
        verdict = "weak"
    else:
        verdict = "contradicted"

    return {
        "confidence": confidence,
        "verdict": verdict,
    }


def apply_hard_fail(
    verdict_result: dict,
    hard_fail: bool,
    hard_fail_reason: Optional[str] = None,
) -> dict:
    """
    A hard fail (reuse from another project, GPS/time far outside bounds)
    overrides the weighted score entirely.
    """

    if hard_fail:
        verdict_result = dict(verdict_result)
        verdict_result["verdict"] = "flagged"
        verdict_result["confidence"] = min(
            verdict_result["confidence"],
            0.2,
        )

        if hard_fail_reason:
            verdict_result.setdefault(
                "reasons",
                [],
            ).append(hard_fail_reason)

    return verdict_result


def overall_verdict(subclaim_verdicts: list[dict]) -> dict:
    """
    Overall claim verdict = the worst sub-claim verdict.
    Confidence = average of all sub-claims.
    """

    order = {
        "flagged": 0,
        "contradicted": 1,
        "weak": 2,
        "supported": 3,
    }

    worst = min(
        subclaim_verdicts,
        key=lambda v: order[v["verdict"]],
    )

    avg_conf = round(
        sum(
            v["confidence"]
            for v in subclaim_verdicts
        ) / len(subclaim_verdicts),
        3,
    )

    return {
        "verdict": worst["verdict"],
        "confidence": avg_conf,
    }