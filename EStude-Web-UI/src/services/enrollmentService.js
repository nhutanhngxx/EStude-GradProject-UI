import config from "../config/config.js";

const endpoints = {
  enrollBatch: "/api/enrollments",
  unenrollStudent: "/api/enrollments/{enrollmentId}",
  getEnrollmentsByClass: "/api/classes/{classId}/enrollments",
};

const accessToken = localStorage.getItem("accessToken");
const enrollmentService = {
  getAllEnrollments: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollBatch}`,
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

  enrollStudentsBatch: async (classId, studentIds) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.enrollBatch}?classId=${classId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(studentIds), // BE nhận mảng studentIds
        }
      );
      if (!response.ok) {
        throw new Error("Gán học sinh vào lớp thất bại");
      }
      return await response.json(); // BE trả về List<Enrollment>
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
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
