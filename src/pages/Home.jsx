import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "../styles/home.css";
import logo from "../assets/Logo.png";

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
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <img className="logo-img" src={logo} alt="Logo PUSAKA" />
          <span className="logo-text">PUSAKA</span>
        </div>
        <ul className="navbar-menu">
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>

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
  );
};

export default Home;
