import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/home.css";

const Home = () => {
    const [naskahList, setNaskahList] = useState([]);
    const [filteredNaskah, setFilteredNaskah] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedKategori, setSelectedKategori] = useState("all");
    const [activeTab, setActiveTab] = useState("all"); // all, rekomendasi, kategori
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Daftar kategori
    const kategoris = [
        { value: "all", label: "Semua Kategori" },
        { value: "sejarah", label: "Sejarah" },
        { value: "sastra", label: "Sastra" },
        { value: "agama", label: "Agama" },
        { value: "budaya", label: "Budaya" },
        { value: "hukum", label: "Hukum" },
        { value: "filsafat", label: "Filsafat" },
        { value: "bahasa", label: "Bahasa" },
        { value: "lainnya", label: "Lainnya" }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, "naskah"));
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setNaskahList(data);
                setFilteredNaskah(data);
            } catch (err) {
                console.error("Error fetching naskah:", err);
                setError("Gagal memuat data naskah.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter dan search functionality
    useEffect(() => {
        let result = naskahList;

        // Filter berdasarkan tab aktif
        if (activeTab === "rekomendasi") {
            // Rekomendasi berdasarkan naskah terbaru (5 terbaru)
            result = [...naskahList]
                .sort((a, b) => {
                    const dateA = a.uploadedAt?.seconds || 0;
                    const dateB = b.uploadedAt?.seconds || 0;
                    return dateB - dateA;
                })
                .slice(0, 6);
        } else if (activeTab === "kategori" && selectedKategori !== "all") {
            result = naskahList.filter(item => 
                item.kategori?.toLowerCase() === selectedKategori.toLowerCase()
            );
        }

        // Apply search filter
        if (searchTerm) {
            result = result.filter(item =>
                item.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.kategori?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredNaskah(result);
    }, [naskahList, searchTerm, selectedKategori, activeTab]);

    const handleOpenFlipbook = (id) => {
        navigate(`/baca/${id}`);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchTerm(""); // Reset search when changing tabs
        if (tab !== "kategori") {
            setSelectedKategori("all");
        }
        setMenuOpen(false); // Close menu after selection
    };

    const handleKategoriChange = (kategori) => {
        setSelectedKategori(kategori);
        setMenuOpen(false); // Close menu after selection
    };

    const getKategoriCount = (kategori) => {
        return naskahList.filter(item => 
            item.kategori?.toLowerCase() === kategori.toLowerCase()
        ).length;
    };

    const getCurrentDisplayTitle = () => {
        if (activeTab === "all") return "📚 Semua Naskah";
        if (activeTab === "rekomendasi") return "⭐ Naskah Rekomendasi";
        if (activeTab === "kategori") {
            const kategoriLabel = kategoris.find(k => k.value === selectedKategori)?.label || "Kategori";
            return `🗂️ ${kategoriLabel}`;
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && !event.target.closest('.filter-menu-container')) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <div>
            <Navbar />
            
            <div className="home-container">
                {/* Search Section with Filter Menu */}
                <div className="search-section">
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Cari naskah berdasarkan judul, deskripsi, atau kategori..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="search-icon">🔍</div>
                        </div>
                        
                        {/* Filter Menu Button */}
                        <div className="filter-menu-container">
                            <button 
                                className={`filter-menu-btn ${menuOpen ? 'active' : ''}`}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <div className="hamburger">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div className="filter-dropdown">
                                    <div className="dropdown-section">
                                        <h4 className="dropdown-title">Tampilan</h4>
                                        <button
                                            className={`dropdown-item ${activeTab === "all" ? "active" : ""}`}
                                            onClick={() => handleTabChange("all")}
                                        >
                                            📚 Semua Naskah
                                        </button>
                                        <button
                                            className={`dropdown-item ${activeTab === "rekomendasi" ? "active" : ""}`}
                                            onClick={() => handleTabChange("rekomendasi")}
                                        >
                                            ⭐ Rekomendasi
                                        </button>
                                    </div>
                                    
                                    {/* Kategori Section - Always show */}
                                    <div className="dropdown-section">
                                        <h4 className="dropdown-title">Kategori</h4>
                                        {kategoris.map((kat) => (
                                            <button
                                                key={kat.value}
                                                className={`dropdown-item ${activeTab === "kategori" && selectedKategori === kat.value ? "active" : ""}`}
                                                onClick={() => {
                                                    handleTabChange("kategori");
                                                    handleKategoriChange(kat.value);
                                                }}
                                            >
                                                {kat.label}
                                                {kat.value !== "all" && (
                                                    <span className="kategori-count">({getKategoriCount(kat.value)})</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="content-section">
                    {/* Loading & Error */}
                    {loading && <div className="loading-message">Memuat data naskah...</div>}
                    {error && <div className="error-message">{error}</div>}

                    {/* Results */}
                    {!loading && !error && (
                        <>
                            {/* Search Results Info */}
                            {searchTerm && (
                                <div className="search-results-info">
                                    Menampilkan {filteredNaskah.length} hasil untuk "{searchTerm}"
                                </div>
                            )}

                            {/* Current View Title */}
                            <div className="section-title">
                                {getCurrentDisplayTitle()}
                            </div>

                            {/* Naskah Grid */}
                            {filteredNaskah.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📖</div>
                                    <h3>Tidak ada naskah ditemukan</h3>
                                    <p>
                                        {searchTerm 
                                            ? `Tidak ada naskah yang cocok dengan pencarian "${searchTerm}"`
                                            : "Belum ada naskah dalam kategori ini"
                                        }
                                    </p>
                                    {searchTerm && (
                                        <button 
                                            className="clear-search-btn"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            Hapus Pencarian
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="naskah-grid">
                                    {filteredNaskah.map((item, index) => (
                                        <div key={item.id} className="naskah-card">
                                            {/* Badge untuk rekomendasi */}
                                            {activeTab === "rekomendasi" && index < 3 && (
                                                <div className="recommendation-badge">
                                                    {index === 0 && "🥇"}
                                                    {index === 1 && "🥈"}
                                                    {index === 2 && "🥉"}
                                                </div>
                                            )}
                                            
                                            {/* Thumbnail */}
                                            <div className="card-thumbnail-wrapper">
                                                {item.thumbnail ? (
                                                    <img
                                                        src={item.thumbnail}
                                                        alt={item.judul}
                                                        className="card-thumbnail"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="thumbnail-placeholder">📄</div>
                                                )}
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="card-content">
                                                <div className="card-kategori">
                                                    {item.kategori || "Lainnya"}
                                                </div>
                                                <h3 className="card-title">{item.judul}</h3>
                                                <p className="card-description">
                                                    {item.deskripsi 
                                                        ? (item.deskripsi.length > 80 
                                                            ? item.deskripsi.substring(0, 80) + "..." 
                                                            : item.deskripsi)
                                                        : "Tidak ada deskripsi"
                                                    }
                                                </p>
                                                <div className="card-meta">
                                                    <span className="card-pages">
                                                        📄 {item.totalHalaman || 0} halaman
                                                    </span>
                                                    <span className="card-date">
                                                        {item.uploadedAt 
                                                            ? new Date(item.uploadedAt.seconds * 1000).toLocaleDateString("id-ID", {
                                                                year: 'numeric',
                                                                month: 'short'
                                                            })
                                                            : "Tidak diketahui"
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Action */}
                                            <button
                                                className="read-button"
                                                onClick={() => handleOpenFlipbook(item.id)}
                                            >
                                                Baca Sekarang
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;