import config from "../config/config.js";

const endpoints = {
  addSubject: "/api/subjects",
  getAllSubjects: "/api/subjects",
};

const subjectService = {
  addSubject: async (subject) => {
    try {
      const payload = {
        name: subject.name,
        description: subject.description || "",
        schoolId: subject.schoolId || 0,
      };

      const response = await fetch(
        `${config.BASE_URL}${endpoints.addSubject}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Thêm môn học thất bại");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi thêm môn học:", error);
      return null;
    }
  },
  getAllSubjects: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllSubjects}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách môn học thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học:", error);
      return null;
    }
  },
};

export default subjectService;
