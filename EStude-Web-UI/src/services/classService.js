import config from "../config/config.js";

const endpoints = {
  addClass: "/api/classes",
  getClassById: "/api/classes/{classId}",
  getAllClasses: "/api/classes",
  getClassesBySchoolId: `/api/classes/school/{schoolId}`,
  updateClass: "/api/classes/{classId}",
  assignHomeroomTeacher: "/api/classes/{classId}/homeroom-teacher",
  updateHomeroomTeacher: "/api/classes/{classId}/homeroom-teacher",
  deleteClass: "/api/classes/{classId}",
};

const accessToken = localStorage.getItem("accessToken");

const classService = {
  addClass: async (classData) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.addClass}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
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

  deleteClass: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteClass.replace(
          "{classId}",
          classId
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
        throw new Error("Xóa lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi xóa lớp:", error);
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

  assignHomeroomTeacher: async (classId, teacherId) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Không tìm thấy user trong localStorage");

      const user = JSON.parse(userStr); // phải parse
      const userId = user.userId;

      const response = await fetch(
        `${config.BASE_URL}${endpoints.assignHomeroomTeacher.replace(
          "{classId}",
          classId
        )}?teacherId=${teacherId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );

      console.log("assignHomeroomTeacher request:", {
        url: `${config.BASE_URL}/api/classes/${classId}/homeroom-teacher?teacherId=${teacherId}`,
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Gán giáo viên chủ nhiệm thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi gán giáo viên chủ nhiệm:", error);
      return null;
    }
  },

  updateHomeroomTeacher: async (classId, newTeacherId) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Không tìm thấy user trong localStorage");

      const user = JSON.parse(userStr);
      const userId = user.userId;

      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateHomeroomTeacher.replace(
          "{classId}",
          classId
        )}?newTeacherId=${newTeacherId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );

      console.log("updateHomeroomTeacher request:", {
        url: `${config.BASE_URL}/api/classes/${classId}/homeroom-teacher?newTeacherId=${newTeacherId}`,
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Cập nhật giáo viên chủ nhiệm thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi cập nhật giáo viên chủ nhiệm:", error);
      return null;
    }
  },
};

export default classService;
