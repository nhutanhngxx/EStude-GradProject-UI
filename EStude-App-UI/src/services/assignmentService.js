import config from "../configs/config";

const endpoints = {
  getAssignments: "/api/assignments",
  getAssignmentsByStudent: "/api/students/{studentId}/assignments",
  getAssignmentsBySubmission: "/api/submissions/{submissionId}/assignment",
  getAssignmentsByClassSubject:
    "/api/assignments/class-subject/{classSubjectId}",
  getAssignment: "/api/assignments/{assignmentId}",
};

const assignmentService = {
  getAssignmentById: async (assignmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignment.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin bài tập thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bài tập:", error);
      return null;
    }
  },
  getAssignments: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignments}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách bài tập thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      // console.error("Lỗi khi lấy danh sách bài tập:", error);
      return null;
    }
  },

  getAssignmentsByClassSubject: async (classSubjectId) => {
    try {
      const all = await assignmentService.getAssignments();
      if (!Array.isArray(all)) return [];
      return all.filter(
        (a) =>
          a.classSubject && a.classSubject.classSubjectId === classSubjectId
      );
    } catch (error) {
      console.error("Lỗi khi lọc bài tập theo classSubject:", error);
      return [];
    }
  },

  getAssignmentsByClass: async (classId) => {
    try {
      const all = await assignmentService.getAssignments();
      if (!Array.isArray(all)) return [];
      return all.filter(
        (a) => (a.classId || a.classSubject?.clazz?.classId) === classId
      );
    } catch (error) {
      console.error("Lỗi khi lọc bài tập theo lớp:", error);
      return [];
    }
  },

  getAssignmentsByStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignmentsByStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách bài tập thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      // console.error("Lỗi khi lấy danh sách bài tập:", error);
      return null;
    }
  },

  getAssignmentBySubmission: async (submissionId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignmentsBySubmission.replace(
          "{submissionId}",
          submissionId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy bài tập thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy bài tập:", error);
      return null;
    }
  },

  getAssignmentsByClassSubject: async (classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignmentsByClassSubject.replace(
          "{classSubjectId}",
          classSubjectId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        return [];
      }
      const result = await response.json();
      return result;
    } catch (error) {
      // console.error("Lỗi khi lấy danh sách bài tập:", error);
      return null;
    }
  },
};

export default assignmentService;
