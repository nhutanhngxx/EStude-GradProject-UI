import config from "../config/config.js";

const endpoints = {
  assignment: "/api/assignments",
  assignmentById: "/api/assignments/{assignmentId}",
  getAssignmentsByClassId: "/api/assignments/class/{classId}", // Class chứ không phải ClassSubject => phải lọc lại dữ liệu
};

const assignmentService = {
  addAssignment: async (assignment) => {
    console.log("Thêm bài tập:", assignment);
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
      return result.data;
    } catch (error) {
      console.error("Lỗi khi thêm bài tập:", error);
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
      console.error("Lỗi khi lấy danh sách bài tập:", error);
      return null;
    }
  },
};

export default assignmentService;
