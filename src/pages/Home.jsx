import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // ✅ import Navbar
import "../styles/home.css";

const Home = () => {
    const [naskahList, setNaskahList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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
            } catch (err) {
                console.error("Error fetching naskah:", err);
                setError("Gagal memuat data naskah.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenFlipbook = (id) => {
        navigate(`/baca/${id}`);
    };

    return (
        <div>
            {/* ✅ Panggil Navbar */}
            <Navbar />

            <Navbar />
            <div className="home-container">
                {/* Loading & Error */}
                {loading && <p className="empty-message">Memuat data...</p>}
                {error && <p className="empty-message" style={{ color: "red" }}>{error}</p>}

                {/* Daftar naskah */}
                {!loading && !error && (
                    <>
                        {naskahList.length === 0 ? (
                            <p className="empty-message">Belum ada data naskah.</p>
                        ) : (
                            <div className="naskah-list">
                                {naskahList.map((item) => (
                                    <div key={item.id} className="naskah-card">
                                        {item.thumbnail && (
                                            <img
                                                src={item.thumbnail}
                                                alt={item.judul}
                                                className="thumbnail"
                                            />
                                        )}
                                        <div className="judul">{item.judul}</div>
                                        <button
                                            className="read-button"
                                            onClick={() => handleOpenFlipbook(item.id)}
                                        >
                                            Read
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default Home;
