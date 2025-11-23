import config from "../config/config.js";

const endpoints = {
  // Tạo mới 1 session điểm danh (param)
  createAttendanceSession: "/api/attendance/sessions",

  // Xem chi tiết 1 session điểm danh
  getAttentanceSession: "/api/attendance/sessions/{sessionId}/records",

  // Xem tất cả các session của classSubject do giáo viên đó dạy
  getAttentanceSessionByClassSubjectForTeacher:
    "/api/attendance/sessions/class-subject/{classSubjectId}/teacher",

  // Xem trạng thái điểm danh của các học sinh điểm danh theo session
  getAttentanceStatusOfStudentsBySessionId:
    "/api/attendance/sessions/{sessionId}/students",

  // Giáo viên điểm danh thủ công cho học sinh trong lớp
  markAttendance: "/api/attendance/records/teacher",
};

const attendanceService = {
  createAttendanceSession: async ({
    teacherId,
    classSubjectId,
    sessionName,
    startTime,
    endTime,
    gpsLatitude = null,
    gpsLongitude = null,
  }) => {
    try {
      const url = new URL(
        `${config.BASE_URL}${endpoints.createAttendanceSession}`
      );

      // Append query params
      url.searchParams.append("teacherId", teacherId);
      url.searchParams.append("classSubjectId", classSubjectId);
      url.searchParams.append("sessionName", sessionName);
      url.searchParams.append("startTime", startTime);
      url.searchParams.append("endTime", endTime);

      // Nếu có GPS thì mới append
      if (gpsLatitude !== null && gpsLongitude !== null) {
        url.searchParams.append("gpsLatitude", gpsLatitude);
        url.searchParams.append("gpsLongitude", gpsLongitude);
      }

      console.log("url:", url.toString());

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Tạo session điểm danh thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi tạo session điểm danh:", error);
      return null;
    }
  },

  getAttentanceSession: async (sessionId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAttentanceSession.replace(
          "{sessionId}",
          sessionId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy session điểm danh thất bại mất òi :)))");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy session điểm danh:", error);
      return null;
    }
  },

  getAttentanceSessionByClassSubjectForTeacher: async (
    classSubjectId,
    teacherId
  ) => {
    try {
      const url = `${
        config.BASE_URL
      }${endpoints.getAttentanceSessionByClassSubjectForTeacher.replace(
        "{classSubjectId}",
        classSubjectId
      )}?teacherId=${teacherId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Lấy danh sách session điểm danh thất bại mất òi :)))");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách session điểm danh:", error);
      return null;
    }
  },

  getAttentanceStatusOfStudentsBySessionId: async (sessionId, teacherId) => {
    try {
      const url = `${
        config.BASE_URL
      }${endpoints.getAttentanceStatusOfStudentsBySessionId.replace(
        "{sessionId}",
        sessionId
      )}?teacherId=${teacherId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Lấy trạng thái điểm danh thất bại mất òi :)))");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái điểm danh:", error);
      return null;
    }
  },

  markAttendance: async (sessionId, studentId, teacherId, status) => {
    try {
      const url = new URL(`${config.BASE_URL}${endpoints.markAttendance}`);
      url.searchParams.append("sessionId", sessionId);
      url.searchParams.append("studentId", studentId);
      url.searchParams.append("teacherId", teacherId);
      url.searchParams.append("status", status);
      console.log("url markAttendance:", url.toString());

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Điểm danh thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi điểm danh:", error);
      return null;
    }
  },

  // API cho học sinh
  getAttendanceByStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/students/${studentId}/attendance`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        console.error("Lấy lịch sử điểm danh thất bại:", response.status);
        return [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử điểm danh học sinh:", error);
      return [];
    }
  },

  getAttendanceSessionByClassSubjectForStudent: async (
    classSubjectId,
    studentId
  ) => {
    try {
      const url = `${config.BASE_URL}/api/attendance/sessions/class-subject/${classSubjectId}?studentId=${studentId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(
          "Lấy danh sách session điểm danh thất bại:",
          response.status
        );
        return [];
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách session điểm danh:", error);
      return [];
    }
  },
};

export default attendanceService;
