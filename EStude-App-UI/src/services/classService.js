import config from "../configs/config";

const endpoints = {
  getClassesByStudent: `/api/students/{studentId}/classes`,
};

const classService = {
  getClassesByStudent: async ({ studentId }) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassesByStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách lớp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp:", error);
      return null;
    }
  },
};

export default classService;
