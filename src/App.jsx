import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import BacaNaskah from './pages/Flipbook';
import Login from "./pages/Login";   
import Admin from "./pages/Admin";   


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/baca/:id" element={<BacaNaskah />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
