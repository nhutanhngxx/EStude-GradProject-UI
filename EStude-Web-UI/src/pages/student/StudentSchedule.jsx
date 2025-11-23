import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import scheduleService from "../../services/scheduleService";
import { useToast } from "../../contexts/ToastContext";

const StudentSchedule = () => {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [schedules, setSchedules] = useState([]);
  const [viewMode, setViewMode] = useState("week"); // week or month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, viewMode]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate();
      const endDate = getEndDate();

      const data = await scheduleService.getSchedulesByStudent(
        user.userId,
        startDate,
        endDate
      );
      if (Array.isArray(data)) {
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
      showToast("Lỗi khi tải lịch học!", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    if (viewMode === "week") {
      const date = new Date(currentDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
      return new Date(date.setDate(diff));
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
  };

  const getEndDate = () => {
    if (viewMode === "week") {
      const startDate = getStartDate();
      return new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000); // +6 days
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
  };

  const getDaysInView = () => {
    if (viewMode === "week") {
      const days = [];
      const startDate = getStartDate();
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
      return days;
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];

      // Add days from previous month
      const startDay = firstDay.getDay();
      for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        days.push(date);
      }

      // Add days from current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      // Add days from next month
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }

      return days;
    }
  };

  const getSchedulesForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date).toISOString().split("T")[0];
      return scheduleDate === dateStr;
    });
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateRange = () => {
    const start = getStartDate();
    const end = getEndDate();

    if (viewMode === "week") {
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${
        end.getMonth() + 1
      }/${end.getFullYear()}`;
    } else {
      return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const ScheduleCard = ({ schedule }) => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded p-2 mb-2 hover:shadow-md transition">
      <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
        {schedule.subjectName}
      </div>
      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <Clock className="w-3 h-3 mr-1" />
        {schedule.startTime} - {schedule.endTime}
      </div>
      {schedule.room && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
          <MapPin className="w-3 h-3 mr-1" />
          {schedule.room}
        </div>
      )}
      {schedule.teacherName && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <User className="w-3 h-3 mr-1" />
          {schedule.teacherName}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Lịch học của tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Xem lịch học theo tuần hoặc tháng
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Calendar controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDateRange()}
              </span>
            </div>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Hôm nay
            </button>
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border-b">
            {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map(
              (day) => (
                <div
                  key={day}
                  className="bg-gray-50 dark:bg-gray-800 p-3 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm"
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {getDaysInView().map((date, index) => {
              const daySchedules = getSchedulesForDate(date);
              const today = isToday(date);
              const currentMonth = isCurrentMonth(date);

              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 ${
                    today
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-white dark:bg-gray-800"
                  } ${
                    !currentMonth && viewMode === "month" ? "opacity-50" : ""
                  }`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      today
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.scheduleId}
                        schedule={schedule}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Mẹo:</strong> Nhấp vào ngày hôm nay để quay lại ngày hiện
          tại. Sử dụng các nút mũi tên để di chuyển qua các tuần/tháng.
        </p>
      </div>
    </div>
  );
};

export default StudentSchedule;
