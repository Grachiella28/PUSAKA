import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import BacaNaskah from './pages/Flipbook';
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import About from './pages/About';
import Contact from './pages/Contact';
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/baca/:id" element={<BacaNaskah />} />
        {/* Login hanya untuk user yang belum login */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        {/* Admin hanya untuk user yang sudah login */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;
