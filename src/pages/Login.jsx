import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import Logo from "../assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (email === "admin@example.com" && password === "123456") {
        localStorage.setItem("isLoggedIn", "true");
        navigate("/admin");
      } else {
        setError("Email atau password salah!");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat login.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={Logo} alt="Logo" className="login-logo" />
        {/* Judul "Login" dihilangkan */}
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Kata Sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="login-button">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
