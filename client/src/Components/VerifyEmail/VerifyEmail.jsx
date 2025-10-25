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
  const navigate = useNavigate();

  const resend = async () => {
    try {
      await axios.post("/email/resend-otp", { email });
      toast.success("OTP sent");
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
      <div className="d-flex mt-4 align-items-center mb-3">
        <BackButton />
        <h4>Verify your email</h4>
      </div>
      <p>Code sent to: {email || "Unknown email"}</p>
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
      <button className="btn-link border-0 mt-2" onClick={resend} disabled={!email}>Resend code</button>
    </div>
  );
}