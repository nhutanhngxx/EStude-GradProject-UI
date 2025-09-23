import subjectService from "./subjectService";
import subjectGradeService from "./subjectGradeService";
import config from "../configs/config";

const endpoints = {
  academicRecords: "/api/statistics/student/{studentId}",
  allSubjectGradesOfStudent: "/api/subject-grades/student/{studentId}",
};

const studentStudyService = {
  getSubjectsWithGrades: async (studentId) => {
    try {
      // 1. Lấy danh sách môn học của HS
      const subjects = await subjectService.getSubjectsByStudent(studentId);
      if (!subjects) return [];

      // 2. Map qua từng môn để lấy thêm điểm
      const subjectsWithGrades = await Promise.all(
        subjects.map(async (subj) => {
          const grade =
            await subjectGradeService.getGradesOfStudentByClassSubject(
              studentId,
              subj.classSubjectId
            );

          return {
            ...subj, // giữ lại thông tin môn học (subjectName, teacherName, termName…)
            grade: grade, // thêm thông tin điểm
          };
        })
      );

      return subjectsWithGrades;
    } catch (error) {
      console.error("Lỗi khi lấy môn + điểm:", error);
      return [];
    }
  },

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
        throw new Error("Lấy học lực thất bại");
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

export default studentStudyService;
