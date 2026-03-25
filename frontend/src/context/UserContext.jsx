// src/context/UserContext.js
import { createContext, useContext, useEffect, useState } from "react";
import API from "../app/Axios";
import { useAuth } from "./AuthContext";
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const {isAuthenticated} = useAuth();
  const fetchUser = async () => {
    try {
      const res = await API.get("/users/profile");
      setUser(res.data);
    } catch (err) {
      console.error("User fetch failed", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (isAuthenticated) {
    fetchUser();
  }
}, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);