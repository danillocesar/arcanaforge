import { Routes, Route, Navigate } from 'react-router-dom';
import FichaPage from './pages/FichaPage/FichaPage';
import MestrePage from './pages/MestrePage/MestrePage';
import SelectPage from './pages/SelectPage/SelectPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FichaPage />} />
      <Route path="/mestre" element={<MestrePage />} />
      <Route path="/select" element={<SelectPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
