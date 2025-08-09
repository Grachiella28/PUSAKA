import React, { useState } from "react";
import "../styles/Upload.css";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const Upload = () => {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!judul || !file) {
      alert("Judul dan file wajib diisi!");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      // Upload PDF ke Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "pusaka");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dn1oejv6r/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Cloudinary response:", data);

      // Ambil data halaman
      const publicId = data.public_id;
      const totalPages = data.pages || 1;

      // URL base Cloudinary untuk gambar
      const baseUrl = `https://res.cloudinary.com/dn1oejv6r/image/upload`;
      const imageUrls = [];

      for (let i = 1; i <= totalPages; i++) {
        imageUrls.push(`${baseUrl}/pg_${i}/${publicId}.jpg`);
      }

      // Ambil thumbnail (halaman pertama)
      const thumbnailUrl = imageUrls[0];

      // Simpan metadata ke Firestore
      await addDoc(collection(db, "naskah"), {
        judul,
        deskripsi,
        totalHalaman: totalPages,
        url_pdf: data.secure_url,
        halaman: imageUrls,
        thumbnail: thumbnailUrl,
        uploadedAt: new Date(),
      });

      setSuccessMsg("✅ Naskah berhasil diunggah!");
      setJudul("");
      setDeskripsi("");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengunggah naskah.");
    }

    setLoading(false);
  };

  return (
    <div className="upload-container">
      <h2>📤 Upload Naskah</h2>
      <form onSubmit={handleUpload}>
        <label>Judul Naskah:</label>
        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required
        />

        <label>Deskripsi:</label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />

        <label>File PDF:</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Mengunggah..." : "Upload"}
        </button>

        {successMsg && <p className="success">{successMsg}</p>}
      </form>
    </div>
  );
};

export default Upload;
