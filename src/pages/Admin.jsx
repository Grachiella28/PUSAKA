import React, { useState, useEffect } from "react";
import "../styles/Admin.css";
import logoutLogo from "../assets/Logo.png"; 
import { auth, db } from "../firebase"; // import firebase config
import { signOut } from "firebase/auth"; // import fungsi sign out
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function Admin() {
  // State untuk menu aktif
  const [activeMenu, setActiveMenu] = useState("dashboard");
  
  // State untuk mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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

  // Function untuk toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Function untuk close mobile sidebar ketika menu dipilih
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setIsMobileSidebarOpen(false);
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
                      onClick={() => handleMenuClick("upload")}
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
        // Calculate dashboard statistics
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const uploadedToday = naskahList.filter(naskah => {
          if (naskah.uploadedAt && naskah.uploadedAt.seconds) {
            const uploadDate = new Date(naskah.uploadedAt.seconds * 1000);
            return uploadDate >= todayStart;
          }
          return false;
        }).length;

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const uploadedThisMonth = naskahList.filter(naskah => {
          if (naskah.uploadedAt && naskah.uploadedAt.seconds) {
            const uploadDate = new Date(naskah.uploadedAt.seconds * 1000);
            return uploadDate >= thisMonth;
          }
          return false;
        }).length;

        // Calculate category statistics
        const categoryStats = naskahList.reduce((acc, naskah) => {
          const kategori = naskah.kategori || 'Lainnya';
          acc[kategori] = (acc[kategori] || 0) + 1;
          return acc;
        }, {});

        const totalPages = naskahList.reduce((total, naskah) => {
          return total + (naskah.totalHalaman || 0);
        }, 0);

        // Get recent uploads (last 5)
        const recentUploads = [...naskahList]
          .sort((a, b) => {
            const timeA = a.uploadedAt?.seconds || 0;
            const timeB = b.uploadedAt?.seconds || 0;
            return timeB - timeA;
          })
          .slice(0, 5);

        // Get most popular categories
        const popularCategories = Object.entries(categoryStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);

        return (
          <div className="dashboard-section">
            <div className="dashboard-header">
              <h1>📊 Dashboard Admin</h1>
              <p className="dashboard-subtitle">
                Selamat datang kembali! Berikut adalah ringkasan aktivitas sistem Pusaka Anda.
              </p>
            </div>

            {/* Main Stats Cards */}
            <div className="stats-cards">
              <div className="stat-card primary">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>Total Naskah</h3>
                  <p className="stat-number">{naskahList.length}</p>
                  <span className="stat-label">Naskah Tersimpan</span>
                </div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-icon">📤</div>
                <div className="stat-content">
                  <h3>Upload Hari Ini</h3>
                  <p className="stat-number">{uploadedToday}</p>
                  <span className="stat-label">Naskah Baru</span>
                </div>
              </div>
              
              <div className="stat-card info">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>Upload Bulan Ini</h3>
                  <p className="stat-number">{uploadedThisMonth}</p>
                  <span className="stat-label">Total Bulan Ini</span>
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-icon">📄</div>
                <div className="stat-content">
                  <h3>Total Halaman</h3>
                  <p className="stat-number">{totalPages.toLocaleString()}</p>
                  <span className="stat-label">Halaman Digitalisasi</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="dashboard-grid">
              {/* Recent Uploads */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🕒 Upload Terbaru</h3>
                  <span className="card-badge">{recentUploads.length}</span>
                </div>
                <div className="card-content">
                  {recentUploads.length > 0 ? (
                    <div className="recent-list">
                      {recentUploads.map((naskah, index) => (
                        <div key={naskah.id} className="recent-item">
                          <div className="recent-thumbnail">
                            {naskah.thumbnail ? (
                              <img src={naskah.thumbnail} alt={naskah.judul} />
                            ) : (
                              <div className="thumbnail-placeholder">📄</div>
                            )}
                          </div>
                          <div className="recent-info">
                            <h4>{naskah.judul}</h4>
                            <p>
                              <span className="category-tag">{naskah.kategori}</span>
                              <span className="page-count">{naskah.totalHalaman || 0} hal</span>
                            </p>
                            <small>
                              {naskah.uploadedAt ? 
                                new Date(naskah.uploadedAt.seconds * 1000).toLocaleDateString("id-ID") : 
                                "Tidak diketahui"
                              }
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Belum ada upload terbaru</p>
                      <button 
                        className="btn-primary-small"
                        onClick={() => handleMenuClick("upload")}
                      >
                        Upload Naskah
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Statistics */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>📊 Statistik Kategori</h3>
                  <span className="card-badge">{Object.keys(categoryStats).length}</span>
                </div>
                <div className="card-content">
                  {popularCategories.length > 0 ? (
                    <div className="category-stats">
                      {popularCategories.map(([category, count], index) => (
                        <div key={category} className="category-item">
                          <div className="category-info">
                            <span className="category-name">{category}</span>
                            <span className="category-count">{count} naskah</span>
                          </div>
                          <div className="category-bar">
                            <div 
                              className="category-progress" 
                              style={{ 
                                width: `${(count / naskahList.length) * 100}%`,
                                backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                              }}
                            ></div>
                          </div>
                          <span className="category-percentage">
                            {Math.round((count / naskahList.length) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Belum ada kategori</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>⚡ Aksi Cepat</h3>
                </div>
                <div className="card-content">
                  <div className="quick-actions">
                    <button 
                      className="action-btn upload-btn-action"
                      onClick={() => handleMenuClick("upload")}
                    >
                      <span className="action-icon">📤</span>
                      <span className="action-text">Upload Naskah</span>
                    </button>
                    <button 
                      className="action-btn list-btn-action"
                      onClick={() => handleMenuClick("list")}
                    >
                      <span className="action-icon">📋</span>
                      <span className="action-text">Kelola Naskah</span>
                    </button>
                    <button 
                      className="action-btn website-btn-action"
                      onClick={goToWebsite}
                    >
                      <span className="action-icon">🌐</span>
                      <span className="action-text">Lihat Website</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>ℹ️ Informasi Sistem</h3>
                </div>
                <div className="card-content">
                  <div className="system-info">
                    <div className="info-item">
                      <span className="info-label">Status Sistem:</span>
                      <span className="info-value status-online">🟢 Online</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kategori Tersedia:</span>
                      <span className="info-value">8 Kategori</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Format Didukung:</span>
                      <span className="info-value">PDF (Max 10MB)</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Update:</span>
                      <span className="info-value">{new Date().toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="dashboard-card tips-card">
              <div className="card-header">
                <h3>💡 Tips & Panduan</h3>
              </div>
              <div className="card-content">
                <div className="tips-grid">
                  <div className="tip-item">
                    <div className="tip-icon">📝</div>
                    <h4>Upload Berkualitas</h4>
                    <p>Pastikan PDF memiliki resolusi yang baik dan satu halaman per file untuk hasil optimal.</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">🏷️</div>
                    <h4>Kategorisasi</h4>
                    <p>Pilih kategori yang tepat agar naskah mudah ditemukan oleh pengunjung website.</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">📄</div>
                    <h4>Deskripsi Lengkap</h4>
                    <p>Tambahkan deskripsi yang informatif untuk memberikan context naskah kepada pembaca.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={toggleMobileSidebar}></div>
      )}

      {/* Notifikasi Tengah */}
      {notification.show && (
        <div className="notification-overlay">
          <div className={`notification-content ${notification.type}`}>
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-title">Admin Pusaka</div>
        <ul>
          <li 
            className={activeMenu === "dashboard" ? "active" : ""}
            onClick={() => handleMenuClick("dashboard")}
          >
            Dashboard
          </li>
          <li 
            className={activeMenu === "upload" ? "active" : ""}
            onClick={() => handleMenuClick("upload")}
          >
            Upload Naskah
          </li>
          <li 
            className={activeMenu === "list" ? "active" : ""}
            onClick={() => handleMenuClick("list")}
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
          {/* Mobile Hamburger Menu */}
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileSidebar}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

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