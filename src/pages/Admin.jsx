import React from "react";
import "../styles/Admin.css";
import logoutLogo from "../assets/Logo.png"; 
import { auth } from "../firebase"; // import firebase config
import { signOut } from "firebase/auth"; // import fungsi sign out

export default function Admin() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isLoggedIn"); // hapus status login lokal
      window.location.href = "/login"; // arahkan ke halaman login
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const goToWebsite = () => {
    window.location.href = "/";
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-title">Admin Pusaka</div>
        <ul>
          <li>Admin</li>
          <li>Upload Naskah</li>
          <li>Delete Naskah</li>
          <li onClick={handleLogout} style={{ cursor: "pointer", color: "red" }}>
            Logout
          </li>
        </ul>
      </aside>

      {/* Main Area */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <span>Halo, Admin</span>
          <div className="header-actions">
            <img
              src={logoutLogo}
              alt="Logo"
              className="logout-logo"
              onClick={goToWebsite}
              style={{ cursor: "pointer" }}
            />
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          <h1>Selamat Datang, Admin!</h1>
          <p>
            Gunakan menu di samping untuk mengelola konten naskah Anda.
            <br />
            Mulai dengan memilih menu <strong>Upload Naskah</strong> di sebelah kiri.
          </p>
        </main>
      </div>
    </div>
  );
}
