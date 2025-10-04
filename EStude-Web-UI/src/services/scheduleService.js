import config from "../config/config.js";

const endpoints = {
  createSchedule: "/api/schedules",
  updateSchedule: "/api/schedules/{scheduleId}",
  getSchedulesByTeacher: "/api/schedules/teacher/{teacherId}",
  getSchedulesByClass: "/api/schedules/class/{classId}",
  deleteSchedule: "/api/schedules/{scheduleId}",
};

const scheduleService = {
  createSchedule: async (schedule) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.createSchedule}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schedule),
        }
      );
      if (!response.ok) {
        throw new Error("Tạo lịch giảng dạy thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi tạo lịch giảng dạy:", error);
      return null;
    }
  },

  updateSchedule: async (scheduleId, schedule) => {
    try {
      if (!scheduleId) {
        throw new Error("scheduleId không hợp lệ");
      }
      if (
        !schedule ||
        !schedule.term?.termId ||
        !schedule.classSubject?.classSubjectId
      ) {
        throw new Error("Thiếu termId hoặc classSubjectId trong payload");
      }

      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateSchedule.replace(
          "{scheduleId}",
          scheduleId
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...schedule,
            date: schedule.date ? new Date(schedule.date).toISOString() : null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;
        let message = `Cập nhật lịch giảng dạy thất bại: ${errorText}`;
        if (status === 400) {
          message = "Dữ liệu không hợp lệ. Vui lòng kiểm tra thông tin lịch.";
        } else if (status === 404) {
          message = "Lịch không tồn tại.";
        } else if (status === 403) {
          message = "Không có quyền cập nhật lịch này.";
        }
        throw new Error(message);
      }

      // Nếu BE trả 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      // Ngược lại trả về JSON đúng như BE trả
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi cập nhật lịch giảng dạy:", error);
      return null;
    }
  },

  getSchedulesByTeacher: async (teacherId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSchedulesByTeacher.replace(
          "{teacherId}",
          teacherId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy lịch giảng dạy thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy lịch giảng dạy:", error);
      return null;
    }
  },

  getSchedulesByClass: async (classId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSchedulesByClass.replace(
          "{classId}",
          classId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy lịch giảng dạy thất bại");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch giảng dạy:", error);
      return null;
    }
  },

  deleteSchedule: async (scheduleId) => {
    try {
      if (!scheduleId) {
        throw new Error("scheduleId không hợp lệ");
      }
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteSchedule.replace(
          "{scheduleId}",
          scheduleId
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;
        let message = `Xóa lịch giảng dạy thất bại: ${errorText}`;
        if (status === 404) {
          message = "Lịch không tồn tại.";
        } else if (status === 403) {
          message = "Không có quyền xóa lịch này.";
        }
        throw new Error(message);
      }
      // Xử lý body rỗng (HTTP 204 No Content)
      return response.status === 204
        ? { success: true }
        : await response.json();
    } catch (error) {
      console.error("Lỗi khi xóa lịch giảng dạy:", error);
      return null;
    }
  },
};

export default scheduleService;
