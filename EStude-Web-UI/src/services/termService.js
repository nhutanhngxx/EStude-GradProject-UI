import config from "../config/config.js";

const endpoints = {
  getAllTerms: "/api/terms",
  getTermsBySchool: "/api/terms/school/{schoolId}",
  getTermById: "/api/terms/{termId}",
};

const termService = {
  /**
   * Get all terms
   * @returns {Promise<Array|null>} List of all terms or null
   */
  getAllTerms: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllTerms}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học kỳ thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học kỳ:", error);
      return null;
    }
  },

  /**
   * Get all terms by school ID
   * @param {number} schoolId - School ID
   * @returns {Promise<Array|null>} List of terms for the school or null
   */
  getTermsBySchool: async (schoolId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getTermsBySchool.replace(
          "{schoolId}",
          schoolId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học kỳ của trường thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học kỳ của trường:", error);
      return null;
    }
  },

  /**
   * Get term by ID
   * @param {number} termId - Term ID
   * @returns {Promise<Object|null>} Term object or null
   */
  getTermById: async (termId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getTermById.replace("{termId}", termId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy thông tin học kỳ thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin học kỳ:", error);
      return null;
    }
  },
};

export default termService;

