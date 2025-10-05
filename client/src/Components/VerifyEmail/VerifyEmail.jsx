import React, { useState } from "react";
import axios from "../../axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/users/verify-email", { email, otp });
      toast.success("Email verified. You can sign in now.");
      navigate("/");
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await axios.post("/users/resend-otp", { email });
      toast.success("OTP sent");
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Could not send OTP");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h4>Verify your email</h4>
      <p>Code sent to: {email}</p>
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
        <button className="btn btn-primary w-100" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
      <button className="btn btn-link mt-2" onClick={resend}>Resend code</button>
    </div>
  );
}