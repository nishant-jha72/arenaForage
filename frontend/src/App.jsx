// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import HomePage             from "./pages/Homepage";
import AuthPage             from "./pages/AuthPage";
import DashboardPage        from "./pages/DashboardPage";
import TournamentsPage      from "./pages/TournamentsPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import LeaderboardPage      from "./pages/LeaderboardPage";
import TournamentRegistrationPage from "./components/TournamentRegistration";
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage />}                              />
          <Route path="/login"           element={<AuthPage defaultTab="login" />}           />
          <Route path="/register"        element={<AuthPage defaultTab="register" />}        />
          <Route path="/tournaments"     element={<TournamentsPage />}                       />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />}                  />
          <Route path="/leaderboard"     element={<LeaderboardPage />}                       />
          <Route path="/tournaments/:id/register" element={<TournamentRegistrationPage />} />

          {/* Protected — add auth guard later */}
          <Route path="/dashboard"       element={<DashboardPage />}                         />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}