import React, { useState, useEffect, useContext, useMemo } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import scheduleService from "../../services/scheduleService";

// --- Helper functions ---
const isoDateOnly = (d) => {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const formatVNDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const ngay = String(d.getDate()).padStart(2, "0");
  const thang = String(d.getMonth() + 1).padStart(2, "0");
  const nam = d.getFullYear();
  return `${ngay}/${thang}/${nam}`;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDates = (date) => {
  const monday = startOfWeekMonday(date);
  return [...Array(7)].map((_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dd.setHours(0, 0, 0, 0);
    return dd;
  });
};

const getMonthDates = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [...Array(daysInMonth)].map(
    (_, i) => new Date(year, month, i + 1, 0, 0, 0, 0)
  );
};

const sortSchedules = (arr) =>
  [...arr].sort((a, b) => (a.startPeriod ?? 0) - (b.startPeriod ?? 0));

// --- Main Component ---
export default function TeachingScheduleFull() {
  const { darkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState("");

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const teacherId = user?.userId;
      if (!teacherId)
        throw new Error("Không tìm thấy teacherId trong localStorage.user");

      const data = await scheduleService.getSchedulesByTeacher(teacherId);
      if (!data) throw new Error("Không có dữ liệu lịch");

      const normalized = (data || []).map((it) => ({
        ...it,
        dateOnly: isoDateOnly(it.date).toISOString().slice(0, 10),
      }));
      setSchedules(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi khi tải lịch");
      showToast?.(err.message || "Lỗi khi tải lịch", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Navigation
  const goPrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() - 1);
      else if (viewMode === "week") d.setDate(d.getDate() - 7);
      else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
      return new Date(d);
    });
  };

  const goNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() + 1);
      else if (viewMode === "week") d.setDate(d.getDate() + 7);
      else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
      return new Date(d);
    });
  };

  const goToday = () => setCurrentDate(startOfWeekMonday(new Date()));

  const handleWeekPicker = (e) => {
    const val = e.target.value; // yyyy-Www
    if (!val) return;
    const [yearStr, weekStr] = val.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    if (isNaN(year) || isNaN(week)) return;

    const jan4 = new Date(year, 0, 4);
    const dayOfJan4 = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - (dayOfJan4 - 1));

    const target = new Date(mondayWeek1);
    target.setDate(mondayWeek1.getDate() + (week - 1) * 7);
    setCurrentDate(target);
  };

  const handleDayPicker = (e) => {
    if (!e.target.value) return;
    setCurrentDate(new Date(e.target.value));
  };

  // Compute visible dates
  const visibleDates = useMemo(() => {
    if (viewMode === "day") return [isoDateOnly(currentDate)];
    if (viewMode === "week") return getWeekDates(currentDate).map(isoDateOnly);
    return getMonthDates(currentDate).map(isoDateOnly);
  }, [viewMode, currentDate]);

  // Map schedules by date
  const schedulesByDate = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const key = s.dateOnly;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    Object.keys(map).forEach((k) => (map[k] = sortSchedules(map[k])));
    return map;
  }, [schedules]);

  // --- Components ---
  const ScheduleCard = ({ sch }) => {
    const subjectName =
      sch.classSubject?.subject?.name ||
      sch.classSubject?.subjectName ||
      sch.subjectName ||
      sch.subject ||
      "";
    return (
      <div
        className={`p-2 rounded-md border ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-200"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <div className="text-sm font-semibold truncate">{subjectName}</div>
        <div className="text-xs mt-1">
          Tiết {sch.startPeriod} {sch.room ? `· ${sch.room}` : ""}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const day = visibleDates[0];
    const key = day.toISOString().slice(0, 10);
    const list = schedulesByDate[key] || [];

    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatVNDate(day)}
        </div>
        {loading ? (
          <div className="text-center py-6">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Không có lịch trong ngày này
          </div>
        ) : (
          <div className="grid gap-3">
            {list.map((sch) => (
              <ScheduleCard key={sch.scheduleId || sch.date} sch={sch} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const WeekView = () => {
    const weekDates = visibleDates;
    const thuVN = [
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ];
    const todayKey = isoDateOnly(new Date()).toISOString().slice(0, 10);

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((d, idx) => {
          const key = d.toISOString().slice(0, 10);
          const list = schedulesByDate[key] || [];
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`p-2 border rounded min-h-[140px] flex flex-col ${
                darkMode
                  ? isToday
                    ? "bg-gray-700 border-yellow-400"
                    : "bg-gray-900 border-gray-700"
                  : isToday
                  ? "bg-yellow-100 border-yellow-400"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="mb-2 text-center">
                <div className="text-sm font-medium">{thuVN[idx]}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatVNDate(d)}
                </div>
              </div>
              {loading ? (
                <div className="text-xs text-center py-4">Đang tải...</div>
              ) : list.length === 0 ? (
                <div className="text-xs text-gray-500 text-center">
                  {/* Không có lịch */}
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[120px]">
                  {list.map((sch) => (
                    <ScheduleCard key={sch.scheduleId || sch.date} sch={sch} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const MonthView = () => {
    const monthDates = visibleDates;
    const thuVN = [
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ];
    const todayKey = isoDateOnly(new Date()).toISOString().slice(0, 10);

    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {thuVN.map((w) => (
            <div key={w} className="text-xs font-medium text-center">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {(() => {
            const first = monthDates[0];
            const weekdayOfFirst = first.getDay() === 0 ? 7 : first.getDay();
            const pad = weekdayOfFirst - 1;
            const cells = [];

            for (let i = 0; i < pad; i++) {
              cells.push(
                <div
                  key={`pad-${i}`}
                  className="min-h-[100px] border rounded p-2 bg-transparent"
                />
              );
            }

            monthDates.forEach((d) => {
              const key = d.toISOString().slice(0, 10);
              const list = schedulesByDate[key] || [];
              const isToday = key === todayKey;

              cells.push(
                <div
                  key={key}
                  className={`min-h-[100px] border rounded p-2 flex flex-col ${
                    darkMode
                      ? isToday
                        ? "bg-gray-700 border-yellow-400"
                        : "bg-gray-900 border-gray-700"
                      : isToday
                      ? "bg-green-100 border-green-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {formatVNDate(d)}
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px]">
                    {list.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center">
                        {/* Không có lịch */}
                      </div>
                    ) : (
                      list.map((sch) => (
                        <ScheduleCard
                          key={sch.scheduleId || sch.date}
                          sch={sch}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            });

            return cells;
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-transparent text-gray-900 dark:text-gray-100">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lịch giảng dạy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Xem lịch theo ngày, tuần hoặc tháng.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 border rounded overflow-hidden">
            <button
              onClick={goPrev}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ←
            </button>
            <button
              onClick={goToday}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Hôm nay
            </button>
            <button
              onClick={goNext}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-800"
            >
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
            </select>

            {viewMode === "week" && (
              <input
                type="week"
                onChange={handleWeekPicker}
                className="p-2 border rounded bg-white dark:bg-gray-800"
              />
            )}
            {viewMode === "day" && (
              <input
                type="date"
                value={currentDate.toISOString().slice(0, 10)}
                onChange={handleDayPicker}
                className="p-2 border rounded bg-white dark:bg-gray-800"
              />
            )}

            {/* <button
              onClick={fetchSchedules}
              className="px-3 py-2 text-green-600 bg-transparent hover:underline transition-all duration-200"
            >
              Cập nhật lịch
            </button> */}
          </div>
        </div>
      </header>

      <main>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <section className="mb-6">
          {viewMode === "day" && <DayView />}
          {viewMode === "week" && <WeekView />}
          {viewMode === "month" && <MonthView />}
        </section>
      </main>
    </div>
  );
}
