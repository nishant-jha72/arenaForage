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
import AdminRegisterPage from "./pages/Admin/AdminRegister";
import AdminLoginPage from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
          <Route path="/admin/register"  element={<AdminRegisterPage />}                       />
          <Route path="/admin/login"     element={<AdminLoginPage />}                          />
          <Route path="/admin/dashboard" element={<AdminDashboard />}                          />
        </Routes>
      </BrowserRouter>

      </AuthProvider>
    </ThemeProvider>
  );
}