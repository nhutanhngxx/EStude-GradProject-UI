import config from "../config/config.js";

const endpoints = {
  addSchool: "/api/schools",
  getSchool: "/api/schools",
  getAllSchools: "/api/schools",
  //   updateSchool: "/api/schools",
  //   deleteSchool: "/api/schools",
};

const schoolService = {
  addSchool: async (school) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.addSchool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(school),
      });
      if (!response.ok) {
        throw new Error("Thêm trường thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi thêm trường:", error);
      return null;
    }
  },
  getSchool: async (schoolId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSchool}/${schoolId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin trường thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin trường:", error);
      return null;
    }
  },
  getAllSchools: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllSchools}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách trường thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trường:", error);
      return null;
    }
  },
};

export default schoolService;
