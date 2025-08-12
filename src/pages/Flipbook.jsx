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
      const isMobile = window.innerWidth <= 768;
      
      setPagesPerView(isMobile ? 1 : (isLandscape ? 2 : 1));
      setSize({
        width: Math.min(
          window.innerWidth / (isMobile ? 1 : (isLandscape ? 2 : 1)) - 40, 
          isMobile ? window.innerWidth - 40 : 800
        ),
        height: Math.min(window.innerHeight - 40, 800)
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
        minWidth={315}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1533}
        showCover={true}
        mobileScrollSupport={true}
        className="flipbook"
        maxShadowOpacity={0.5}
        useMouseEvents={true}
        swipeDistance={30}
        clickEventForward={true}
        // Konfigurasi tambahan untuk menghilangkan gap
        flippingTime={600}
        usePortrait={pagesPerView === 1}
        autoSize={true}
        drawShadow={true}
        // Penting: set startZIndex
        startZIndex={0}
      >
        {naskah.halaman.map((url, index) => (
          <div 
            key={index} 
            className="flipbook-page"
            data-density="hard" // untuk efek flip yang lebih realistis
          >
            <img 
              src={url} 
              alt={`Halaman ${index + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none'
              }}
              onDragStart={(e) => e.preventDefault()} // prevent drag
            />
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default Flipbook;