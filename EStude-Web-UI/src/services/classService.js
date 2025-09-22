import config from "../config/config.js";

const endpoints = {
  addClass: "/api/classes",
  getClassById: "/api/classes/{classId}",
  getAllClasses: "/api/classes",
  getClassesBySchoolId: `/api/classes/school/{schoolId}`,
  updateClass: "/api/classes/{classId}",
  addHomeroomTeacher: "/api/classes/{classId}/homeroom-teacher",
  updateHomeroomTeacher: "/api/classes/{classId}/homeroom-teacher",
};

const classService = {
  addClass: async (classData) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.addClass}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
      });
      if (!response.ok) {
        throw new Error("Thêm lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm lớp:", error);
      return null;
    }
  },

  updateClass: async (classData) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateClass.replace(
          "{classId}",
          classData.classId
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(classData),
        }
      );
      if (!response.ok) {
        throw new Error("Cập nhật lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi cập nhật lớp:", error);
      return null;
    }
  },

  getAllClasses: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllClasses}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách lớp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp:", error);
      return null;
    }
  },

  getClassById: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassById.replace(
          "{classId}",
          classId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin lớp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin lớp:", error);
      return null;
    }
  },

  getClassesBySchoolId: async (schoolId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getClassesBySchoolId.replace(
          "{schoolId}",
          schoolId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách lớp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp:", error);
      return null;
    }
  },
};

export default classService;
