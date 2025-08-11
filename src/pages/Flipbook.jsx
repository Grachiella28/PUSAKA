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
  const [pagesPerView, setPagesPerView] = useState(2);
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Ambil data naskah
  useEffect(() => {
    const fetchNaskah = async () => {
      const docRef = doc(db, "naskah", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNaskah(docSnap.data());
      }
      setLoading(false);
    };
    fetchNaskah();
  }, [id]);

  // Responsif
  useEffect(() => {
    const updateLayout = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setPagesPerView(isLandscape ? 2 : 1);
      setSize({
        width: Math.min(window.innerWidth / (isLandscape ? 2 : 1) - 40, 800),
        height: window.innerHeight - 40
      });
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!naskah?.halaman || naskah.halaman.length === 0)
    return <p>Tidak ada halaman.</p>;

  return (
    <div className="flipbook-wrapper">
      <HTMLFlipBook
        width={size.width}
        height={size.height}
        size="stretch"
        showCover={true}
        mobileScrollSupport={true}
        className="flipbook"
        maxShadowOpacity={0.5}
        useMouseEvents={true} // biar bisa klik/drag
        swipeDistance={30}    // jarak minimal swipe
        clickEventForward={true}
      >
        {naskah.halaman.map((url, index) => (
          <div key={index} className="flipbook-page">
            <img src={url} alt={`Halaman ${index + 1}`} />
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default Flipbook;
