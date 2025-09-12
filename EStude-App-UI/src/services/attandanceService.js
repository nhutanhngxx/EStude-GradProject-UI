import config from "../configs/config";

const endpoints = {
  getAttentanceSessionByClassSubjectForStudent:
    "/api/attendance/sessions/class-subject/{classSubjectId}",
  markAttendance: "/api/attendance/records/student",
};

const attendanceService = {
  getAttentanceSessionByClassSubjectForStudent: async (
    classSubjectId,
    studentId
  ) => {
    try {
      const url = `${
        config.BASE_URL
      }${endpoints.getAttentanceSessionByClassSubjectForStudent.replace(
        "{classSubjectId}",
        classSubjectId
      )}?studentId=${studentId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Lấy danh sách session điểm danh thất bại mất òi :)))");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách session điểm danh:", error);
      return null;
    }
  },

  markAttendance: async (
    sessionId,
    studentId,
    method = "BUTTON_PRESS",
    gps = null
  ) => {
    try {
      let url = `${config.BASE_URL}${endpoints.markAttendance}?sessionId=${sessionId}&studentId=${studentId}&method=${method}`;
      if (gps?.latitude && gps?.longitude) {
        url += `&gpsLatitude=${gps.latitude}&gpsLongitude=${gps.longitude}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Điểm danh thất bại :(((");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi điểm danh:", error);
      return null;
    }
  },
};

export default attendanceService;
