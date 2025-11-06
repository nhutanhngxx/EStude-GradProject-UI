import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        const savedToken = await AsyncStorage.getItem("token");
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (e) {
        console.log("Load session error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (userData, token) => {
    try {
      setUser(userData);
      setToken(token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("token", token);
    } catch (e) {
      console.log("Login save error:", e);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(["user", "token"]);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      setUser(updatedUserData);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUserData));
    } catch (e) {
      console.log("Update user error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
