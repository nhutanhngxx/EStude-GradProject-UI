import config from "../configs/config";

const endpoints = {
  // Lấy điểm của học sinh trong 1 môn học
  getGradesOfStudentByClassSubject:
    "/api/subject-grades/student/{studentId}/class-subject/{classSubjectId}",
  // Lấy tất cả điểm của học sinh
  getAllSubjectGradesOfStudent: "/api/subject-grades/student/{studentId}",
};

const subjectGradeService = {
  getGradesOfStudentByClassSubject: async (studentId, classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getGradesOfStudentByClassSubject
          .replace("{studentId}", studentId)
          .replace("{classSubjectId}", classSubjectId)}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error("Lấy điểm thất bại");
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  getAllSubjectGradesOfStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllSubjectGradesOfStudent.replace(
          "{studentId}",
          studentId
        )}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error("Lấy điểm thất bại");
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },
};

export default subjectGradeService;
