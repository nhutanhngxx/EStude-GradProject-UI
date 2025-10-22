import config from "../configs/config";

const endpoints = {
  getAllClassSubjects: "/api/class-subjects",
  getClassSubjectsByStudent: "/api/students/{studentId}/subjects",
  getClassSubject: "/api/class-subjects/{classSubjectId}",
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

  getClassSubject: async (classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassSubject.replace(
          "{classSubjectId}",
          classSubjectId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin môn học của lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy thông tin môn học của lớp:", error);
      return null;
    }
  },

  getByClassAndTerm: async (classId, termId) => {
    try {
      const all = await classSubjectService.getAllClassSubjects();
      if (!Array.isArray(all)) return [];

      // Lọc theo termId và classId
      const filtered = all.filter(
        (cs) =>
          cs.term &&
          cs.term.termId === termId &&
          cs.clazz &&
          cs.clazz.classId === classId
      );

      // console.log("filtered by termId:", filtered);
      return filtered;
    } catch (error) {
      console.error(
        `Lỗi khi lấy classSubject theo classId=${classId} và termId=${termId}:`,
        error
      );
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
      const studentSubjects =
        await classSubjectService.getClassSubjectsByStudent({ studentId });
      if (!Array.isArray(studentSubjects) || studentSubjects.length === 0)
        return [];

      const allClassSubjects = await classSubjectService.getAllClassSubjects();
      if (!Array.isArray(allClassSubjects)) return [];

      const detailedSubjects = studentSubjects.map((s) => {
        const detail = allClassSubjects.find(
          (cs) => cs.classSubjectId === s.classSubjectId
        );

        return {
          classSubjectId: s.classSubjectId,
          beginDate: s.beginDate,
          endDate: s.endDate,
          clazz: {
            classId: s.classId,
            name: s.className,
            term: { termId: s.termId, name: s.termName },
          },
          description: `${detail?.subject?.name || s.subjectName} - ${
            s.className
          }`,
          name: detail?.subject?.name || s.subjectName,
          semester: s.termName,
          subjectId: detail?.subject?.subjectId || s.subjectId,
          teacherName: detail?.teacher?.fullName || s.teacherName,
        };
      });

      return detailedSubjects;
    } catch (error) {
      console.error("Lỗi khi map classSubject chi tiết cho học sinh:", error);
      return [];
    }
  },
};

export default classSubjectService;
