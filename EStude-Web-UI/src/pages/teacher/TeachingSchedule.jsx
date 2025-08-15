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
    <div style={{ padding: "20px", backgroundColor: "#fff" }}>
      <h2 className="text-2xl font-bold mb-4">📅 Lịch giảng dạy</h2>
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
