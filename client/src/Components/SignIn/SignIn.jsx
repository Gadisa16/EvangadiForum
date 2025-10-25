import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { userProvider } from "../../Context/UserProvider";
import "./SignIn.css";
import { toast } from "react-toastify";
import axios from "../../axios"; // <-- added

function SignIn({ toggleForm }) {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { login } = useContext(userProvider);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  async function onSubmit(data) {
    setError("");
    setIsLoading(true);

    const result = await login({
      password: data.password,
      email: data.email,
    });

    if (!result.success) {
      const msg = (result?.error || "").toString();
      const requiresVerification =
        result?.requiresVerification ||
        result?.status === 403 ||
        /verify/i.test(msg);

      if (requiresVerification) {
        try {
          await axios.post("/email/resend-otp", { email: data.email });
        } catch {
          // ignore resend error; user can try again on verify page
        }
        toast.info("We emailed you a 6-digit code.");
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}&auto=1`);
        setIsLoading(false);
        return;
      }

      toast.error(result.error || "Login failed. Try again.");
      setError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="login__container col-md">
      <h4>Login to your account </h4>
      <p>
        Don't have an account?
        <Link className="create ms-2" onClick={toggleForm}>
          Create a new account
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} style={{ position: "relative" }}>
        <input
          type="text"
          className={errors.email && "invalid"}
          placeholder=" Your Email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          })}
          onKeyUp={() => {
            trigger("email");
          }}
        />
        {errors.email && (
          <div className="text-danger">{errors.email.message}</div>
        )}
        
        <div className="pass_container" style={{ position: "relative" }}>
          <input
            type={passwordVisible ? "password" : "text"}
            className={` hide ${errors.password && "invalid"}`}
            placeholder=" Your Password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Minimum password length is 8",
              },
            })}
            onKeyUp={() => {
              trigger("password");
            }}
          />

          <i onClick={togglePasswordVisibility} style={{ cursor: "pointer", position: "absolute", right: "5vw", top: "10px" }}>
            {passwordVisible ? (
              <i className="fas fa-eye-slash" />
            ) : (
              <i className="fas fa-eye" />
            )}
          </i>

        </div>

        {errors.password && (
          <div className="text-danger">{errors.password.message}</div>
        )}
        
        {/* {error && <div className="text-danger">{error}</div>} */}

        <button className={`login__signInButton ${isLoading? "cursor-not-allowed":"cursor-pointer"}`} type="submit" disabled={isLoading}>
          {isLoading ? (
            <output className="spinner-border spinner-border-sm" aria-hidden="true"></output>
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
}

export default SignIn;