import config from "../config/config.js";

const endpoints = {
  forgotPassword: "/api/auth/forgot-password",
  verifyOtp: "/api/auth/verify-otp",
  resetPassword: "/api/auth/reset-password",
};

const passwordService = {
  sendOtp: async (email) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.forgotPassword}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gửi OTP thất bại");
      }

      const result = await response.json();
      return result; // { success, message, ... }
    } catch (error) {
      console.error("Lỗi khi gửi OTP:", error);
      return null;
    }
  },

  verifyOtp: async ({ email, otp }) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        let errorMessage = "Xác thực OTP thất bại";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (err) {
          console.warn("Không có JSON trả về", err);
        }
        throw new Error(errorMessage);
      }

      let result = {};
      try {
        result = await response.json();
      } catch (err) {
        console.warn("Body JSON rỗng", err);
      }

      return result;
    } catch (error) {
      console.error("Lỗi khi xác thực OTP:", error);
      return { success: false, message: error.message };
    }
  },

  resetPassword: async ({ email, otp, newPassword }) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.resetPassword}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đặt lại mật khẩu thất bại");
      }

      const result = await response.json();
      return result; // { success, message, ... }
    } catch (error) {
      console.error("Lỗi khi đặt lại mật khẩu:", error);
      return null;
    }
  },
};

export default passwordService;
