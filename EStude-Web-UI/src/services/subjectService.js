import config from "../config/config.js";

const endpoints = {
  addSubject: "/api/subjects",
  getAllSubjects: "/api/subjects",
  updateSubject: "/api/subjects/{subjectId}",
  deleteSubject: "/api/subjects/{subjectId}",
  getSubjectByClassId: "/api/subjects/by-class/{classId}",
};

const accessToken = localStorage.getItem("accessToken");

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
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

  updateSubject: async (subject) => {
    try {
      const payload = {
        name: subject.name,
        description: subject.description || "",
        schoolId: subject.schoolId || 0,
      };
      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateSubject.replace(
          "{subjectId}",
          subject.subjectId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error("Cập nhật môn học thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi cập nhật môn học:", error);
      return null;
    }
  },

  deleteSubject: async (subjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteSubject.replace(
          "{subjectId}",
          subjectId
        )}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Xóa môn học thất bại");
      }
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa môn học:", error);
      return false;
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

  getSubjectByClassId: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSubjectByClassId.replace(
          "{classId}",
          classId
        )}`,
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

  getSubjectById: async (subjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/subjects/${subjectId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin môn học thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin môn học:", error);
      return null;
    }
  },
};

export default subjectService;
