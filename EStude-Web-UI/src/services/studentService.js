import config from "../config/config";

const endpoints = {
  getAllStudents: "/api/students",
  getStudentById: "/api/students/{studentId}",
  getStudentsByClass: `/api/students/by-class/{classId}`,
  getClassByStudent: "/api/students/{studentId}/classes",
};

const studentService = {
  getAllStudents: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllStudents}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học sinh thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học sinh:", error);
      return null;
    }
  },

  getStudentById: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getStudentById.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin học sinh thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin học sinh:", error);
      return null;
    }
  },

  getStudentsByClass: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getStudentsByClass.replace(
          "{classId}",
          classId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học sinh thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học sinh:", error);
      return null;
    }
  },

  getClassByStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassByStudent.replace(
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

export default studentService;
