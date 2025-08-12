import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../styles/contact.css";

const Contact = () => {
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
      <div style={{ paddingTop: navHeight }} className="contact-container">
        <h1>Kontak Kami</h1>
        <p>Email: support@pusaka.id</p>
        <p>Telepon: +62 812-3456-7890</p>
        <p>Alamat: Jl. Literasi No. 123, Jakarta</p>
      </div>
    </div>
  );
};

export default Contact;
