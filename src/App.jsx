import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import BacaNaskah from './pages/Flipbook';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/baca/:id" element={<BacaNaskah />} />
      </Routes>
    </Router>
  );
}

export default App;
