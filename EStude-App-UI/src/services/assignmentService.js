import config from "../configs/config";

const endpoints = {
  getAssignments: "/api/assignments",
};

const assignmentService = {
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
      console.error("Lỗi khi lấy danh sách bài tập:", error);
      return null;
    }
  },
  getAssignmentsByClass: async (classId) => {
    try {
      const all = await assignmentService.getAssignments();
      if (!Array.isArray(all)) return [];
      return all.filter(
        (a) => a.classSubject && a.classSubject.clazz.classId === classId
      );
    } catch (error) {
      console.error("Lỗi khi lọc bài tập theo lớp:", error);
      return [];
    }
  },
};

export default assignmentService;
