import config from "../configs/config";

const endpoints = {
  getSubjectsByStudent: "/api/enrollments",
};

const subjectService = {
  getSubjectsByStudent: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSubjectsByStudent}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách môn học thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học:", error);
      return null;
    }
  },
};

export default subjectService;
