import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { userProvider } from "../../Context/UserProvider";
import "./SignIn.css";

function SignIn({ toggleForm }) {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { login } = useContext(userProvider);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  async function onSubmit(data) {
    setError("");
    const result = await login({
      password: data.password,
      email: data.email,
    });

    if (!result.success) {
      setError(result.error);
    }
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

          <i onClick={togglePasswordVisibility} style={{ cursor: "pointer", position: "absolute", right: "112px", top: "10px" }}>
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
        
        {error && <div className="text-danger">{error}</div>}

        <button className="login__signInButton" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default SignIn;