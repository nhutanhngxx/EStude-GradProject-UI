import React, { useState, useEffect, useContext, useMemo } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import scheduleService from "../../services/scheduleService";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Filter,
  AlertCircle,
} from "lucide-react";

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

const formatVNDateFull = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString("vi-VN", options);
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

// --- Schedule Card Component ---
const ScheduleCard = ({ sch, darkMode }) => {
  const subjectName =
    sch.classSubject?.subjectName || sch.subjectName || "Môn học";

  const className = sch.classSubject?.className || sch.className || "Lớp";

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        darkMode
          ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/40 hover:border-blue-600/60"
          : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3
            className={`text-sm font-semibold line-clamp-2 ${
              darkMode ? "text-blue-300" : "text-blue-900"
            }`}
          >
            {subjectName}
          </h3>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
            darkMode
              ? "bg-blue-700/40 text-blue-200"
              : "bg-blue-200 text-blue-800"
          }`}
        >
          {className}
        </div>
      </div>

      <div
        className={`space-y-1.5 text-xs ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Tiết {sch.startPeriod || "??"}</span>
        </div>
        {sch.room && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Phòng {sch.room}</span>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [selectedMonthDate, setSelectedMonthDate] = useState(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const teacherId = user?.userId;
      if (!teacherId) throw new Error("Không tìm thấy thông tin giáo viên");

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

  const goToday = () => {
    if (viewMode === "day") {
      setCurrentDate(new Date());
    } else if (viewMode === "week") {
      setCurrentDate(startOfWeekMonday(new Date()));
    } else {
      setCurrentDate(new Date());
    }
  };

  const handleWeekPicker = (e) => {
    const val = e.target.value;
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

  const handleMonthPicker = (e) => {
    if (!e.target.value) return;
    setCurrentDate(new Date(e.target.value));
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

  const getTotalSchedules = useMemo(() => {
    return visibleDates.reduce((sum, d) => {
      const key = d.toISOString().slice(0, 10);
      return sum + (schedulesByDate[key]?.length || 0);
    }, 0);
  }, [visibleDates, schedulesByDate]);

  // --- View Components ---
  const DayView = () => {
    const day = visibleDates[0];
    const key = day.toISOString().slice(0, 10);
    const list = schedulesByDate[key] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar
            className={`w-5 h-5 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <h2
            className={`text-lg font-semibold ${
              darkMode ? "text-gray-200" : "text-gray-900"
            }`}
          >
            {formatVNDateFull(day)}
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-20 rounded-lg animate-pulse ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center py-12 rounded-lg ${
              darkMode ? "bg-gray-800/50" : "bg-gray-100/50"
            }`}
          >
            <AlertCircle
              className={`w-12 h-12 mb-3 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <p
              className={`text-center ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Không có lịch dạy trong ngày này
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {list.map((sch) => (
              <ScheduleCard
                key={sch.scheduleId || sch.date}
                sch={sch}
                darkMode={darkMode}
              />
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
              className={`rounded-lg border overflow-hidden transition-all duration-200 flex flex-col min-h-[160px] ${
                darkMode
                  ? isToday
                    ? "bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-600/60 ring-1 ring-blue-500/50"
                    : "bg-gray-800/50 border-gray-700/50"
                  : isToday
                  ? "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 ring-1 ring-blue-300/50"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Header */}
              <div
                className={`px-3 py-2 border-b ${
                  darkMode
                    ? isToday
                      ? "border-blue-600/40 bg-blue-900/20"
                      : "border-gray-700/50 bg-gray-700/20"
                    : isToday
                    ? "border-blue-300 bg-blue-100/50"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    darkMode
                      ? isToday
                        ? "text-blue-300"
                        : "text-gray-300"
                      : isToday
                      ? "text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  {thuVN[idx]}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {formatVNDate(d)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-3 overflow-y-auto">
                {loading ? (
                  <div
                    className={`h-12 rounded animate-pulse ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  />
                ) : list.length === 0 ? (
                  <div
                    className={`text-xs text-center py-4 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Trống
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.map((sch) => (
                      <div
                        key={sch.scheduleId || sch.date}
                        className={`p-2 rounded text-xs ${
                          darkMode
                            ? "bg-blue-900/30 text-blue-200 border border-blue-700/40"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}
                      >
                        <div className="font-medium line-clamp-1">
                          {sch.classSubject?.subjectName ||
                            sch.subjectName ||
                            "Môn học"}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          Tiết {sch.startPeriod || "??"} ·{" "}
                          {sch.classSubject?.className ||
                            sch.className ||
                            "Lớp"}
                        </div>
                        {sch.room && (
                          <div className="text-xs opacity-75">
                            Phòng {sch.room}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // const MonthView = () => {
  //   const monthDates = visibleDates;
  //   const thuVN = [
  //     "Thứ Hai",
  //     "Thứ Ba",
  //     "Thứ Tư",
  //     "Thứ Năm",
  //     "Thứ Sáu",
  //     "Thứ Bảy",
  //     "Chủ Nhật",
  //   ];
  //   const todayKey = isoDateOnly(new Date()).toISOString().slice(0, 10);

  //   return (
  //     <div className="space-y-3">
  //       <div className="grid grid-cols-7 gap-2 mb-2">
  //         {thuVN.map((w) => (
  //           <div
  //             key={w}
  //             className={`text-xs font-semibold text-center py-2 ${
  //               darkMode ? "text-gray-400" : "text-gray-600"
  //             }`}
  //           >
  //             {w.substring(0, 3)}
  //           </div>
  //         ))}
  //       </div>
  //       <div className="grid grid-cols-7 gap-2">
  //         {(() => {
  //           const first = monthDates[0];
  //           const weekdayOfFirst = first.getDay() === 0 ? 7 : first.getDay();
  //           const pad = weekdayOfFirst - 1;
  //           const cells = [];

  //           // Padding cells
  //           for (let i = 0; i < pad; i++) {
  //             cells.push(
  //               <div
  //                 key={`pad-${i}`}
  //                 className={`min-h-[100px] border rounded-lg ${
  //                   darkMode
  //                     ? "bg-gray-800/30 border-gray-700/30"
  //                     : "bg-gray-50/50 border-gray-100"
  //                 }`}
  //               />
  //             );
  //           }

  //           // Date cells
  //           monthDates.forEach((d) => {
  //             const key = d.toISOString().slice(0, 10);
  //             const list = schedulesByDate[key] || [];
  //             const isToday = key === todayKey;

  //             cells.push(
  //               <div
  //                 key={key}
  //                 className={`min-h-[100px] rounded-lg border overflow-hidden transition-all duration-200 flex flex-col ${
  //                   darkMode
  //                     ? isToday
  //                       ? "bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-600/60 ring-1 ring-blue-500/50"
  //                       : "bg-gray-800/50 border-gray-700/50"
  //                     : isToday
  //                     ? "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 ring-1 ring-blue-300/50"
  //                     : "bg-white border-gray-200"
  //                 }`}
  //               >
  //                 {/* Date */}
  //                 <div
  //                   className={`px-2 py-1.5 text-sm font-semibold border-b ${
  //                     darkMode
  //                       ? isToday
  //                         ? "border-blue-600/40 text-blue-300"
  //                         : "border-gray-700/50 text-gray-400"
  //                       : isToday
  //                       ? "border-blue-300 text-blue-900"
  //                       : "border-gray-100 text-gray-700"
  //                   }`}
  //                 >
  //                   {d.getDate()}
  //                 </div>

  //                 {/* Schedule count badge */}
  //                 {list.length > 0 && (
  //                   <div
  //                     className={`px-2 py-1 text-xs font-medium ${
  //                       darkMode
  //                         ? "bg-blue-900/30 text-blue-300"
  //                         : "bg-blue-100 text-blue-700"
  //                     }`}
  //                   >
  //                     {list.length} lịch
  //                   </div>
  //                 )}

  //                 {/* Schedules preview */}
  //                 {list.length > 0 && (
  //                   <div className="flex-1 px-2 py-1 overflow-y-auto space-y-1">
  //                     {list.slice(0, 2).map((sch) => (
  //                       <div
  //                         key={sch.scheduleId || sch.date}
  //                         className={`text-xs ${
  //                           darkMode ? "text-gray-300" : "text-gray-700"
  //                         }`}
  //                       >
  //                         <div className="font-medium truncate">
  //                           {sch.classSubject?.subjectName ||
  //                             sch.subjectName ||
  //                             "Môn học"}
  //                         </div>
  //                         <div className="text-xs opacity-75 truncate">
  //                           {sch.classSubject?.className ||
  //                             sch.className ||
  //                             "Lớp"}
  //                           {sch.room && ` · ${sch.room}`}
  //                         </div>
  //                       </div>
  //                     ))}
  //                     {list.length > 2 && (
  //                       <div
  //                         className={`text-xs italic ${
  //                           darkMode ? "text-gray-500" : "text-gray-500"
  //                         }`}
  //                       >
  //                         +{list.length - 2} khác
  //                       </div>
  //                     )}
  //                   </div>
  //                 )}
  //               </div>
  //             );
  //           });

  //           return cells;
  //         })()}
  //       </div>
  //     </div>
  //   );
  // };

  // Get week/month display text

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
    const selectedKey = selectedMonthDate
      ? selectedMonthDate.toISOString().slice(0, 10)
      : null;
    const selectedList = selectedKey ? schedulesByDate[selectedKey] || [] : [];

    return (
      <div className="space-y-6">
        {/* Calendar Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {thuVN.map((w) => (
              <div
                key={w}
                className={`text-xs font-semibold text-center py-2 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {/* {w.substring(0, 3)} */}
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

              // Padding cells
              for (let i = 0; i < pad; i++) {
                cells.push(
                  <div
                    key={`pad-${i}`}
                    className={`min-h-[60px] border rounded-lg ${
                      darkMode
                        ? "bg-gray-800/30 border-gray-700/30"
                        : "bg-gray-50/50 border-gray-100"
                    }`}
                  />
                );
              }

              // Date cells
              monthDates.forEach((d) => {
                const key = d.toISOString().slice(0, 10);
                const list = schedulesByDate[key] || [];
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const hasSchedules = list.length > 0;

                cells.push(
                  <button
                    key={key}
                    onClick={() => setSelectedMonthDate(d)}
                    className={`min-h-[60px] rounded-lg border overflow-hidden transition-all duration-200 flex flex-col p-2 cursor-pointer hover:shadow-md ${
                      isSelected
                        ? darkMode
                          ? "bg-gradient-to-br from-blue-900/60 to-blue-800/40 border-blue-600 ring-2 ring-blue-500"
                          : "bg-gradient-to-br from-blue-200 to-blue-100 border-blue-500 ring-2 ring-blue-400"
                        : isToday
                        ? darkMode
                          ? "bg-gradient-to-br from-blue-900/30 to-blue-800/15 border-blue-600/40 ring-1 ring-blue-500/30"
                          : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300 ring-1 ring-blue-200/50"
                        : darkMode
                        ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {/* Date number */}
                    <div
                      className={`text-sm font-semibold ${
                        isSelected
                          ? darkMode
                            ? "text-blue-200"
                            : "text-blue-900"
                          : isToday
                          ? darkMode
                            ? "text-blue-300"
                            : "text-blue-700"
                          : darkMode
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {d.getDate()}
                    </div>

                    {/* Schedule count */}
                    {hasSchedules && (
                      <div
                        className={`text-xs font-medium mt-1 ${
                          isSelected
                            ? darkMode
                              ? "text-blue-100"
                              : "text-blue-800"
                            : darkMode
                            ? "text-blue-400"
                            : "text-blue-600"
                        }`}
                      >
                        {list.length} lịch
                      </div>
                    )}
                  </button>
                );
              });

              return cells;
            })()}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedMonthDate && (
          <div
            className={`rounded-lg border p-4 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="mb-4">
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                {formatVNDateFull(selectedMonthDate)}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {selectedList.length} lịch dạy
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-20 rounded-lg animate-pulse ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            ) : selectedList.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-8 rounded-lg ${
                  darkMode ? "bg-gray-700/30" : "bg-gray-100/50"
                }`}
              >
                <AlertCircle
                  className={`w-8 h-8 mb-2 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm text-center ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Không có lịch dạy trong ngày này
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedList.map((sch) => (
                  <ScheduleCard
                    key={sch.scheduleId || sch.date}
                    sch={sch}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getDisplayText = () => {
    if (viewMode === "day") {
      return formatVNDate(currentDate);
    } else if (viewMode === "week") {
      const weekDates = getWeekDates(currentDate);
      const firstDay = weekDates[0];
      const lastDay = weekDates[6];
      return `${formatVNDate(firstDay)} - ${formatVNDate(lastDay)}`;
    } else {
      return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
    }
  };

  const getWeekValue = () => {
    const date = currentDate;
    const jan4 = new Date(date.getFullYear(), 0, 4);
    const dayOfJan4 = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - (dayOfJan4 - 1));

    const diff =
      Math.floor((date - mondayWeek1) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const week = String(diff).padStart(2, "0");
    return `${date.getFullYear()}-W${week}`;
  };

  const getMonthValue = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  return (
    <div className="bg-bg-transparent dark:bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Lịch giảng dạy của bạn
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý và xem lịch dạy của bạn theo ngày, tuần hoặc tháng.
        </p>
      </div>

      {/* Controls */}
      <div
        className={`rounded-xl border mb-8 p-4 sm:p-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Row 1: Display text and navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2
                className={`text-lg font-semibold ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                {getDisplayText()}
              </h2>
              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-gray-500" : "text-gray-600"
                }`}
              >
                {getTotalSchedules} lịch dạy
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
                }`}
                title="Trước đó"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToday}
                className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 text-sm ${
                  darkMode
                    ? "bg-blue-600/20 border-blue-600/50 text-blue-300 hover:bg-blue-600/30"
                    : "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                }`}
              >
                Hôm nay
              </button>

              <button
                onClick={goNext}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
                }`}
                title="Tiếp theo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: View mode and date pickers */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter
              className={`w-4 h-4 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            />

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:border-gray-500"
                  : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
              }`}
            >
              <option value="day">Xem lịch Ngày</option>
              <option value="week">Xem lịch Tuần</option>
              <option value="month">Xem lịch Tháng</option>
            </select>

            {/* Date/Week picker */}
            {viewMode === "week" && (
              <input
                type="week"
                value={getWeekValue()}
                onChange={handleWeekPicker}
                className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            )}

            {viewMode === "month" && (
              <input
                type="month"
                value={getMonthValue()}
                onChange={handleMonthPicker}
                className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            )}

            {viewMode === "day" && (
              <input
                type="date"
                value={currentDate.toISOString().slice(0, 10)}
                onChange={handleDayPicker}
                className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
            darkMode
              ? "bg-red-900/20 border border-red-700/50 text-red-300"
              : "bg-red-100 border border-red-300 text-red-800"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Content */}
      <div
        className={`rounded-xl border p-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        {viewMode === "day" && <DayView />}
        {viewMode === "week" && <WeekView />}
        {viewMode === "month" && <MonthView />}
      </div>
    </div>
  );
}
