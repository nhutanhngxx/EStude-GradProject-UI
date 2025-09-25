import attendanceService from "./attendanceService";
import classSubjectService from "./classSubjectService";

/**
 * Lấy tất cả session mà giáo viên đang dạy
 * @param {number} teacherId
 * @returns {Promise<Array>} danh sách session
 */
export const getAllSessionsOfTeacher = async (teacherId) => {
  try {
    // 1. Lấy tất cả classSubject
    const allClassSubjects = await classSubjectService.getAllClassSubjects();
    if (!allClassSubjects) return [];

    // 2. Lọc classSubject do teacherId dạy
    const teacherClassSubjects = allClassSubjects.filter(
      (cs) => cs.teacher?.userId === teacherId
    );

    // 3. Lấy tất cả session theo từng classSubject
    const allSessions = await Promise.all(
      teacherClassSubjects.map((cs) =>
        attendanceService.getAttentanceSessionByClassSubjectForTeacher(
          cs.classSubjectId,
          teacherId
        )
      )
    );

    // 4. Flatten mảng 2 chiều thành 1 chiều
    return allSessions.flat();
  } catch (err) {
    console.error("Lỗi khi lấy tất cả session của giáo viên:", err);
    return [];
  }
};
