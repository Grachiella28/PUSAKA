import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import HTMLFlipBook from "react-pageflip";
import "../styles/Flipbook.css";

const Flipbook = () => {
  const { id } = useParams();
  const [naskah, setNaskah] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNaskah = async () => {
      try {
        const docRef = doc(db, "naskah", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNaskah(docSnap.data());
        } else {
          console.error("Naskah tidak ditemukan");
        }
      } catch (error) {
        console.error("Gagal ambil naskah:", error);
      }
      setLoading(false);
    };

    fetchNaskah();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!naskah) return <p>Naskah tidak ditemukan.</p>;

  return (
    <div className="baca-container">
      <h2>{naskah.judul}</h2>
      <p>{naskah.deskripsi}</p>
      <HTMLFlipBook
        width={400}
        height={600}
        size="stretch"
        minWidth={315}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1536}
        showCover={true}
        mobileScrollSupport={true}
        className="flipbook"
      >
        {naskah.halaman.map((url, index) => (
          <div key={index} className="page">
            <img src={url} alt={`Halaman ${index + 1}`} />
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default Flipbook;
