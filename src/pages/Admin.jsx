import React, { useState } from "react";
import "../styles/Admin.css";
import logoutLogo from "../assets/Logo.png"; 
import { auth, db } from "../firebase"; // import firebase config
import { signOut } from "firebase/auth"; // import fungsi sign out
import { collection, addDoc } from "firebase/firestore";

export default function Admin() {
  // State untuk menu aktif
  const [activeMenu, setActiveMenu] = useState("dashboard");
  
  // State untuk upload
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!judul || !file || !kategori) {
      alert("Judul, kategori, dan file wajib diisi!");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      // Upload PDF ke Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "pusaka");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dn1oejv6r/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Cloudinary response:", data);

      // Ambil data halaman
      const publicId = data.public_id;
      const totalPages = data.pages || 1;

      // URL base Cloudinary untuk gambar
      const baseUrl = `https://res.cloudinary.com/dn1oejv6r/image/upload`;
      const imageUrls = [];

      for (let i = 1; i <= totalPages; i++) {
        imageUrls.push(`${baseUrl}/pg_${i}/${publicId}.jpg`);
      }

      // Ambil thumbnail (halaman pertama)
      const thumbnailUrl = imageUrls[0];

      // Simpan metadata ke Firestore
      await addDoc(collection(db, "naskah"), {
        judul,
        deskripsi,
        kategori,
        totalHalaman: totalPages,
        url_pdf: data.secure_url,
        halaman: imageUrls,
        thumbnail: thumbnailUrl,
        uploadedAt: new Date(),
      });

      setSuccessMsg("✅ Naskah berhasil diunggah!");
      setJudul("");
      setDeskripsi("");
      setKategori("");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengunggah naskah.");
    }

    setLoading(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "upload":
        return (
          <div className="upload-section">
            <h2>📤 Upload Naskah</h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label>Judul Naskah:</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul naskah"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori:</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  <option value="sejarah">Sejarah</option>
                  <option value="sastra">Sastra</option>
                  <option value="agama">Agama</option>
                  <option value="budaya">Budaya</option>
                  <option value="hukum">Hukum</option>
                  <option value="filsafat">Filsafat</option>
                  <option value="bahasa">Bahasa</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div className="form-group">
                <label>Deskripsi:</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Masukkan deskripsi naskah (opsional)"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>File PDF:</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
                <small>Format yang diterima: PDF (maksimal 50MB)</small>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`upload-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? "Mengunggah..." : "Upload Naskah"}
              </button>

              {successMsg && <div className="success-message">{successMsg}</div>}
            </form>
          </div>
        );
      
      case "delete":
        return (
          <div className="delete-section">
            <h2>🗑️ Hapus Naskah</h2>
            <p>Fitur hapus naskah sedang dalam pengembangan.</p>
          </div>
        );
      
      default:
        return (
          <div className="dashboard-section">
            <h1>Selamat Datang, Admin!</h1>
            <p>
              Gunakan menu di samping untuk mengelola konten naskah Anda.
              <br />
              Mulai dengan memilih menu <strong>Upload Naskah</strong> di sebelah kiri.
            </p>
            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Naskah</h3>
                <p className="stat-number">-</p>
              </div>
              <div className="stat-card">
                <h3>Upload Hari Ini</h3>
                <p className="stat-number">-</p>
              </div>
              <div className="stat-card">
                <h3>Kategori</h3>
                <p className="stat-number">8</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-title">Admin Pusaka</div>
        <ul>
          <li 
            className={activeMenu === "dashboard" ? "active" : ""}
            onClick={() => setActiveMenu("dashboard")}
          >
            Dashboard
          </li>
          <li 
            className={activeMenu === "upload" ? "active" : ""}
            onClick={() => setActiveMenu("upload")}
          >
            Upload Naskah
          </li>
          <li 
            className={activeMenu === "delete" ? "active" : ""}
            onClick={() => setActiveMenu("delete")}
          >
            Hapus Naskah
          </li>
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}