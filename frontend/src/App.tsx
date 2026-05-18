import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './components/Admin';
import Editor from './components/Editor';
import InvitationLanding from './components/InvitationLanding';
import GuestsPage from './components/GuestsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/invitations/:id" element={<InvitationLanding />} />
        <Route path="/invitations/:id/guests" element={<GuestsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
