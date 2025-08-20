import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import Navbar from "../components/Navbar";
import Logo from "../assets/Logo.png";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔹 Cek kalau sudah login, langsung ke /admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/admin", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("isLoggedIn", "true");
      navigate("/admin", { replace: true }); // 🔹 Hapus login dari history
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("Email tidak terdaftar!");
      } else if (err.code === "auth/wrong-password") {
        setError("Kata sandi salah!");
      }
      // 🔹 Tidak menampilkan pesan error umum
    }
  };

  return (
    <div className="login-container">
       <Navbar />
      <div className="login-card">
        <img src={Logo} alt="Logo" className="login-logo" />
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
