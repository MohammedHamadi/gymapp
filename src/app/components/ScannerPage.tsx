import { useState, useEffect, useRef } from "react";
import successSound from "../../assets/sounds/success.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import gymLogo from "../../assets/photo_2026-04-30_12-33-00.jpg";

interface ScanResult {
  status: "GRANTED" | "DENIED" | "PENDING_SELECTION";
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  message?: string;
  reason?: string;
  subscription?: {
    id: number;
    planName: string;
    remainingSessions: number;
  };
  subscriptions?: any[];
}

interface ScannerPageProps {
  onBack?: () => void;
}

export function ScannerPage({ onBack }: ScannerPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused at all times so card scanner input is captured
  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current && !pendingSelection) {
        inputRef.current.focus();
      }
    };
    keepFocus();
    const interval = setInterval(keepFocus, 500);
    window.addEventListener("click", keepFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("click", keepFocus);
    };
  }, [pendingSelection]);

  // Auto-dismiss scan result after 4 seconds
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setScanResult(null), 400);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  const playSound = (type: "success" | "error") => {
    const audio = new Audio(type === "success" ? successSound : errorSound);
    audio.play().catch((e) => console.log("Audio error:", e));
  };

  const handleScan = async (id: string, subscriptionId?: number) => {
    if (!id.trim()) return;

    try {
      const result: ScanResult = await window.api.accessLogs.validate({
        id,
        type: "CHECK_IN",
        subscriptionId,
      });

      // Handle multiple subscriptions — show picker
      if (result.status === "PENDING_SELECTION") {
        setPendingSelection({
          memberId: id,
          member: result.member,
          subscriptions: result.subscriptions,
        });
        setInputValue("");
        return;
      }

      // Show result
      setScanResult(result);
      setIsAnimating(true);
      setInputValue("");

      if (result.status === "GRANTED") {
        playSound("success");
      } else {
        playSound("error");
      }
    } catch (error) {
      console.error("Scanner error:", error);
      setScanResult({
        status: "DENIED",
        reason: "System error",
      });
      setIsAnimating(true);
      playSound("error");
      setInputValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(inputValue);
  };

  const handleSubscriptionSelect = (subscriptionId: number) => {
    if (!pendingSelection) return;
    handleScan(pendingSelection.memberId, subscriptionId);
    setTimeout(() => setPendingSelection(null), 100);
  };

  const isGranted = scanResult?.status === "GRANTED";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Inter', sans-serif",
      }}
    >
      {/* Subtle animated background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px), radial-gradient(circle at 75% 75%, #3b82f6 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 30,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "10px 18px",
            color: "rgba(148, 163, 184, 0.8)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.12)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.9)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)";
            (e.currentTarget as HTMLElement).style.color = "rgba(148, 163, 184, 0.8)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      {/* Centered Logo Area — replace the placeholder with your image */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          opacity: scanResult ? 0.15 : 0.6,
          transition: "opacity 0.5s ease",
          userSelect: "none",
        }}
      >
        {/* Crossthenics Logo */}
        <img
          src={gymLogo}
          alt="Crossthenics"
          style={{
            width: "300px",
            height: "300px",
            objectFit: "contain",
            filter: "drop-shadow(0 0 40px rgba(255, 255, 255, 0.08))",
          }}
        />
        <p
          style={{
            color: "rgba(148, 163, 184, 0.8)",
            fontSize: "15px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Scan your card
        </p>
      </div>

      {/* Hidden input to capture card scanner data */}
      <form onSubmit={handleSubmit} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
          style={{ position: "absolute", left: "-9999px" }}
        />
      </form>

      {/* ========== SCAN RESULT OVERLAY ========== */}
      {scanResult && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            background: isGranted
              ? "radial-gradient(ellipse at center, rgba(22, 163, 74, 0.15) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(220, 38, 38, 0.15) 0%, transparent 70%)",
            animation: isAnimating ? "fadeIn 0.3s ease-out forwards" : "fadeOut 0.4s ease-in forwards",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "28px",
              animation: isAnimating ? "scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "scaleOut 0.3s ease-in forwards",
            }}
          >
            {/* Status Icon */}
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isGranted
                  ? "linear-gradient(135deg, #166534, #22c55e)"
                  : "linear-gradient(135deg, #991b1b, #ef4444)",
                boxShadow: isGranted
                  ? "0 0 60px rgba(34, 197, 94, 0.4), 0 0 120px rgba(34, 197, 94, 0.15)"
                  : "0 0 60px rgba(239, 68, 68, 0.4), 0 0 120px rgba(239, 68, 68, 0.15)",
              }}
            >
              {isGranted ? (
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            {/* Status Text */}
            <div style={{ textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "42px",
                  fontWeight: 800,
                  color: isGranted ? "#4ade80" : "#f87171",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  margin: 0,
                  textShadow: isGranted
                    ? "0 0 30px rgba(74, 222, 128, 0.3)"
                    : "0 0 30px rgba(248, 113, 113, 0.3)",
                }}
              >
                {isGranted ? "Access Succeeded" : "Access Denied"}
              </h1>
            </div>

            {/* Member Info */}
            {scanResult.member && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "16px",
                  padding: "20px 40px",
                  border: `1px solid ${isGranted ? "rgba(74, 222, 128, 0.2)" : "rgba(248, 113, 113, 0.2)"}`,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "22px",
                    fontWeight: 600,
                    margin: "0 0 6px 0",
                  }}
                >
                  {scanResult.member.firstName} {scanResult.member.lastName}
                </p>
                <p
                  style={{
                    color: "rgba(148, 163, 184, 0.8)",
                    fontSize: "13px",
                    margin: "0 0 8px 0",
                    letterSpacing: "1px",
                  }}
                >
                  ID: {scanResult.member.id}
                </p>
                {scanResult.subscription && (
                  <p
                    style={{
                      color: isGranted ? "#86efac" : "#fca5a5",
                      fontSize: "14px",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {scanResult.subscription.planName} • {scanResult.subscription.remainingSessions} sessions left
                  </p>
                )}
                {scanResult.reason && (
                  <p
                    style={{
                      color: "#fca5a5",
                      fontSize: "14px",
                      fontWeight: 600,
                      margin: "4px 0 0 0",
                    }}
                  >
                    {scanResult.reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== SUBSCRIPTION SELECTION MODAL ========== */}
      {pendingSelection && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #1e293b, #0f172a)",
              borderRadius: "20px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              width: "100%",
              maxWidth: "480px",
              margin: "0 24px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <div
              style={{
                padding: "24px 28px 16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <h3
                style={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 0 6px 0",
                }}
              >
                Select Subscription
              </h3>
              <p style={{ color: "rgba(148, 163, 184, 0.8)", margin: 0, fontSize: "14px" }}>
                {pendingSelection.member.firstName}{" "}
                {pendingSelection.member.lastName} has multiple active subscriptions
              </p>
            </div>
            <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingSelection.subscriptions.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubscriptionSelect(sub.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(59, 130, 246, 0.15)";
                    (e.target as HTMLElement).style.borderColor = "rgba(59, 130, 246, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.04)";
                    (e.target as HTMLElement).style.borderColor = "rgba(59, 130, 246, 0.2)";
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                      {sub.planName}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(148, 163, 184, 0.8)" }}>
                      {sub.endDate && `Expires: ${new Date(sub.endDate).toLocaleDateString()}`}
                      {sub.planType === "SESSION_BASED" && ` • ${sub.remainingSessions} sessions left`}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: sub.planType === "SESSION_BASED" ? "#7c3aed" : "#0d9488",
                      color: "white",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub.planType === "SESSION_BASED" ? "Session" : "Time-Based"}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setPendingSelection(null)}
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  color: "rgba(148, 163, 184, 0.8)",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
