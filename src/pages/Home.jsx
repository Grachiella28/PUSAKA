import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // ⬅️ Tambahkan ini

const NaskahList = () => {
  const [naskahList, setNaskahList] = useState([]);
  const navigate = useNavigate(); // ⬅️ Inisialisasi navigasi

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
    navigate(`/baca/${id}`); // ⬅️ Navigasi ke halaman flipbook
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📜 Daftar Naskah</h2>
      {naskahList.length === 0 ? (
        <p>Belum ada data naskah.</p>
      ) : (
        <ul className="space-y-4">
          {naskahList.map((item) => (
            <li
              key={item.id}
              className="border p-4 rounded-md shadow hover:shadow-md transition cursor-pointer"
              onClick={() => handleOpenFlipbook(item.id)} // ⬅️ Pasang handler klik
            >
              <h3 className="text-xl font-semibold">{item.judul}</h3>
              <p className="text-gray-600 mb-2">{item.deskripsi}</p>
              <p className="text-blue-600 underline">📖 Buka dalam Flipbook</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NaskahList;
