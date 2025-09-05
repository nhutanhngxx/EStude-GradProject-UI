import config from "../configs/config";

const endpoints = {
  getGradesOfStudentByClassSubject:
    "/api/subject-grades/student/{studentId}/class-subject/{classSubjectId}",
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
};

export default subjectGradeService;
