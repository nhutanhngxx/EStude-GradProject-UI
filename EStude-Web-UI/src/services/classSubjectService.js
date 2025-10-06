import config from "../config/config.js";

const endpoints = {
  addClassSubject: "/api/class-subjects",
  getTeacherClassSubjects: `/api/teachers/classes/{teacherId}/class-subjects`,
  getAllClassSubjects: "/api/class-subjects",
  deleteClassSubject: "/api/class-subjects/{classSubjectId}",
};

const accessToken = localStorage.getItem("accessToken");

const classSubjectService = {
  addClassSubject: async (classSubject) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.addClassSubject}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(classSubject),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error("Thêm môn học cho lớp thất bại: " + errText);
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm môn học cho lớp:", error);
      return null;
    }
  },

  deleteClassSubject: async (classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteClassSubject.replace(
          "{classSubjectId}",
          classSubjectId
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
        throw new Error("Xóa môn học của lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi xóa môn học của lớp:", error);
      return null;
    }
  },

  getTeacherClassSubjects: async (teacherId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getTeacherClassSubjects.replace(
          "{teacherId}",
          teacherId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error(
          "Lấy danh sách lớp học giảng dạy của giáo viên thất bại"
        );
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách lớp học giảng dạy của giáo viên:",
        error
      );
      return null;
    }
  },

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
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách môn học của lớp:", error);
      return null;
    }
  },
};

export default classSubjectService;
