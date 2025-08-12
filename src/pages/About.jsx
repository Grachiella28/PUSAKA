import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../styles/about.css";

const About = () => {
  const [navHeight, setNavHeight] = useState(0);
  const navbarRef = useRef(null);

  useEffect(() => {
    if (navbarRef.current) {
      setNavHeight(navbarRef.current.offsetHeight);
    }
  }, []);

  return (
    <div>
      <Navbar ref={navbarRef} />
      <div style={{ paddingTop: navHeight }} className="about-container">
        <h1>Tentang Kami</h1>
        <p>
          PUSAKA adalah platform yang menyediakan koleksi naskah dan buku
          digital dengan tampilan flipbook interaktif.
        </p>
        <p>
          Misi kami adalah melestarikan dan mempermudah akses terhadap naskah
          budaya, literatur, dan karya sastra secara digital.
        </p>
      </div>
    </div>
  );
};

export default About;
