import { Routes, Route, Navigate } from 'react-router-dom';
import TormentaSheetPage from './features/tormenta/pages/TormentaSheetPage';
import { AuthPage, RequireAuth } from './features/auth';
import NarutoSheetPage from './pages/NarutoSheetPage/NarutoSheetPage';
import GameMasterPage from './pages/GameMasterPage/GameMasterPage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';
import BillingPage from './pages/BillingPage/BillingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/characters" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/parties" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/billing" element={<RequireAuth><BillingPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><TormentaSheetPage /></RequireAuth>} />
      <Route path="/naruto/char" element={<RequireAuth><NarutoSheetPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
