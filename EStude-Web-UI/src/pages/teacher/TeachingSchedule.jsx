import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import vi from "date-fns/locale/vi";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Cấu hình ngôn ngữ
const locales = {
  vi: vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const TeachingSchedule = () => {
  const [events, setEvents] = useState([
    {
      title: "Giảng dạy Toán lớp 10",
      start: new Date(2025, 7, 11, 8, 0),
      end: new Date(2025, 7, 11, 9, 30),
    },
    {
      title: "Giảng dạy Vật lý lớp 12",
      start: new Date(2025, 7, 12, 13, 0),
      end: new Date(2025, 7, 12, 14, 30),
    },
  ]);

  // Thêm lịch mới
  const handleSelectSlot = ({ start, end }) => {
    const title = prompt("Nhập tiêu đề buổi học:");
    if (title) {
      setEvents((prev) => [...prev, { start, end, title }]);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Lịch giảng dạy</h1>
          <p className="text-gray-600">
            Lịch giảng dạy là một công cụ giúp giáo viên quản lý và theo dõi các
            hoạt động giảng dạy của mình.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Thêm lịch
        </button>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{}}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => alert(`Chi tiết: ${event.title}`)}
        messages={{
          next: "Tiếp",
          previous: "Trước",
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
        }}
        defaultView="week" // mặc định hiển thị dạng tuần như Google Calendar
      />
    </div>
  );
};

export default TeachingSchedule;
