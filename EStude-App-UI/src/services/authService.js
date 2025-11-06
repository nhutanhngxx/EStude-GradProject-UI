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

  /**
   * Upload avatar cho user
   * @param {number} userId - ID của user
   * @param {object} imageFile - Object chứa thông tin file ảnh từ ImagePicker
   * @param {string} token - Bearer token
   * @returns {Promise<object|null>} - Trả về user data đã cập nhật hoặc null
   */
  updateAvatar: async (userId, imageFile, token) => {
    try {
      // Tạo FormData
      const formData = new FormData();

      // Xác định MIME type đúng
      let mimeType = "image/jpeg"; // default
      if (imageFile.uri.toLowerCase().endsWith(".png")) {
        mimeType = "image/png";
      } else if (
        imageFile.uri.toLowerCase().endsWith(".jpg") ||
        imageFile.uri.toLowerCase().endsWith(".jpeg")
      ) {
        mimeType = "image/jpeg";
      } else if (imageFile.uri.toLowerCase().endsWith(".heic")) {
        mimeType = "image/heic";
      }

      // Thêm file ảnh vào FormData
      // React Native cần format: { uri, type, name }
      formData.append("avatar", {
        uri: imageFile.uri,
        type: mimeType,
        name: imageFile.name || `avatar_${userId}_${Date.now()}.jpg`,
      });

      const url = `${config.BASE_URL}/api/users/${userId}/avatar`;
      console.log("📤 Upload avatar URL:", url);
      console.log("📤 Image file:", {
        uri: imageFile.uri,
        type: mimeType,
        name: imageFile.name,
      });

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          // Không set Content-Type, để fetch tự động set multipart/form-data với boundary
        },
        body: formData,
      });

      console.log("📥 Response status:", res.status);

      // Check nếu response không phải JSON (có thể là HTML error page)
      const contentType = res.headers.get("content-type");
      console.log("📥 Content-Type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        console.log("📥 Response data:", json);

        // Backend trả về format: { message, userId, fullName, avatarUrl }
        if (res.ok && json.message && json.avatarUrl) {
          console.log("✅ Avatar updated successfully!");
          return json; // Trả về toàn bộ response data
        }

        console.error(
          "❌ Update avatar failed:",
          json.message || "Unknown error"
        );
        return null;
      } else {
        const text = await res.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        return null;
      }
    } catch (err) {
      console.error("Update avatar error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      return null;
    }
  },
};

export default authService;
