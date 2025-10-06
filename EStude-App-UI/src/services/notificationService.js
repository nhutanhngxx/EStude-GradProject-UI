import config from "../configs/config.js";

const endpoints = {
  studentGetReceivedNotifications: "/api/notifications/me",
};

const notificationService = {
  studentGetReceivedNotifications: async (accessToken) => {
    try {
      const url = `${config.BASE_URL}${endpoints.studentGetReceivedNotifications}`;
      //  console.log("Fetching notifications from:", url);
      //  console.log("Using token:", accessToken?.slice(0, 20) + "...");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `API error (${response.status}): ${response.statusText} - ${text}`
        );
        throw new Error("Lấy danh sách thông báo được nhận thất bại");
      }

      const result = await response.json();
      //  console.log("result:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo được nhận:", error);
      return null;
    }
  },
};

export default notificationService;
