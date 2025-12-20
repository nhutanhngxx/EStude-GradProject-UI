import config from "../config/config.js";

const endpoints = {
  assignment: "/api/assignments",
  assignmentById: "/api/assignments/{assignmentId}",
  getAssignmentsByClassId: "/api/assignments/class/{classId}", // Class chứ không phải ClassSubject => phải lọc lại dữ liệu
  getAssignmentsByClassSubjectId:
    "/api/assignments/class-subject/{classSubjectId}",
};

const assignmentService = {
  addAssignment: async (assignment) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.assignment}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignment),
        }
      );
      console.log("response:", response);
      if (!response.ok) {
        throw new Error("Thêm bài tập thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      // console.error("Lỗi khi thêm bài tập:", error);
      return null;
    }
  },

  getAssignmentById: async (assignmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.assignmentById.replace(
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

  getAssignmentsByClassId: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignmentsByClassId.replace(
          "{classId}",
          classId
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

  getAssignmentsByClassSubjectId: async (classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAssignmentsByClassSubjectId.replace(
          "{classSubjectId}",
          classSubjectId
        )}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error("Lấy danh sách bài tập thất bại");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      // console.error("Lỗi khi lấy danh sách bài tập:", err);
      return null;
    }
  },

  // API cho học sinh
  getStudentAssignments: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/students/${studentId}/assignments`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        console.error("Lấy danh sách bài tập thất bại:", response.status);
        return [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài tập học sinh:", error);
      return [];
    }
  },
};

export default assignmentService;
