import { Routes, Route, Navigate } from 'react-router-dom';
import FichaTormentaPage from './features/tormenta/pages/FichaTormentaPage';
import { AuthPage, RequireAuth } from './features/auth';
import FichaNarutoPage from './pages/FichaNarutoPage/FichaNarutoPage';
import MestrePage from './pages/MestrePage/MestrePage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/personagens" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/grupos" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/grupos/nova/:partyId" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><FichaTormentaPage /></RequireAuth>} />
      <Route path="/naruto/char" element={<RequireAuth><FichaNarutoPage /></RequireAuth>} />
      <Route path="/tormenta/grupo/:partyId" element={<RequireAuth><MestrePage /></RequireAuth>} />
      <Route path="/naruto/grupo/:partyId" element={<RequireAuth><MestrePage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
