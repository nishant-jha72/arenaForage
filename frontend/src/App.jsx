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
import UserLoginPage from "./pages/users/UserLoginPage";
import UserRegisterPage from "./pages/users/UserRegisterPage";
import UserDashboard from "./pages/users/UserDashboard";
import ResetPasswordPage from "./pages/users/ResetPasswordPage";
import ForgotPasswordPage from "./pages/users/ForgotPasswordPage";
import { UserProvider } from "./context/UserContext";
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
              <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage />}                              />
          {/* <Route path="/login"           element={<AuthPage defaultTab="login" />}           />
          <Route path="/register"        element={<AuthPage defaultTab="register" />}        /> */}
          <Route path="/tournaments"     element={<TournamentsPage />}                       />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />}                  />
          <Route path="/leaderboard"     element={<LeaderboardPage />}                       />
          <Route path="/tournaments/:id/register" element={<TournamentRegistrationPage />} />

          {/* Protected — add auth guard later */}
          <Route path="/dashboard"       element={<DashboardPage />}                         />
          <Route path="/admin/register"  element={<AdminRegisterPage />}                       />
          <Route path="/admin/login"     element={<AdminLoginPage />}                          />
          <Route path="/admin/dashboard" element={<AdminDashboard />}                          />
          <Route path = "/user/login"     element = {< UserLoginPage/>} />
          <Route path = "/user/register"     element = {< UserRegisterPage/>} />
          <Route path = "/user/dashboard"    element = {< UserDashboard/>} />
           <Route path = "/user/reset-password"    element = {<ResetPasswordPage/>} />
            <Route path = "/user/forgot-password"    element = {<  ForgotPasswordPage/>} />
        </Routes>
      </BrowserRouter>
            </ UserProvider >
      </AuthProvider>
    </ThemeProvider>
  );
}