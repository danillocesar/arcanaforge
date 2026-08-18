import { Routes, Route, Navigate } from 'react-router-dom';
import CharacterSheetPage from './pages/CharacterSheetPage/CharacterSheetPage';
import { AuthPage, RequireAuth } from './features/auth';
import GameMasterPage from './pages/GameMasterPage/GameMasterPage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';
import ViewCharacterPage from './pages/ViewCharacterPage/ViewCharacterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/characters" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/parties" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><CharacterSheetPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/char/:characterId" element={<RequireAuth><ViewCharacterPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
