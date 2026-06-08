import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TormentaSheetPage from './features/tormenta/pages/TormentaSheetPage';
import CharacterSheetPage from './pages/CharacterSheetPage/CharacterSheetPage';
import { AuthPage, RequireAuth } from './features/auth';
import NarutoSheetPage from './pages/NarutoSheetPage/NarutoSheetPage';
import NarutoViewPage from './pages/NarutoViewPage/NarutoViewPage';
import GameMasterPage from './pages/GameMasterPage/GameMasterPage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';
import ViewCharacterPage from './pages/ViewCharacterPage/ViewCharacterPage';

/** Behind the `?v=2` flag, render the new C-dark sheet shell; otherwise the current page. */
function TormentaCharRoute() {
  const v = new URLSearchParams(useLocation().search).get('v');
  return v === '2' ? <CharacterSheetPage /> : <TormentaSheetPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/characters" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/parties" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><TormentaCharRoute /></RequireAuth>} />
      <Route path="/naruto/char" element={<RequireAuth><NarutoSheetPage /></RequireAuth>} />
      <Route path="/naruto/view" element={<RequireAuth><NarutoViewPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/char/:characterId" element={<RequireAuth><ViewCharacterPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
