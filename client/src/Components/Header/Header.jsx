import React, { useContext } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { userProvider } from "../../Context/UserProvider";
import logo from "../../Images/evangadi-logo-header.png";
import "./Header.css";

function Header() {
  const { user, logout, isAuthenticated } = useContext(userProvider);
  const navigate = useNavigate();

  function handleAuthClick() {
    if (isAuthenticated) {
      logout();
    } else {
      navigate("/register");
    }
  }

  return (
    <Navbar expand="lg" className="navbar" fixed="top" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img src={logo} alt="Logo" className="navbar-logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggler-icon">
          <span>
            <i className="fas fa-bars" style={{ color: "black", fontSize: "2em" }}></i>
          </span>
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="black link">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/how-it-works" className="black link">
              How it Works
            </Nav.Link>
          </Nav>
          <Nav className="m-0 m-md-3">
            <button className="btn btn-success" style={{fontSize:"1vw", lineHeight:"1"}} onClick={handleAuthClick}>
              {user.userName ? `Hello ${user.userName} - Sign Out` : "Sign In"}
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
