import axios from "axios";
import config from "../config/config";

// Helper để lấy teacherId từ localStorage
const getTeacherId = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  // TeacherId thực tế là userId của user
  return user?.userId || null;
};

const homeroomService = {
  /**
   * Lấy danh sách học sinh lớp chủ nhiệm
   * @returns {Promise<Array>} Danh sách lớp chủ nhiệm với thông tin học sinh
   */
  getHomeroomStudents: async () => {
    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        throw new Error("Không tìm thấy thông tin giáo viên");
      }

      const response = await axios.get(
        `${config.BASE_URL}/api/teachers/${teacherId}/homeroom-students`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching homeroom students:", error);
      throw error;
    }
  },
};

export default homeroomService;
