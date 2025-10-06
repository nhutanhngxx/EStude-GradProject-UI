import config from "../config/config.js";

const endpoints = {
  getReceivedNotifications: "/api/notifications/me",
  getSentNotifications: "/api/notifications/sent",
  adminCreateNotification: "/api/notifications",
};

const accessToken = localStorage.getItem("accessToken");

const notificationService = {
  getReceivedNotifications: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getReceivedNotifications}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách thông báo được nhận thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo được nhận:", error);
      return null;
    }
  },

  getSentNotifications: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSentNotifications}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách thông báo đã gửi thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo đã gửi:", error);
      return null;
    }
  },

  adminCreateNotification: async (notification) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.adminCreateNotification}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(notification),
        }
      );
      if (!response.ok) {
        throw new Error("Tạo thông báo thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
      return null;
    }
  },
};

export default notificationService;
