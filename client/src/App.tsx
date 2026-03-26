import { Routes, Route, Navigate } from 'react-router-dom';
import FichaTormentaPage from './features/tormenta/pages/FichaTormentaPage';
import FichaNarutoPage from './pages/FichaNarutoPage/FichaNarutoPage';
import MestrePage from './pages/MestrePage/MestrePage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/personagens" element={<SelectPage />} />
      <Route path="/grupos" element={<PartySelectPage />} />
      <Route path="/grupos/nova/:partyId" element={<PartyMembersPage />} />
      <Route path="/tormenta/char" element={<FichaTormentaPage />} />
      <Route path="/naruto/char" element={<FichaNarutoPage />} />
      <Route path="/tormenta/grupo/:partyId" element={<MestrePage />} />
      <Route path="/naruto/grupo/:partyId" element={<MestrePage />} />
      <Route path="/" element={<Navigate to="/personagens" replace />} />
      <Route path="*" element={<Navigate to="/personagens" replace />} />
    </Routes>
  );
}
