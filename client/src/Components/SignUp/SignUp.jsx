import React, { useState } from "react";
import "./SignUp.css";
import axios from "../../axios.js";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

function SignUp({ toggleForm }) {
  const [errorResponse, setError] = useState("");
  const [successResponse, setSuccess] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  async function onSubmit(data) {
    if (!isAgreed) {
      setError("You must agree to the privacy policy and terms of service.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("/users/register", {
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname || '',
        password: data.password,
        email: data.email,
      });

      toast.success("User registered successfully!");
      setSuccess("User registered successfully!");
      reset();
      toggleForm();
    } catch (error) {
      console.log("registration",error);
      toast.error(error?.message || "Registration failed. Try again.");
      setError(error?.response?.data?.msg || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="login__container container col-sm-12 col-md">
      <h4>Join the network </h4>
      <p>
        Already have an account?
        <Link className="create ms-2" onClick={toggleForm}>
          Sign in
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.email && (
          <div>
            <small className="text-danger">{errors.email.message}</small>
          </div>
        )}
        <input
          type="text"
          className={errors.email && "invalid"}
          placeholder=" Your Email *"
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

        <input
          className={`first-name ${errors.firstname && "invalid"}`}
          type="text"
          placeholder="First Name *"
          {...register("firstname", {
            required: "First name  is required",
          })}
          onKeyUp={() => {
            trigger("firstname");
          }}
        />

        <input
          className={`last-name ${errors.lastname && "invalid"}`}
          type="text"
          placeholder="Last Name"
          {...register("lastname")}
          onKeyUp={() => {
            trigger("lastname");
          }}
        />

        {errors.password && (
          <div>
            <small className="text-danger">{errors.password.message}</small>
          </div>
        )}
        <div className="pass_container" style={{ position: "relative" }}>
          <input
            type={passwordVisible ? "password" : "text"}
            className={`hide ${errors.password && "invalid"}`}
            placeholder=" Your Password *"
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

        {errors.username && (
          <div>
            <small className="text-danger">{errors.username.message}</small>
          </div>
        )}
        <input
          type="text"
          className={errors.username && "invalid"}
          placeholder="User name *"
          {...register("username", {
            required: "Username  is required",
          })}
          onKeyUp={() => {
            trigger("username");
          }}
        />

        {errorResponse && (
          <div>
            <small className="text-danger">{errorResponse}</small>
          </div>
        )}

        {successResponse && (
          <div>
            <small className="text-success">{successResponse}</small>
          </div>
        )}

        <div className="form-check d-flex justify-content-center align-items-center" style={{gap:"1.2vw"}}>
          <input
            type="checkbox"
            className="form-check-input"
            id="agreement"
            style={{cursor:"pointer"}}
            checked={isAgreed}
            onChange={() => setIsAgreed(!isAgreed)}
          />
          <label className="form-check-label" htmlFor="agreement">
            I agree to the{" "}
            <Link className="create" to="https://www.evangadi.com/legal/privacy/" target="_blank">
              privacy policy
            </Link>
            {"  "} and{"  "}
            <Link className="create" to="https://www.evangadi.com/legal/terms/" target="_blank">
              terms of service.
            </Link>
          </label>
        </div>

        <button className="login__signInButton" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            "Agree and Join"
          )}
        </button>
      </form>
    </div>
  );
}

export default SignUp;