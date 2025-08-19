import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import HTMLFlipBook from "react-pageflip";
import "../styles/Flipbook.css";
import logo from "../assets/perpus.png";

const Flipbook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [naskah, setNaskah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const flipBookRef = useRef();
  const controlsTimeoutRef = useRef();

  // Ambil data naskah
  useEffect(() => {
    const fetchNaskah = async () => {
      try {
        const docRef = doc(db, "naskah", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNaskah(data);
          setTotalPages(data.halaman?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching naskah:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNaskah();
  }, [id]);

  // Responsif sizing
  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      let pageWidth, pageHeight;
      
      if (mobile) {
        // Mobile: single page, full width minus small padding, increased size
        pageWidth = (window.innerWidth - 10) * 1.1; // 110% dari ukuran sebelumnya
        pageHeight = (window.innerHeight - 60) * 1.1;
      } else {
        // Desktop: dual page, no gap between pages, increased size
        const availableWidth = (window.innerWidth - 20) * 1.1; // 110% dari ukuran sebelumnya
        const availableHeight = (window.innerHeight - 60) * 1.1;
        
        // Calculate optimal size for dual pages (2:1 ratio for spread)
        const aspectRatio = 0.75; // Height/Width ratio for single page
        
        // Try fitting by width first
        pageWidth = availableWidth / 2;
        pageHeight = pageWidth / aspectRatio;
        
        // If height is too big, fit by height
        if (pageHeight > availableHeight) {
          pageHeight = availableHeight;
          pageWidth = pageHeight * aspectRatio;
        }
        
        // Ensure minimum readable size
        pageWidth = Math.max(pageWidth, 300);
        pageHeight = Math.max(pageHeight, 400);
      }

      setSize({
        width: Math.floor(pageWidth),
        height: Math.floor(pageHeight)
      });
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // Auto hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetControlsTimeout();
    const handleTouchStart = () => resetControlsTimeout();

    resetControlsTimeout();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleTouchStart);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // Back navigation
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Page navigation
  const goToPage = (pageNum) => {
    if (flipBookRef.current && pageNum >= 0 && pageNum < totalPages) {
      flipBookRef.current.pageFlip().flipToPage(pageNum);
    }
  };

  const nextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  // FlipBook event handlers
  const onFlip = (e) => {
    setCurrentPage(e.data);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevPage();
      } else if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="flipbook-loading">
        <div className="loading-spinner"></div>
        <p>Memuat naskah...</p>
      </div>
    );
  }

  if (!naskah?.halaman || naskah.halaman.length === 0) {
    return (
      <div className="flipbook-error">
        <p>Tidak ada halaman yang ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flipbook-container">
      {/* Main flipbook wrapper */}
      <div 
        className="flipbook-wrapper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <HTMLFlipBook
          ref={flipBookRef}
          width={size.width}
          height={size.height}
          size="fixed"
          minWidth={200}
          maxWidth={2000}
          minHeight={300}
          maxHeight={2000}
          showCover={false}
          mobileScrollSupport={false}
          className="flipbook"
          maxShadowOpacity={0.6}
          shadowOpacity={0.3}
          useMouseEvents={true}
          swipeDistance={50}
          clickEventForward={false}
          flippingTime={600}
          usePortrait={isMobile}
          autoSize={false}
          drawShadow={!isMobile}
          startZIndex={1}
          disableFlipByClick={false}
          onFlip={onFlip}
          style={{
            margin: 0,
            padding: 0
          }}
        >
          {naskah.halaman.map((url, index) => (
            <div 
              key={index} 
              className="flipbook-page"
              data-density="hard"
            >
              <div className="page-content">
                <img 
                  src={url} 
                  alt={`Halaman ${index + 1}`}
                  loading="lazy"
                  draggable={false}
                  className="page-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="error-placeholder" style={{display: 'none'}}>
                  <p>Gagal memuat halaman {index + 1}</p>
                </div>
              </div>
              <div className="watermark">
              <img 
                src={logo}
                alt="Watermark" 
                className="watermark-logo"
              />
            </div>
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div className={`flipbook-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Top controls */}
        <div className="controls-top">
          <div className="top-left-controls">
            <button 
              className="control-btn back-btn"
              onClick={handleBack}
              title="Kembali"
            >
              ←
            </button>
            <h1 className="naskah-head-title">{naskah?.judul || 'Naskah'}</h1>
          </div>
          <div className="page-indicator">
            <span className="current-page">{currentPage + 1}</span>
            <span className="separator">/</span>
            <span className="total-pages">{totalPages}</span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="controls-bottom">
          {/* Navigation */}
          <div className="nav-controls">
            <button 
              className="control-btn nav-btn"
              onClick={prevPage}
              disabled={currentPage === 0}
              title="Halaman sebelumnya (←)"
            >
              ‹
            </button>
            <button 
              className="control-btn nav-btn"
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              title="Halaman selanjutnya (→)"
            >
              ›
            </button>
          </div>

          {/* Zoom controls */}
          <div className="zoom-controls">
            <button 
              className="control-btn zoom-btn"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Perkecil (+)"
            >
              -
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              className="control-btn zoom-btn"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title="Perbesar (-)"
            >
              +
            </button>
            <button 
              className="control-btn reset-btn"
              onClick={resetZoom}
              title="Reset zoom (0)"
              style={{display: 'none'}}
            >
              Reset
            </button>
          </div>
        </div>

      </div>

      {/* Help text */}
      <div className={`help-text ${showControls ? 'visible' : 'hidden'}`}>
        <p>Gunakan ← → untuk navigasi | + - untuk zoom | Klik untuk kontrol</p>
      </div>
    </div>
  );
};

export default Flipbook;