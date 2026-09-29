"""Small, printable claim report."""
from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether,Image

def create_claim_report(claim,project,subclaims,evidence_by_subclaim,certificate=None,thumbnails=None):
 out=BytesIO();doc=SimpleDocTemplate(out,pagesize=letter,leftMargin=.6*inch,rightMargin=.6*inch,topMargin=.6*inch,bottomMargin=.6*inch)
 styles=getSampleStyleSheet();styles.add(ParagraphStyle(name="CenterTitle",parent=styles["Title"],alignment=TA_CENTER,textColor=colors.HexColor("#17324d")));styles.add(ParagraphStyle(name="SmallText",parent=styles["BodyText"],fontSize=8,leading=10))
 story=[Paragraph("Impact Court — Evidence Report",styles["CenterTitle"]),Spacer(1,10),Paragraph("<b>Project:</b> "+escape(project.name),styles["BodyText"]),Paragraph("<b>Claim:</b> "+escape(claim.text),styles["BodyText"]),Paragraph(f"<b>Verdict:</b> {escape(claim.overall_verdict or 'not audited')} &nbsp; <b>Confidence:</b> {claim.overall_confidence if claim.overall_confidence is not None else '—'}",styles["BodyText"]),Spacer(1,12)]
 if certificate:story += [Paragraph("<b>Certificate:</b> "+escape(certificate.id),styles["SmallText"]),Paragraph("<b>Merkle root:</b> "+escape(certificate.merkle_root),styles["SmallText"]),Spacer(1,8)]
 for sc in subclaims:
  block=[Paragraph(f"<b>{escape(sc.type.title())}:</b> {escape(sc.statement)}",styles["Heading3"]),Paragraph(f"Verdict: {escape(sc.verdict or 'pending')} | Confidence: {sc.confidence if sc.confidence is not None else '—'}",styles["BodyText"])]
  if sc.reasons:block.append(Paragraph("Reasons: "+escape("; ".join(sc.reasons)),styles["SmallText"]))
  rows=[["Preview","Asset","Role","Evidence details"]]
  for ev,a in evidence_by_subclaim.get(sc.id,[]):
   d=ev.detail_json or {};preview="";notes=[str(d.get("reason","")),"relevance="+str(d.get("relevance",""))]
   if d.get("observed_count") is not None:notes.append("observed count="+str(d["observed_count"])+" / claimed="+str(d.get("claimed_count")))
   if d.get("quantitative_agreement") is not None:notes.append("quantitative agreement="+str(round(float(d["quantitative_agreement"]),3)))
   if d.get("flags"):notes.append("flags="+str(d["flags"]))
   if d.get("before_after_analysis"):notes.append(str(d["before_after_analysis"].get("summary","")))
   image_bytes=(thumbnails or {}).get(a.id)
   if image_bytes:
    try:preview=Image(BytesIO(image_bytes),width=.65*inch,height=.48*inch,kind="proportional")
    except Exception:preview="(unavailable)"
   rows.append([preview,Paragraph(escape(a.cloudinary_public_id),styles["SmallText"]),ev.role,Paragraph(escape("; ".join(n for n in notes if n)),styles["SmallText"])])
  if len(rows)>1:
   t=Table(rows,colWidths=[.75*inch,1.7*inch,.8*inch,3.55*inch],repeatRows=1);t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#e7eef5")),("GRID",(0,0),(-1,-1),.35,colors.grey),("VALIGN",(0,0),(-1,-1),"TOP"),("FONTSIZE",(0,0),(-1,-1),8)]));block.append(t)
  else:block.append(Paragraph("No evidence assets matched this sub-claim.",styles["SmallText"]))
  block.append(Spacer(1,10));story.append(KeepTogether(block))
 story.append(Paragraph("Automated vision counts and scene changes are estimates. EXIF, location, and time are indicators, not proof of authenticity.",styles["SmallText"]))
 doc.build(story);return out.getvalue()
