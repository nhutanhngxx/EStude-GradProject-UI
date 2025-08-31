import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import passwordService from "../services/passwordService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khi component mount, load user và token từ localStorage
    const token = localStorage.getItem("accessToken");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (token && storedUser) {
      setUser(storedUser);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  const login = async ({ username, password, role }) => {
    const data = await authService.login({ username, password, role });
    if (data && data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const forgotPassword = async (email) => {
    return await passwordService.sendOtp(email);
  };

  const verifyOtp = async ({ email, otp }) => {
    return await passwordService.verifyOtp({ email, otp });
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    return await passwordService.resetPassword({ email, otp, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        loading,
      }}
    >
      {!loading && children}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <span>Đang tải...</span>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
