import config from "../configs/config";

const endpoints = {
  loginStudent: "/api/auth/login-student",
  logout: "/api/auth/logout",

  // Step quên mật khẩu
  forgotPassword: "/api/auth/forgot-password",
  verifyOtp: "/api/auth/verify-otp",
  resetPassword: "/api/auth/reset-password",
};

const authService = {
  login: async ({ username, password }) => {
    try {
      const res = await fetch(`${config.BASE_URL}${endpoints.loginStudent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.success) {
        return { user: json.data, token: json.token };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  logout: async (token) => {
    try {
      const res = await fetch(`${config.BASE_URL}${endpoints.logout}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.ok;
    } catch (err) {
      console.error("Logout error:", err);
      return false;
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await fetch(`${config.BASE_URL}${endpoints.forgotPassword}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch (err) {
      console.error("Forgot password error:", err);
      return false;
    }
  },
  verifyOtp: async ({ email, otp }) => {
    try {
      const res = await fetch(`${config.BASE_URL}${endpoints.verifyOtp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      return res.ok;
    } catch (err) {
      console.error("Verify OTP error:", err);
      return false;
    }
  },
  resetPassword: async ({ email, otp, newPassword }) => {
    try {
      const res = await fetch(`${config.BASE_URL}${endpoints.resetPassword}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      return res.ok;
    } catch (err) {
      console.error("Reset password error:", err);
      return false;
    }
  },
};

export default authService;
