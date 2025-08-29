import config from "../config/config.js";

const endpoints = {
  student: "/api/auth/login-student",
  teacher: "/api/auth/login-teacher",
  admin: "/api/auth/login-admin",
};

const authService = {
  isTokenValid: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const payload = token.split(".")[1];
      if (payload) {
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.exp > Date.now() / 1000;
      }
      return true;
    } catch (error) {
      console.error("Lỗi kiểm tra token:", error);
      return false;
    }
  },

  login: async ({ username, password, role }) => {
    const endpoint = endpoints[role];
    if (!endpoint) throw new Error("Role không hợp lệ");

    try {
      const response = await fetch(`${config.BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Đăng nhập thất bại");
      }

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("accessToken", result.token);
        localStorage.setItem("user", JSON.stringify(result.data));
        return {
          accessToken: result.token,
          user: result.data,
        };
      } else {
        throw new Error(result.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.log("Có lỗi xảy ra khi đăng nhập:", error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },
};

export default authService;
