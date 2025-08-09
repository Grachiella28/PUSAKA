import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/home.css"; // pastikan import css ini

const Home = () => {
  const [naskahList, setNaskahList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "naskah"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setNaskahList(data);
    };

    fetchData();
  }, []);

  const handleOpenFlipbook = (id) => {
    navigate(`/baca/${id}`);
  };

  return (
    <div>
      <h2>📜 Daftar Naskah</h2>
      {naskahList.length === 0 ? (
        <p>Belum ada data naskah.</p>
      ) : (
        <div className="naskah-list">
          {naskahList.map((item) => (
            <div key={item.id} className="naskah-card">
              {/* Thumbnail */}
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.judul}
                  className="thumbnail"
                />
              )}

              {/* Judul */}
              <div className="judul">{item.judul}</div>

              {/* Tombol Read */}
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
    </div>
  );
};

export default Home;
