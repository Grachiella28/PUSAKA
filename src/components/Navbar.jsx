import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/Logo.png";

const Navbar = React.forwardRef((props, ref) => {
    return (
        <nav className="navbar" ref={ref}>
            <div className="navbar-container">
                <div className="navbar-logo">
                    <NavLink to="/" end>
                        <img src={logo} alt="Logo" className="logo-img" />
                    </NavLink>
                    <span className="logo-text">PUSAKA</span>
                </div>
                <ul className="navbar-menu">
                    <li>
                        <NavLink to="/login">Admin</NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
});

export default Navbar;
