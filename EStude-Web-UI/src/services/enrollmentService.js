import config from "../config/config.js";

const endpoints = {
  enrollBatch: "/api/enrollments",
  unenrollStudent: "/api/enrollments/{enrollmentId}",
  getEnrollmentsByClass: "/api/classes/{classId}/enrollments",
};

const enrollmentService = {
  getAllEnrollments: async () => {
    try {
      // ✅ FIX: Lấy token fresh mỗi lần gọi API
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollBatch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // ✅ THÊM Authorization
          },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học sinh tham gia lớp học thất bại");
      }
      const result = await response.json();
      return result; // ✅ Trả về mảng trực tiếp từ server
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học sinh tham gia lớp học:", error);
      return []; // ✅ Trả về [] thay vì null
    }
  },

  enrollStudentsBatch: async (classId, studentIds) => {
    try {
      // ✅ FIX: Lấy token fresh
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollBatch}?classId=${classId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(studentIds),
        }
      );
      if (!response.ok) {
        throw new Error("Gán học sinh vào lớp thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi gán học sinh vào lớp:", error);
      throw error; // ✅ Throw error để caller xử lý
    }
  },

  unenrollStudent: async (enrollmentId) => {
    try {
      // ✅ FIX: Lấy token fresh
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(
        `${config.BASE_URL}${endpoints.unenrollStudent.replace(
          "{enrollmentId}",
          enrollmentId
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
        throw new Error("Xóa học sinh khỏi lớp thất bại");
      }

      // ✅ Handle 204 No Content
      if (response.status === 204) {
        return true;
      }

      try {
        const result = await response.json();
        return result;
      } catch {
        return true; // No JSON body
      }
    } catch (error) {
      console.error("Lỗi khi xóa học sinh khỏi lớp:", error);
      throw error; // ✅ Throw error để caller xử lý
    }
  },
};

export default enrollmentService;
