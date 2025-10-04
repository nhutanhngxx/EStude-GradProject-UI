import config from "../configs/config";

const endpoints = {
  getSchedulesByStudent: "/api/schedules/student/{studentId}",
};

const scheduleService = {
  getSchedulesByStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSchedulesByStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy lịch học thất bại");
      }
      const data = await response.json();
      // console.log("data:", data);
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch học:", error);
      return null;
    }
  },
};

export default scheduleService;
