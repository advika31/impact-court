"use client";

import React, { useEffect, useRef, useState } from "react";
import VanillaTilt from "vanilla-tilt";
import { ArrowLeft, Compass, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import "./login.css";

interface AdminLoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);

  useEffect(() => {
    const el = tiltRef.current;
    if (el) {
      // Initialize VanillaTilt with 3D parameters and built-in gyroscope support
      VanillaTilt.init(el, {
        max: 22,
        speed: 400,
        glare: true,
        "max-glare": 0.45,
        gyroscope: true,
        gyroscopeMinAngleX: -45,
        gyroscopeMaxAngleX: 45,
        gyroscopeMinAngleY: -45,
        gyroscopeMaxAngleY: 45,
      });

      // Additional native mobile DeviceOrientation listener for robust cross-browser gyroscope tilt
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.beta !== null && e.gamma !== null) {
          setGyroActive(true);
          // Clamp and map beta (-10 to 60 deg typical hold) and gamma (-30 to 30 deg)
          const tiltX = Math.max(-20, Math.min(20, (e.beta - 40) * 0.6));
          const tiltY = Math.max(-20, Math.min(20, e.gamma * 0.7));
          el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }
      };

      if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
        window.addEventListener("deviceorientation", handleOrientation);
      }

      return () => {
        if ((el as any).vanillaTilt) {
          (el as any).vanillaTilt.destroy();
        }
        if (typeof window !== "undefined") {
          window.removeEventListener("deviceorientation", handleOrientation);
        }
      };
    }
  }, []);

  const handleAutofill = () => {
    setEmail("name@example.com");
    setPassword("1234");
    setError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Hardcoded credentials requirement
    if (email.trim().toLowerCase() === "name@example.com" && password === "1234") {
      setIsSuccess(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("impact_court_admin_auth", "true");
        sessionStorage.setItem("impact_court_admin_user", "name@example.com");
      }
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 700);
    } else {
      setError("Invalid credentials. Please use the demo credentials below.");
    }
  };

  const requestGyroPermission = async () => {
    if (
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === "granted") {
          setGyroActive(true);
        }
      } catch (err) {
        console.warn("Gyroscope permission denied:", err);
      }
    }
  };

  return (
    <div className="login-page">
      {/* Return to Customer Portal Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="back-nav-btn"
          aria-label="Return to Public Customer View"
        >
          <ArrowLeft className="w-4 h-4 text-[#eeead7]" />
          <span>Public Customer View</span>
        </button>
      )}

      <div className="login-container">
        {/* 3D Tilted Card Structure */}
        <div ref={tiltRef} className="box">
          {/* Floating Logo Badge with layout.jpg */}
          <div
            className="elements logo"
            title="Impact Court Judicial Emblem (layout.jpg)"
            role="img"
            aria-label="Impact Court Layout Emblem"
          />

          {/* Floating Title and Subtitle */}
          <div className="elements name">
            <h2>Admin Portal</h2>
            <div className="admin-tag">ML & Forensic Auditor</div>
            <div className="system-sub">Impact Court v2.4</div>
          </div>

          {/* Floating Interactive Content Box */}
          <div className="elements content">
            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="login-error flex items-center justify-center gap-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isSuccess && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified! Entering Admin ML Suite...</span>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  placeholder="Username (name@example.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Password (1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button className="login-btn" type="submit" disabled={isSuccess}>
                {isSuccess ? "Authenticating..." : "Enter Admin Portal"}
              </button>

              {/* Grey text below the login button with hardcoded credentials */}
              <div className="credentials-note">
                Demo Credentials: <span className="cred-value">name@example.com</span> &bull; Password:{" "}
                <span className="cred-value">1234</span>
                <div>
                  <button
                    type="button"
                    onClick={handleAutofill}
                    className="autofill-btn"
                  >
                    Click to Autofill Credentials
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 3D Glass Surface Card */}
          <div className="card" />
        </div>
      </div>
    </div>
  );
}
