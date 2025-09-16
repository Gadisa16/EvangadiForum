import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { userProvider } from "../../Context/UserProvider";
import SignIn from "../SignIn/SignIn";
import SignUp from "../SignUp/SignUp";
import "./Landing.css";

function Landing() {
  const { user, logout } = useContext(userProvider);
  const [showSignIn, setSignIn] = useState(true);

  function toggleForm() {
    setSignIn((prevState) => !prevState);
  }

  return (
    <div className="home">
      <div className="container">
        <div className="p-4 row">
          {showSignIn ? (
            <SignIn key="signIn" toggleForm={toggleForm} />
          ) : (
            <SignUp key="signUp" toggleForm={toggleForm} />
          )}

          <div className="info col col-md pb-sm-5">
            <a href="https://example.com" className="about" target="_blank" >About</a>
            <h1 className="network pb-3">Evangadi Networks</h1>
            <p>
              No matter what stage of life you are in, whether you're just
              starting elementary school or being promoted to CEO of a Fortune
              500 company, you have much to offer to those who are trying to
              follow in your footsteps.
            </p>

            <p className="pl">
              Whether you are willing to share your knowledge or you are just
              looking to meet mentors of your own, please start by joining the
              network here.
            </p>
            
            <Link to="/how-it-works">
              <button className="works">HOW IT WORKS</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
