import config from "../config/config.js";

const endpoints = {
  academicRecords: "/api/statistics/student/{studentId}",
  allSubjectGradesOfStudent: "/api/subject-grades/student/{studentId}",
};

const studentStudyService = {
  getAcademicRecords: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.academicRecords.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        console.error("Lấy học lực thất bại:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy học lực:", error);
      return null;
    }
  },

  getAllSubjectGradesOfStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.allSubjectGradesOfStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        console.error("Lấy điểm thất bại:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy điểm:", error);
      return null;
    }
  },
};

export default studentStudyService;
