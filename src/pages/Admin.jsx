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
  
  // State untuk edit modal - diubah dari inline editing
  const [editModal, setEditModal] = useState({
    show: false,
    naskah: null,
    form: {
      judul: "",
      deskripsi: "",
      kategori: ""
    },
    loading: false
  });
  
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

    // Validasi ukuran file (100MB = 100 * 1024 * 1024 bytes)
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

  // Handle edit naskah - Buka modal edit
  const handleEdit = (naskah) => {
    setEditModal({
      show: true,
      naskah: naskah,
      form: {
        judul: naskah.judul,
        deskripsi: naskah.deskripsi || "",
        kategori: naskah.kategori
      },
      loading: false
    });
  };

  // Handle close edit modal
  const closeEditModal = () => {
    setEditModal({
      show: false,
      naskah: null,
      form: {
        judul: "",
        deskripsi: "",
        kategori: ""
      },
      loading: false
    });
  };

  // Handle form change di edit modal
  const handleEditFormChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value
      }
    }));
  };

  // Handle update naskah dari modal
  const handleUpdateFromModal = async () => {
    if (!editModal.form.judul.trim() || !editModal.form.kategori) {
      showNotification('error', 'Judul dan kategori wajib diisi!');
      return;
    }

    setEditModal(prev => ({ ...prev, loading: true }));

    try {
      await updateDoc(doc(db, "naskah", editModal.naskah.id), {
        judul: editModal.form.judul.trim(),
        deskripsi: editModal.form.deskripsi.trim(),
        kategori: editModal.form.kategori,
        updatedAt: new Date()
      });
      
      closeEditModal();
      fetchNaskahList(); // Refresh list
      showNotification('success', '✅ Naskah berhasil diperbarui!');
    } catch (error) {
      console.error("Error updating naskah:", error);
      showNotification('error', '❌ Gagal memperbarui naskah!');
    } finally {
      setEditModal(prev => ({ ...prev, loading: false }));
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
                              <div className="naskah-title">{naskah.judul}</div>
                            </td>
                            <td>
                              <span className="kategori-badge">{naskah.kategori}</span>
                            </td>
                            <td>
                              <div className="naskah-description">
                                {naskah.deskripsi ? 
                                  (naskah.deskripsi.length > 50 ? 
                                    naskah.deskripsi.substring(0, 50) + "..." : 
                                    naskah.deskripsi
                                  ) : 
                                  "Tidak ada deskripsi"
                                }
                              </div>
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

      case "manual":
        return (
          <div className="manual-section">
            <div className="manual-header">
              <h2>📖 Manual Book</h2>
              <p className="manual-subtitle">
                Panduan lengkap penggunaan sistem admin Pusaka
              </p>
            </div>

            <div className="manual-content">
              {/* Complete Manual Section */}
              <div className="complete-manual-section">
                <div className="complete-manual-card">
                  <div className="complete-manual-header">
                    <div className="complete-manual-icon">📚</div>
                    <div className="complete-manual-info">
                      <h3>Manual Book Lengkap</h3>
                      <p>Panduan komprehensif untuk semua fitur sistem admin Pusaka</p>
                    </div>
                  </div>
                  <div className="complete-manual-actions">
                    <a 
                      href="https://res.cloudinary.com/dn1oejv6r/image/upload/v1756694687/Manual_Book_Admin_PUSAKA_-_PDF_Version_xwkj8z.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="manual-action-btn download"
                    >
                      {/* <span className="btn-icon">👀</span> */}
                      <span className="btn-text">Lihat Online</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="faq-section">
                <h3>❓ FAQ (Frequently Asked Questions)</h3>
                <div className="faq-list">
                  <div className="faq-item">
                    <h4>Bagaimana cara mengubah ukuran maksimal file upload?</h4>
                    <p>Ukuran maksimal file saat ini adalah 10MB. Ini merupakan limit default yang ditetapkan dari cloud storage (cloudinary)</p>
                  </div>
                  <div className="faq-item">
                    <h4>Mengapa gambar naskah tidak muncul?</h4>
                    <p>Pastikan koneksi internet stabil dan file PDF tidak corrupt. Kemungkinan hal ini disebabkan karena ukuran file yang besar.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Apakah file PDF yang sudah diupload bisa diganti?</h4>
                    <p>Tidak bisa, jika ingin mengubah file PDFnya silahkan hapus data lama dan upload ulang yang baru.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Apakah bisa upload file selain PDF?</h4>
                    <p>Saat ini sistem hanya mendukung format PDF.</p>
                  </div>
                </div>
              </div>

          
            </div>
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
                      className="action-btn manual-btn-action"
                      onClick={() => handleMenuClick("manual")}
                    >
                      <span className="action-icon">📖</span>
                      <span className="action-text">Manual Book</span>
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
                  <div className="tip-item">
                    <div className="tip-icon">📖</div>
                    <h4>Lihat Manual Book</h4>
                    <p>Baca manual book untuk panduan lengkap penggunaan sistem admin.</p>
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

      {/* Edit Modal */}
      {editModal.show && (
        <div className="modal-overlay">
          <div className="edit-modal-content">
            <div className="edit-modal-header">
              <h3>✏️ Edit Naskah</h3>
              <button 
                className="close-modal-btn"
                onClick={closeEditModal}
                disabled={editModal.loading}
              >
                ✕
              </button>
            </div>
            
            <div className="edit-modal-body">
              <div className="edit-form-group">
                <label>Judul Naskah <span className="required">*</span></label>
                <input
                  type="text"
                  value={editModal.form.judul}
                  onChange={(e) => handleEditFormChange('judul', e.target.value)}
                  placeholder="Masukkan judul naskah"
                  className="edit-modal-input"
                  disabled={editModal.loading}
                />
              </div>

              <div className="edit-form-group">
                <label>Kategori <span className="required">*</span></label>
                <select
                  value={editModal.form.kategori}
                  onChange={(e) => handleEditFormChange('kategori', e.target.value)}
                  className="edit-modal-select"
                  disabled={editModal.loading}
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
              </div>

              <div className="edit-form-group">
                <label>Deskripsi</label>
                <textarea
                  value={editModal.form.deskripsi}
                  onChange={(e) => handleEditFormChange('deskripsi', e.target.value)}
                  placeholder="Masukkan deskripsi naskah (opsional)"
                  className="edit-modal-textarea"
                  rows="6"
                  disabled={editModal.loading}
                />
              </div>

              {editModal.naskah && (
                <div className="edit-form-info">
                  <div className="info-row">
                    <span className="info-label">Total Halaman:</span>
                    <span className="info-value">{editModal.naskah.totalHalaman || 0} halaman</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Upload Date:</span>
                    <span className="info-value">
                      {editModal.naskah.uploadedAt ? 
                        new Date(editModal.naskah.uploadedAt.seconds * 1000).toLocaleDateString("id-ID") : 
                        "Tidak diketahui"
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="edit-modal-footer">
              <button
                className="cancel-edit-btn"
                onClick={closeEditModal}
                disabled={editModal.loading}
              >
                Batal
              </button>
              <button
                className="save-edit-btn"
                onClick={handleUpdateFromModal}
                disabled={editModal.loading || !editModal.form.judul.trim() || !editModal.form.kategori}
              >
                {editModal.loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Menyimpan...
                  </>
                ) : (
                  '💾 Simpan Perubahan'
                )}
              </button>
            </div>
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
          <li 
            className={activeMenu === "manual" ? "active" : ""}
            onClick={() => handleMenuClick("manual")}
          >
            Manual Book
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