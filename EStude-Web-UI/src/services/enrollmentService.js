import config from "../config/config.js";

const endpoints = {
  enrollStudent: "/api/enrollments",
  unenrollStudent: "/api/enrollments/{enrollmentId}",
  getEnrollmentsByClass: "/api/classes/{classId}/enrollments",
};

const enrollmentService = {
  getAllEnrollments: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollStudent}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách học sinh tham gia lớp học thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách học sinh tham gia lớp học:", error);
      return null;
    }
  },

  enrollStudent: async (enrollment) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollStudent}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enrollment),
        }
      );
      if (!response.ok) {
        throw new Error("Gán học sinh vào lớp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi gán học sinh vào lớp:", error);
      return null;
    }
  },

  unenrollStudent: async (enrollmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.unenrollStudent.replace(
          "{enrollmentId}",
          enrollmentId
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(
        `${config.BASE_URL}${endpoints.unenrollStudent.replace(
          "{enrollmentId}",
          enrollmentId
        )}`
      );

      if (!response.ok) {
        throw new Error("Xóa học sinh khỏi lớp thất bại");
      }
      try {
        const result = await response.json();
        console.log("result:", result);

        return result;
      } catch {
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi xóa học sinh khỏi lớp:", error);
      return null;
    }
  },
};

export default enrollmentService;
