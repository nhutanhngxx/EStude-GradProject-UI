import config from "../configs/config";
import socketService from "./socketService";

const endpoints = {
  getAttentanceSessionByClassSubjectForStudent:
    "/api/attendance/sessions/class-subject/{classSubjectId}",
  markAttendance: "/api/attendance/records/student",
};

const parseDate = (dateStr) => new Date(dateStr);

const attendanceService = {
  getAttentanceSessionByClassSubjectForStudent: async (
    classSubjectId,
    studentId,
    filter = null // { type: 'day'|'week'|'month'|'range', value: 'YYYY-MM-DD', startDate, endDate }
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

      const data = await response.json();

      if (!filter) return data; // Không lọc gì

      let start, end;

      switch (filter.type) {
        case "day":
          start = new Date(`${filter.value}T00:00:00`);
          end = new Date(`${filter.value}T23:59:59`);
          break;

        case "week":
          {
            const current = new Date(filter.value);
            const day = current.getDay() === 0 ? 7 : current.getDay(); // Chủ nhật = 7
            start = new Date(current);
            start.setDate(current.getDate() - (day - 1));
            start.setHours(0, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
          }
          break;

        case "month":
          {
            const current = new Date(filter.value);
            start = new Date(
              current.getFullYear(),
              current.getMonth(),
              1,
              0,
              0,
              0
            );
            end = new Date(
              current.getFullYear(),
              current.getMonth() + 1,
              0,
              23,
              59,
              59
            );
          }
          break;

        case "range":
          start = new Date(`${filter.startDate}T00:00:00`);
          end = new Date(`${filter.endDate}T23:59:59`);
          break;

        default:
          return data;
      }

      return data.filter((s) => {
        const sessionStart = parseDate(s.startTime);
        return sessionStart >= start && sessionStart <= end;
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách session điểm danh:", error);
      return [];
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

      const data = await response.json();

      // Sau khi điểm danh thành công, publish socket để notify giáo viên
      if (socketService?.client?.connected) {
        socketService.publish(`/app/session/${sessionId}/records`, {
          sessionId,
          studentId,
          status: data?.status || "PRESENT",
          markedAt: new Date().toISOString(),
        });
      }

      return data;
    } catch (error) {
      console.error("Lỗi khi điểm danh:", error);
      return null;
    }
  },
};

export default attendanceService;
