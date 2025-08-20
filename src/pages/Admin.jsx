import React, { useState, useEffect } from "react";
import "../styles/Admin.css";
import logoutLogo from "../assets/Logo.png"; 
import { auth, db } from "../firebase"; // import firebase config
import { signOut } from "firebase/auth"; // import fungsi sign out
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function Admin() {
  // State untuk menu aktif
  const [activeMenu, setActiveMenu] = useState("dashboard");
  
  // State untuk upload
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State untuk list naskah
  const [naskahList, setNaskahList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // State untuk notifikasi tengah
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success', 'error'
    message: ''
  });

  // Function untuk menampilkan notifikasi
  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message
    });
    
    // Auto hide setelah 3 detik
    setTimeout(() => {
      setNotification({
        show: false,
        type: '',
        message: ''
      });
    }, 3000);
  };

  // Fetch naskah list
  const fetchNaskahList = async () => {
    try {
      setLoadingList(true);
      const querySnapshot = await getDocs(collection(db, "naskah"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNaskahList(data);
    } catch (error) {
      console.error("Error fetching naskah:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // Function untuk refresh data setelah upload berhasil
  const refreshNaskahData = () => {
    fetchNaskahList();
  };

  // Load naskah list saat component mount dan ketika menu berubah ke list
  useEffect(() => {
    // Fetch data saat component pertama kali dimount untuk dashboard
    fetchNaskahList();
  }, []);

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
      showNotification('error', 'Judul, kategori, dan file wajib diisi!');
      return;
    }

    // Validasi ukuran file (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showNotification('error', 'Ukuran file terlalu besar! Maksimal 10MB.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Update progress untuk start upload
      setUploadProgress(10);

      // Upload PDF ke Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "pusaka");

      // Update progress untuk upload ke Cloudinary
      setUploadProgress(30);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dn1oejv6r/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      // Update progress setelah upload selesai
      setUploadProgress(60);

      const data = await response.json();
      console.log("Cloudinary response:", data);

      // Ambil data halaman
      const publicId = data.public_id;
      const totalPages = data.pages || 1;

      // Update progress untuk processing images
      setUploadProgress(75);

      // URL base Cloudinary untuk gambar
      const baseUrl = `https://res.cloudinary.com/dn1oejv6r/image/upload`;
      const imageUrls = [];

      for (let i = 1; i <= totalPages; i++) {
        imageUrls.push(`${baseUrl}/pg_${i}/${publicId}.jpg`);
      }

      // Ambil thumbnail (halaman pertama)
      const thumbnailUrl = imageUrls[0];

      // Update progress untuk saving ke database
      setUploadProgress(90);

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

      // Upload selesai 100%
      setUploadProgress(100);

      showNotification('success', '✅ Naskah berhasil diunggah!');
      
      // Refresh data naskah untuk update dashboard
      refreshNaskahData();
      
      // Reset form dan progress
      setTimeout(() => {
        setJudul("");
        setDeskripsi("");
        setKategori("");
        setFile(null);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      showNotification('error', '❌ Gagal mengunggah naskah!');
      setUploadProgress(0);
    }

    setLoading(false);
  };

  // Handle edit naskah
  const handleEdit = (naskah) => {
    setEditingId(naskah.id);
    setEditForm({
      judul: naskah.judul,
      deskripsi: naskah.deskripsi,
      kategori: naskah.kategori
    });
  };

  // Handle update naskah
  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "naskah", id), {
        judul: editForm.judul,
        deskripsi: editForm.deskripsi,
        kategori: editForm.kategori,
        updatedAt: new Date()
      });
      setEditingId(null);
      setEditForm({});
      fetchNaskahList(); // Refresh list
      showNotification('success', '✅ Naskah berhasil diperbarui!');
    } catch (error) {
      console.error("Error updating naskah:", error);
      showNotification('error', '❌ Gagal memperbarui naskah!');
    }
  };

  // Handle delete naskah
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "naskah", id));
      setDeleteConfirm(null);
      fetchNaskahList(); // Refresh list
      showNotification('success', '✅ Naskah berhasil dihapus!');
    } catch (error) {
      console.error("Error deleting naskah:", error);
      showNotification('error', '❌ Gagal menghapus naskah!');
    }
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
                  disabled={loading}
                />
                <small>1. Format yang diterima: PDF (maksimal 10MB)</small>
                <small>2. Pastikan satu halaman file berisi satu halaman naskah</small>
              </div>

              {loading && (
                <div className="progress-container">
                  <div className="progress-label">
                    Mengunggah naskah... {uploadProgress}%
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={`upload-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? "Mengunggah..." : "Upload Naskah"}
              </button>
            </form>
          </div>
        );
      
      case "list":
        return (
          <div className="list-section">
            <h2>📋 List Naskah</h2>
            {loadingList ? (
              <div className="loading-message">Memuat data naskah...</div>
            ) : (
              <>
                <div className="naskah-count">
                  Total Naskah: <span className="count-number">{naskahList.length}</span>
                </div>
                {naskahList.length === 0 ? (
                  <div className="empty-list">
                    <p>Belum ada naskah yang diunggah.</p>
                    <button 
                      className="upload-redirect-btn"
                      onClick={() => setActiveMenu("upload")}
                    >
                      Upload Naskah Pertama
                    </button>
                  </div>
                ) : (
                  <div className="naskah-table-container">
                    <table className="naskah-table">
                      <thead>
                        <tr>
                          <th>Thumbnail</th>
                          <th>Judul</th>
                          <th>Kategori</th>
                          <th>Deskripsi</th>
                          <th>Halaman</th>
                          <th>Upload Date</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {naskahList.map((naskah) => (
                          <tr key={naskah.id}>
                            <td>
                              {naskah.thumbnail && (
                                <img
                                  src={naskah.thumbnail}
                                  alt={naskah.judul}
                                  className="table-thumbnail"
                                />
                              )}
                            </td>
                            <td>
                              {editingId === naskah.id ? (
                                <input
                                  type="text"
                                  value={editForm.judul}
                                  onChange={(e) => setEditForm({...editForm, judul: e.target.value})}
                                  className="edit-input"
                                />
                              ) : (
                                <div className="naskah-title">{naskah.judul}</div>
                              )}
                            </td>
                            <td>
                              {editingId === naskah.id ? (
                                <select
                                  value={editForm.kategori}
                                  onChange={(e) => setEditForm({...editForm, kategori: e.target.value})}
                                  className="edit-select"
                                >
                                  <option value="sejarah">Sejarah</option>
                                  <option value="sastra">Sastra</option>
                                  <option value="agama">Agama</option>
                                  <option value="budaya">Budaya</option>
                                  <option value="hukum">Hukum</option>
                                  <option value="filsafat">Filsafat</option>
                                  <option value="bahasa">Bahasa</option>
                                  <option value="lainnya">Lainnya</option>
                                </select>
                              ) : (
                                <span className="kategori-badge">{naskah.kategori}</span>
                              )}
                            </td>
                            <td>
                              {editingId === naskah.id ? (
                                <textarea
                                  value={editForm.deskripsi}
                                  onChange={(e) => setEditForm({...editForm, deskripsi: e.target.value})}
                                  className="edit-textarea"
                                  rows="2"
                                />
                              ) : (
                                <div className="naskah-description">
                                  {naskah.deskripsi ? 
                                    (naskah.deskripsi.length > 50 ? 
                                      naskah.deskripsi.substring(0, 50) + "..." : 
                                      naskah.deskripsi
                                    ) : 
                                    "Tidak ada deskripsi"
                                  }
                                </div>
                              )}
                            </td>
                            <td className="text-center">{naskah.totalHalaman || 0}</td>
                            <td>
                              {naskah.uploadedAt ? 
                                new Date(naskah.uploadedAt.seconds * 1000).toLocaleDateString("id-ID") : 
                                "Tidak diketahui"
                              }
                            </td>
                            <td>
                              <div className="action-buttons">
                                {editingId === naskah.id ? (
                                  <>
                                    <button
                                      className="save-btn"
                                      onClick={() => handleUpdate(naskah.id)}
                                    >
                                      ✅ Simpan
                                    </button>
                                    <button
                                      className="cancel-btn"
                                      onClick={() => {
                                        setEditingId(null);
                                        setEditForm({});
                                      }}
                                    >
                                      ❌ Batal
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="view-btn"
                                      onClick={() => window.location.href = `/baca/${naskah.id}`}
                                      title="Lihat Naskah"
                                    >
                                      Lihat
                                    </button>
                                    <button
                                      className="edit-btn"
                                      onClick={() => handleEdit(naskah)}
                                      title="Edit Naskah"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() => setDeleteConfirm(naskah.id)}
                                      title="Hapus Naskah"
                                    >
                                      Hapus
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>⚠️ Konfirmasi Hapus</h3>
                  <p>Apakah Anda yakin ingin menghapus naskah ini?</p>
                  <p><strong>Tindakan ini tidak dapat dibatalkan!</strong></p>
                  <div className="modal-actions">
                    <button
                      className="confirm-delete-btn"
                      onClick={() => handleDelete(deleteConfirm)}
                    >
                      Ya, Hapus
                    </button>
                    <button
                      className="cancel-delete-btn"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="dashboard-section">
            <h1>Selamat Datang, Admin!</h1>
            <p>
              Gunakan menu di samping untuk mengelola konten naskah Anda.
              <br />
              Mulai dengan memilih menu <strong>Upload Naskah</strong> atau <strong>List Naskah</strong> di sebelah kiri.
            </p>
            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Naskah</h3>
                <p className="stat-number">{naskahList.length}</p>
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
      {/* Notifikasi Tengah */}
      {notification.show && (
        <div className="notification-overlay">
          <div className={`notification-content ${notification.type}`}>
            <p>{notification.message}</p>
          </div>
        </div>
      )}

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
            className={activeMenu === "list" ? "active" : ""}
            onClick={() => setActiveMenu("list")}
          >
            List Naskah
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