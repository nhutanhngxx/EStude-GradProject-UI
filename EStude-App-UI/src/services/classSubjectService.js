import config from "../configs/config";

const endpoints = {
  getAllClassSubjects: "/api/class-subjects",
};

const classSubjectService = {
  getAllClassSubjects: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllClassSubjects}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách môn học của lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học của lớp:", error);
      return null;
    }
  },

  getByClassId: async (classId) => {
    try {
      const all = await classSubjectService.getAllClassSubjects();
      if (!Array.isArray(all)) return [];
      return all.filter((cs) => cs.clazz && cs.clazz.classId === classId);
    } catch (error) {
      console.error(`Lỗi khi lấy classSubject theo classId=${classId}:`, error);
      return [];
    }
  },
};

export default classSubjectService;
