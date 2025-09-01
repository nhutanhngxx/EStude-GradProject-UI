import config from "../config/config.js";

const endpoints = {
  getAllTeachers: "/api/teachers",
  getClassSubjectByTeacherId: "/api/teachers/{teacherId}/class-subjects",
};

const teacherService = {
  getAllTeachers: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllTeachers}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách giáo viên thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giáo viên:", error);
      return null;
    }
  },
  getClassSubjectByTeacherId: async (teacherId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassSubjectByTeacherId.replace(
          "{teacherId}",
          teacherId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách môn học của giáo viên thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học của giáo viên:", error);
      return null;
    }
  },
};

export default teacherService;
