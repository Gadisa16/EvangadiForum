import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../../axios";
import BackButton from "../BackButton/BackButton";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const auto = params.get("auto") === "1";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState({ enabled: false, code: "" });
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(0); // in seconds
  const navigate = useNavigate();

  const resend = async () => {
    try {
      const r = await axios.post("/email/resend-otp", { email });
      toast.success("OTP sent");
      const ts = r?.data?.expiresAt;
      if (ts) setExpiresAt(ts);
    } catch (e) {
      console.log("resend-otp", e);
      toast.error(e?.response?.data?.msg || "Could not send OTP");
    }
  };

  useEffect(() => {
    if (email && auto) {
      resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, auto]);

  useEffect(() => {
    axios
      .get("/email/demo-config")
      .then((r) => {
        const data = r?.data || {};
        if (data.success && data.enabled) {
          setDemo({ enabled: true, code: data.code || "" });
          // If no server-provided expiresAt yet, synthesize one from ttlSeconds for demo UX
          if (!expiresAt && data.ttlSeconds) {
            const until = new Date(Date.now() + data.ttlSeconds * 1000).toISOString();
            setExpiresAt(until);
          }
        }
      })
      .catch(() => {});
  }, []);

  // countdown effect
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/email/verify-email", { email, otp });
      toast.success("Email verified. You can sign in now.");
      navigate("/");
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-page container" style={{ maxWidth: 520 }}>
      {demo.enabled && (
        <div className="demo-banner" role="alert" aria-live="polite">
          <strong>Demo mode:</strong> This is my portfolio demo. Because I don’t have a custom
          email domain set up on production and free hosting can block SMTP, I use a
          fixed verification code so you can try the app without email hurdles.
          Use code
          <span className="demo-code"> {demo.code || "123456"} </span>
          to verify.
        </div>
      )}
      <div className="d-flex mt-4 align-items-center mb-3">
        <BackButton />
        <h4>Verify your email</h4>
      </div>
      <p>Code sent to: {email || "Unknown email"}</p>
      {remaining > 0 && (
        <div className="text-muted mb-2" style={{ fontSize: 14 }}>
          Code expires in {Math.floor(remaining / 60)}:
          {(remaining % 60).toString().padStart(2, "0")}
        </div>
      )}
      <form onSubmit={submit}>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="form-control mb-3"
        />
        <button className="btn btn-primary w-100" disabled={loading || otp.length !== 6 || !email}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
      <button className="btn-link border-0 mt-2" onClick={resend} disabled={!email || remaining > 0}>
        {remaining > 0 ? `Resend available in ${remaining}s` : "Resend code"}
      </button>
    </div>
  );
}