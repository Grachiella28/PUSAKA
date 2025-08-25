import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "../styles/DetailNaskah.css";
import { formatViews } from "../utils/viewTracker";

const DetailNaskah = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [naskah, setNaskah] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNaskah = async () => {
            try {
                setLoading(true);
                const docRef = doc(db, "naskah", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setNaskah({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError("Naskah tidak ditemukan");
                }
            } catch (err) {
                console.error("Error fetching naskah:", err);
                setError("Gagal memuat detail naskah");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchNaskah();
        }
    }, [id]);

    const handleBacaSekarang = () => {
        navigate(`/baca/${id}`);
    };

    const handleKembali = () => {
        navigate(-1); // Kembali ke halaman sebelumnya
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="detail-container">
                    <div className="loading-detail">
                        <div className="loading-spinner"></div>
                        <p>Memuat detail naskah...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !naskah) {
        return (
            <div>
                <Navbar />
                <div className="detail-container">
                    <div className="error-detail">
                        <div className="error-icon">❌</div>
                        <h2>Naskah Tidak Ditemukan</h2>
                        <p>{error || "Naskah yang Anda cari tidak dapat ditemukan."}</p>
                        <button className="back-button" onClick={handleKembali}>
                            ← Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="detail-container">
                {/* Breadcrumb */}
                <div className="detail-content">
                    {/* Thumbnail Section */}
                    <div className="detail-thumbnail-section">
                        <div className="thumbnail-wrapper">
                            {naskah.thumbnail ? (
                                <img
                                    src={naskah.thumbnail}
                                    alt={naskah.judul}
                                    className="detail-thumbnail"
                                />
                            ) : (
                                <div className="thumbnail-placeholder-large">
                                    📄
                                </div>
                            )}
                        </div>
                        
                        {/* Action Button */}
                        <button 
                            className="baca-sekarang-button"
                            onClick={handleBacaSekarang}
                        >
                            📖 Baca Sekarang
                        </button>
                    </div>

                    {/* Info Section */}
                    <div className="detail-info-section">
                        {/* Kategori */}
                        <div className="detail-kategori">
                            {naskah.kategori || "Lainnya"}
                        </div>

                        {/* Judul */}
                        <h1 className="detail-title">
                            {naskah.judul}
                        </h1>

                        {/* Meta Info */}
                        <div className="detail-meta">
                            <div className="meta-item">
                                <span className="meta-icon">📄</span>
                                <span>{naskah.totalHalaman || 0} halaman</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">👁️</span>
                                <span>{formatViews(naskah.totalViews || 0)} views</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">📅</span>
                                <span>
                                    {naskah.uploadedAt 
                                        ? new Date(naskah.uploadedAt.seconds * 1000).toLocaleDateString("id-ID", {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                        : "Tidak diketahui"
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div className="detail-description">
                            <h3>Tentang Naskah</h3>
                            <p>
                                {naskah.deskripsi || "Tidak ada deskripsi tersedia untuk naskah ini."}
                            </p>
                        </div>

                        {/* Additional Info (if needed) */}
                        {naskah.author && (
                            <div className="detail-additional">
                                <h4>Informasi Tambahan</h4>
                                <div className="additional-item">
                                    <strong>Penulis:</strong> {naskah.author}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailNaskah;