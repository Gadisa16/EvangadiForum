import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

function BackButton() {
  const navigate = useNavigate();


  return (
    <button
    id="back-button"
    style={{ display: "flex", alignItems: "center", textDecoration: "none", background: "none", border: "none", cursor: "pointer" }}
    onClick={() => navigate(-1)}
    >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="Close" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0003 29.3346H20.0003C26.667 29.3346 29.3337 26.668 29.3337 20.0013V12.0013C29.3337 5.33464 26.667 2.66797 20.0003 2.66797H12.0003C5.33366 2.66797 2.66699 5.33464 2.66699 12.0013V20.0013C2.66699 26.668 5.33366 29.3346 12.0003 29.3346Z" stroke="#292D32" strokeWidth="2.5"></path>
            <path d="M17.6797 20.7063L12.9863 15.9996L17.6797 11.293" stroke="#292D32" strokeWidth="2.5"></path>
        </svg>
        <span style={{ fontFamily: "Poppins", fontSize: 16, color: "#292D32", fontWeight: "bold", marginLeft: 4 }}>
            Back
        </span>
    </button>
  );
}

export default BackButton;