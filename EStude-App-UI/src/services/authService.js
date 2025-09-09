import config from "../configs/config";

const endpoints = {
  loginStudent: "/api/auth/login-student",
  logout: "/api/auth/logout",
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
};

export default authService;
