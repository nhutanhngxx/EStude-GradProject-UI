import axios from "axios";
import config from "../config/config";

/**
 * Analytics Service - Gọi các API analytics theo ANALYTICS_API_DOCUMENTATION.md
 * Hỗ trợ 4 roles: Admin, Giáo Vụ, Subject Teacher, Homeroom Teacher
 */

const analyticsService = {
  // ==================== ADMIN ANALYTICS ====================

  /**
   * Lấy thống kê tổng quan ngân hàng câu hỏi
   * @returns {Promise<Object>} Question bank overview stats
   */
  getQuestionBankOverview: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/admin/analytics/questions/overview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching question bank overview:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê chi tiết về usage của một câu hỏi
   * @param {number} questionId - ID của câu hỏi
   * @returns {Promise<Object>} Question usage stats
   */
  getQuestionStats: async (questionId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/admin/analytics/questions/${questionId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for question ${questionId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy ranking câu hỏi được sử dụng nhiều nhất
   * @param {number} limit - Số lượng câu hỏi (default 20, max 100)
   * @returns {Promise<Array>} Array of questions sorted by usage
   */
  getQuestionUsageRanking: async (limit = 20) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/admin/analytics/questions/usage-ranking?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching question usage ranking:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách câu hỏi cần cải thiện (accuracy < 40%)
   * @returns {Promise<Array>} Questions needing improvement
   */
  getQuestionsNeedingImprovement: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/admin/analytics/questions/needs-improvement`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching questions needing improvement:", error);
      throw error;
    }
  },

  // ==================== SUBJECT TEACHER ANALYTICS ====================

  /**
   * Lấy tổng quan về tất cả lớp mà giáo viên đang dạy
   * @param {number} teacherId - ID của giáo viên
   * @returns {Promise<Object>} Teacher overview with all classes
   */
  getTeacherOverview: async (teacherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/teacher/analytics/overview?teacherId=${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Transform snake_case to camelCase
      const data = response.data;
      return {
        teacherInfo: {
          teacherId: data.teacher_info?.teacher_id,
          teacherName: data.teacher_info?.teacher_name,
          subject: data.teacher_info?.subject,
          totalStudents: data.teacher_info?.total_students,
        },
        overallPerformance: {
          avgScore: data.overall_performance?.avg_score,
          passRate: data.overall_performance?.pass_rate,
          excellentRate: data.overall_performance?.excellent_rate,
          comparisonToSchool: {
            avgScoreDiff: data.overall_performance?.comparison_to_school?.avg_score_diff,
            passRateDiff: data.overall_performance?.comparison_to_school?.pass_rate_diff,
            excellentRateDiff: data.overall_performance?.comparison_to_school?.excellent_rate_diff,
          },
        },
        classes: data.classes?.map(cls => ({
          classId: cls.class_id,
          className: cls.class_name,
          gradeLevel: cls.grade_level,
          studentCount: cls.student_count,
          avgScore: cls.avg_score,
          passRate: cls.pass_rate,
          excellentRate: cls.excellent_rate,
          trend: cls.trend,
        })) || [],
      };
    } catch (error) {
      console.error("Error fetching teacher overview:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê chi tiết về một lớp cụ thể
   * @param {number} classId - ID của lớp
   * @param {number} teacherId - ID của giáo viên
   * @returns {Promise<Object>} Class analytics
   */
  getClassAnalytics: async (classId, teacherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/teacher/analytics/classes/${classId}?teacherId=${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Transform snake_case to camelCase if needed
      const data = response.data;
      if (data.class_info) {
        return {
          classInfo: {
            classId: data.class_info?.class_id,
            className: data.class_info?.class_name,
            gradeLevel: data.class_info?.grade_level,
            studentCount: data.class_info?.student_count,
          },
          performance: {
            avgScore: data.performance?.avg_score,
            passRate: data.performance?.pass_rate,
            excellentRate: data.performance?.excellent_rate,
          },
          students: data.students?.map(student => ({
            studentId: student.student_id,
            studentName: student.student_name,
            avgScore: student.avg_score,
            passRate: student.pass_rate,
            excellentRate: student.excellent_rate,
            trend: student.trend,
          })) || [],
        };
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for class ${classId}:`, error);
      throw error;
    }
  },

  /**
   * Xem chi tiết kết quả học tập của học sinh trong môn học
   * @param {number} studentId - ID của học sinh
   * @param {number} teacherId - ID của giáo viên
   * @returns {Promise<Object>} Student performance in subject
   */
  getStudentPerformance: async (studentId, teacherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/teacher/analytics/students/${studentId}?teacherId=${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Transform snake_case to camelCase if needed
      const data = response.data;
      if (data.student_info) {
        return {
          studentInfo: {
            studentId: data.student_info?.student_id,
            studentName: data.student_info?.student_name,
            className: data.student_info?.class_name,
          },
          performance: {
            avgScore: data.performance?.avg_score,
            passRate: data.performance?.pass_rate,
            excellentRate: data.performance?.excellent_rate,
          },
          assignments: data.assignments?.map(assignment => ({
            assignmentId: assignment.assignment_id,
            assignmentTitle: assignment.assignment_title,
            score: assignment.score,
            completedAt: assignment.completed_at,
          })) || [],
        };
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching performance for student ${studentId}:`,
        error
      );
      throw error;
    }
  },

  // ==================== HOMEROOM TEACHER ANALYTICS ====================

  /**
   * Lấy tổng quan toàn diện về lớp chủ nhiệm (tất cả các môn)
   * @param {number} classId - ID của lớp chủ nhiệm
   * @param {number} teacherId - ID của giáo viên chủ nhiệm
   * @returns {Promise<Object>} Homeroom class overview (all subjects)
   */
  getHomeroomClassOverview: async (classId, teacherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/homeroom/analytics/my-class?classId=${classId}&teacherId=${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Transform snake_case to camelCase if needed
      const data = response.data;
      if (data.class_info) {
        return {
          classInfo: {
            classId: data.class_info?.class_id,
            className: data.class_info?.class_name,
            gradeLevel: data.class_info?.grade_level,
            studentCount: data.class_info?.student_count,
            homeroomTeacher: data.class_info?.homeroom_teacher,
          },
          overallPerformance: {
            avgScore: data.overall_performance?.avg_score,
            passRate: data.overall_performance?.pass_rate,
            excellentRate: data.overall_performance?.excellent_rate,
          },
          subjectPerformance: data.subject_performance?.map(subject => ({
            subjectName: subject.subject_name,
            avgScore: subject.avg_score,
            passRate: subject.pass_rate,
            excellentRate: subject.excellent_rate,
            teacherName: subject.teacher_name,
          })) || [],
          topStudents: data.top_students?.map(student => ({
            studentId: student.student_id,
            studentName: student.student_name,
            avgScore: student.avg_score,
          })) || [],
          strugglingStudents: data.struggling_students?.map(student => ({
            studentId: student.student_id,
            studentName: student.student_name,
            avgScore: student.avg_score,
            subjectsNeedingHelp: student.subjects_needing_help,
          })) || [],
        };
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching homeroom class ${classId} overview:`,
        error
      );
      throw error;
    }
  },

  /**
   * Xem kết quả học tập của học sinh trên TẤT CẢ các môn (homeroom teacher only)
   * @param {number} studentId - ID của học sinh
   * @param {number} teacherId - ID của giáo viên chủ nhiệm
   * @returns {Promise<Object>} Student complete performance (all subjects)
   */
  getStudentCompletePerformance: async (studentId, teacherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${config.BASE_URL}/api/homeroom/analytics/students/${studentId}?teacherId=${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Transform snake_case to camelCase if needed
      const data = response.data;
      if (data.student_info) {
        return {
          studentInfo: {
            studentId: data.student_info?.student_id,
            studentName: data.student_info?.student_name,
            className: data.student_info?.class_name,
          },
          overallPerformance: {
            avgScore: data.overall_performance?.avg_score,
            passRate: data.overall_performance?.pass_rate,
            excellentRate: data.overall_performance?.excellent_rate,
            rank: data.overall_performance?.rank,
            totalStudents: data.overall_performance?.total_students,
          },
          subjectDetails: data.subject_details?.map(subject => ({
            subjectName: subject.subject_name,
            avgScore: subject.avg_score,
            passRate: subject.pass_rate,
            excellentRate: subject.excellent_rate,
            teacherName: subject.teacher_name,
          })) || [],
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
        };
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching complete performance for student ${studentId}:`,
        error
      );
      throw error;
    }
  },
};

export default analyticsService;
