import subjectService from "./subjectService";
import subjectGradeService from "./subjectGradeService";

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
};

export default studentStudyService;
