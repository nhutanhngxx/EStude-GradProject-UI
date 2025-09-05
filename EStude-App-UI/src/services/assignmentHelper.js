import assignmentService from "../services/assignmentService";
import submissionService from "../services/submissionService";

/**
 * @param {number} studentId
 * @param {number|null} classId - nếu có sẽ load assignments của lớp, null thì load tất cả
 * @param {boolean|null} isExam - nếu true/false sẽ filter assignments/exams, null = tất cả
 * @returns {Promise<Array>} list assignment kèm status và submissionId
 */
export async function loadAssignmentsWithStatus(
  studentId,
  classId = null,
  isExam = null
) {
  let assignments = [];

  if (classId) {
    assignments = await assignmentService.getAssignmentsByClass(classId);
  } else {
    assignments = await assignmentService.getAssignmentsByStudent(studentId);
  }

  if (!Array.isArray(assignments)) assignments = [];

  if (isExam !== null) {
    assignments = assignments.filter((a) => !!a.isExam === isExam);
  }

  const assignmentsWithStatus = await Promise.all(
    assignments.map(async (as) => {
      let submission =
        await submissionService.getSubmissionByStudentIdAndAssignmentId(
          studentId,
          as.assignmentId
        );
      if (Array.isArray(submission)) submission = submission[0] || null;

      return {
        ...as,
        status: submission?.status === "SUBMITTED" ? "Đã nộp" : "Chưa nộp",
        submissionId: submission?.submissionId || null,
        submittedAt: submission?.submittedAt || null,
        // Thêm các trường cần thiết để check quá hạn hoặc hiển thị chi tiết
        classId: as.classSubject?.clazz?.classId || null,
        className: as.classSubject?.clazz?.name || null,
        teacherName: as.classSubject?.teacher?.fullName || null,
        attachmentUrl: as.attachmentUrl || null,
        timeLimit: as.timeLimit || null,
        type: as.type || null,
        dueDate: as.dueDate || null,
        startDate: as.startDate || null,
        maxScore: as.maxScore || null,
        allowLateSubmission: as.allowLateSubmission || false,
        latePenalty: as.latePenalty || 0,
        isPublished: as.isPublished || false,
      };
    })
  );

  return assignmentsWithStatus;
}
