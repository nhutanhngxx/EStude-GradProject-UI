import config from "../config/config.js";

const endpoints = {
  subjectGrades: "/api/subject-grades",
  getGradesOfStudentByClassSubject:
    "/api/subject-grades/student/{studentId}/class-subject/{classSubjectId}",
};

const subjectGradeService = {
  saveGrade: async (grades) => {
    console.log("grades:", grades);
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.subjectGrades}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(grades),
        }
      );
      if (!response.ok) {
        throw new Error("Lưu điểm thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lưu điểm:", error);
      return null;
    }
  },
  getGradesOfStudentByClassSubject: async (studentId, classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getGradesOfStudentByClassSubject
          .replace("{studentId}", studentId)
          .replace("{classSubjectId}", classSubjectId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy điểm thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy điểm:", error);
      return null;
    }
  },
};

export default subjectGradeService;
