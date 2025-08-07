import React from "react";
import HTMLFlipBook from "react-pageflip";
import "../Styles/FlipbookViewer.css";

const FlipbookViewer = ({ title, imageUrls }) => {
  return (
    <div className="flipbook-wrapper">
      <h2>{title}</h2>
      <HTMLFlipBook width={400} height={550} showCover={true} className="flipbook">
        {imageUrls.map((url, index) => (
          <div className="page" key={index}>
            <img src={url} alt={`Halaman ${index + 1}`} />
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default FlipbookViewer;
