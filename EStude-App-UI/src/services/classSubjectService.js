import config from "../configs/config";

const endpoints = {
  getAllClassSubjects: "/api/class-subjects",
  getClassSubjectsByStudent: "/api/students/{studentId}/subjects",
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

  getClassSubjectsByStudent: async ({ studentId }) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassSubjectsByStudent.replace(
          "{studentId}",
          studentId
        )}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error("Lấy danh sách môn học của học sinh thất bại");
      }

      const data = await response.json();
      return data; // Trả về mảng JSON
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học của học sinh:", error);
      return [];
    }
  },

  getClassSubjectsByStudentWithDetails: async ({ studentId }) => {
    try {
      // 1. Lấy classSubject của học sinh
      const studentSubjects =
        await classSubjectService.getClassSubjectsByStudent({ studentId });
      if (!Array.isArray(studentSubjects) || studentSubjects.length === 0)
        return [];

      // 2. Lấy tất cả classSubject chi tiết
      const allClassSubjects = await classSubjectService.getAllClassSubjects();
      if (!Array.isArray(allClassSubjects)) return [];

      // 3. Map sang dạng flatten giống log đầu tiên
      const detailedSubjects = studentSubjects
        .map((s) => {
          const detail = allClassSubjects.find(
            (cs) => cs.classSubjectId === s.classSubjectId
          );
          if (!detail) return null;

          return {
            classSubjectId: detail.classSubjectId,
            beginDate: detail.clazz?.beginDate || null,
            endDate: detail.clazz?.endDate || null,
            clazz: {
              classId: detail.clazz?.classId,
              name: detail.clazz?.name,
              term: detail.clazz?.term,
            },
            description: `${detail.name} - ${detail.clazz?.name || ""}`,
            name: detail.subject?.name || detail.name,
            semester: detail.clazz?.term || "",
            subjectId: detail.subject?.subjectId || null,
            teacherName: detail.teacher?.fullName || "",
          };
        })
        .filter(Boolean);

      return detailedSubjects;
    } catch (error) {
      console.error("Lỗi khi map classSubject chi tiết cho học sinh:", error);
      return [];
    }
  },
};

export default classSubjectService;
