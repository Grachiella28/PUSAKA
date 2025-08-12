import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img className="logo-img" src={logo} alt="Logo PUSAKA" />
          <span className="logo-text">PUSAKA</span>
        </div>
        <ul className="navbar-menu">
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
