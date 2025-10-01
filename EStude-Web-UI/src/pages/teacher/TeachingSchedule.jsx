import React, { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../../contexts/ThemeContext";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import vi from "date-fns/locale/vi";
import "react-big-calendar/lib/css/react-big-calendar.css";
import classService from "../../services/classService";
import adminService from "../../services/adminService";
import subjectService from "../../services/subjectService";

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
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const [view, setView] = useState("class");
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(2025, 8, 29),
    end: new Date(2025, 9, 5),
  });
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([
    {
      id: "1",
      classId: "class1",
      teacherId: "teacher1",
      title: "Giảng dạy Toán lớp 10A1",
      subjectId: "math",
      subject: "Toán",
      className: "10A1",
      teacherName: "Nguyễn Văn A",
      room: "A101",
      notes: "Ôn tập chương 1",
      start: new Date(2025, 8, 30, 8, 0),
      end: new Date(2025, 8, 30, 9, 30),
    },
    {
      id: "2",
      classId: "class2",
      teacherId: "teacher2",
      title: "Giảng dạy Vật lý lớp 12A1",
      subjectId: "physics",
      subject: "Vật lý",
      className: "12A1",
      teacherName: "Trần Thị B",
      room: "B204",
      notes: "Thí nghiệm quang học",
      start: new Date(2025, 8, 31, 13, 0),
      end: new Date(2025, 8, 31, 14, 30),
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    classId: selectedClass || "",
    teacherId: "",
    subjectId: "",
    room: "",
    notes: "",
    start: null,
    end: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [useTimePicker, setUseTimePicker] = useState(false);
  const [errorLoadingTeachers, setErrorLoadingTeachers] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const classesRes = await classService.getAllClasses();
        setClasses(classesRes || []);
        const usersRes = await adminService.getAllUsers();
        const teachersRes = usersRes.filter((u) => u.role === "TEACHER");
        if (teachersRes.length === 0) {
          setErrorLoadingTeachers("Không tìm thấy giáo viên nào.");
        } else {
          setTeachers(teachersRes);
        }
        const subjectsRes = await subjectService.getAllSubjects();
        setSubjects(subjectsRes || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setErrorLoadingTeachers("Lỗi khi tải danh sách giáo viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setNewEvent((prev) => ({
        ...prev,
        classId: selectedClass,
        className: classes.find((c) => c.classId === selectedClass)?.name || "",
      }));
    }
  }, [selectedClass, classes]);

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent((prev) => ({ ...prev, start, end }));
    setUseTimePicker(false);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "startDateTime" && value) {
      setNewEvent((prev) => ({ ...prev, start: new Date(value) }));
    }
    if (name === "endDateTime" && value) {
      setNewEvent((prev) => ({ ...prev, end: new Date(value) }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newEvent.classId) newErrors.classId = "Lớp học là bắt buộc";
    if (!newEvent.teacherId) newErrors.teacherId = "Giáo viên là bắt buộc";
    if (!newEvent.subjectId) newErrors.subjectId = "Môn học là bắt buộc";
    if (!newEvent.start || !newEvent.end)
      newErrors.date = "Thời gian là bắt buộc";
    if (newEvent.start && newEvent.end && newEvent.start >= newEvent.end) {
      newErrors.date = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }
    const conflict = events.find(
      (event) =>
        (event.teacherId === newEvent.teacherId ||
          event.classId === newEvent.classId ||
          event.room === newEvent.room) &&
        event.start < newEvent.end &&
        event.end > newEvent.start
    );
    if (conflict) {
      newErrors.conflict =
        "Lịch bị trùng với một buổi học khác (giáo viên, lớp, hoặc phòng).";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const selectedSubject = subjects.find(
      (s) => s.subjectId === newEvent.subjectId
    );
    const newEventData = {
      ...newEvent,
      id: `event-${events.length + 1}`,
      title: `Giảng dạy ${selectedSubject?.name || newEvent.subjectId} lớp ${
        newEvent.className
      }`,
      subject: selectedSubject?.name || newEvent.subjectId,
      className:
        classes.find((c) => c.classId === newEvent.classId)?.name || "",
      teacherName:
        teachers.find((t) => t.userId === newEvent.teacherId)?.fullName || "",
    };
    setEvents((prev) => [...prev, newEventData]);
    setShowModal(false);
    setNewEvent({
      classId: selectedClass || "",
      teacherId: "",
      subjectId: "",
      room: "",
      notes: "",
      start: null,
      end: null,
    });
    setErrors({});
    setUseTimePicker(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewEvent({
      classId: selectedClass || "",
      teacherId: "",
      subjectId: "",
      room: "",
      notes: "",
      start: null,
      end: null,
    });
    setErrors({});
    setUseTimePicker(false);
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const filteredEvents = () => {
    if (view === "class" && selectedClass) {
      return events.filter((e) => e.classId === selectedClass);
    }
    if (view === "teacher" && selectedTeacher) {
      return events.filter((e) => e.teacherId === selectedTeacher);
    }
    return view === "class" ? [] : events;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Toolbar */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t("teachingSchedule.title") || "Lịch giảng dạy"}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={view}
              onChange={(e) => {
                setView(e.target.value);
                setSelectedClass(null);
                setSelectedTeacher(null);
              }}
              className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="class">Theo lớp</option>
              <option value="teacher">Theo giáo viên</option>
            </select>
            {view === "class" ? (
              <select
                value={selectedClass || ""}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn lớp</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedTeacher || ""}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn giáo viên</option>
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <input
                type="date"
                value={format(dateRange.start, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    start: new Date(e.target.value),
                  })
                }
                className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={format(dateRange.end, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: new Date(e.target.value) })
                }
                className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message for Teacher Loading */}
      {errorLoadingTeachers && (
        <p className="text-red-500 text-sm mb-4">{errorLoadingTeachers}</p>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedClass
              ? `Lịch lớp ${
                  classes.find((c) => c.classId === selectedClass)?.name || ""
                }`
              : selectedTeacher
              ? `Lịch giảng dạy của ${
                  teachers.find((t) => t.userId === selectedTeacher)
                    ?.fullName || ""
                }`
              : view === "class"
              ? "Vui lòng chọn lớp"
              : "Tất cả lịch"}
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={view === "class" && !selectedClass}
          >
            Thêm buổi học
          </button>
        </div>
        {loading ? (
          <div className="animate-pulse h-[70vh] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ) : (
          <Calendar
            localizer={localizer}
            events={filteredEvents()}
            startAccessor="start"
            endAccessor="end"
            className="text-gray-900 dark:text-gray-100"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) =>
              alert(
                `Chi tiết: ${event.title}\nMôn: ${event.subject}\nLớp: ${
                  event.className
                }\nGiáo viên: ${event.teacherName}\nPhòng: ${
                  event.room
                }\nGhi chú: ${event.notes || "Không có"}`
              )
            }
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
            }}
            defaultView="week"
            min={new Date(2025, 0, 1, 7, 0)}
            max={new Date(2025, 0, 1, 18, 0)}
            formats={{
              eventTimeRangeFormat: ({ start, end }) =>
                `${format(start, "HH:mm", { locale: vi })} - ${format(
                  end,
                  "HH:mm",
                  { locale: vi }
                )}`,
            }}
            style={{ height: "70vh" }}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-11/12 sm:w-3/4 md:w-2/3 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Thêm buổi học mới</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lớp học <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="classId"
                      value={newEvent.classId}
                      onChange={handleInputChange}
                      disabled={!!selectedClass}
                      className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    >
                      <option value="">Chọn lớp</option>
                      {classes.map((c) => (
                        <option key={c.classId} value={c.classId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.classId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.classId}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subjectId"
                      value={newEvent.subjectId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn môn học</option>
                      {subjects.map((s) => (
                        <option key={s.subjectId} value={s.subjectId}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.subjectId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.subjectId}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    {useTimePicker ? (
                      <input
                        type="datetime-local"
                        name="startDateTime"
                        value={
                          newEvent.start
                            ? format(newEvent.start, "yyyy-MM-dd'T'HH:mm")
                            : ""
                        }
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formatDateTime(newEvent.start)}
                        readOnly
                        className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 text-gray-900 dark:text-gray-100"
                      />
                    )}
                    {errors.date && (
                      <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thời gian kết thúc <span className="text-red-500">*</span>
                    </label>
                    {useTimePicker ? (
                      <input
                        type="datetime-local"
                        name="endDateTime"
                        value={
                          newEvent.end
                            ? format(newEvent.end, "yyyy-MM-dd'T'HH:mm")
                            : ""
                        }
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formatDateTime(newEvent.end)}
                        readOnly
                        className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  </div>
                </div>
                {/* Right Column */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Giáo viên <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="teacherId"
                      value={newEvent.teacherId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn giáo viên</option>
                      {teachers.map((t) => (
                        <option key={t.userId} value={t.userId}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                    {errors.teacherId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.teacherId}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phòng học
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={newEvent.room}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Phòng A101"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      name="notes"
                      value={newEvent.notes}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Ôn tập chương 1"
                      rows="8"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setUseTimePicker(!useTimePicker)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {useTimePicker
                    ? "Dùng kéo trên lịch"
                    : "Chọn thời gian thủ công"}
                </button>
              </div>
              {errors.conflict && (
                <p className="text-red-500 text-xs mb-4">{errors.conflict}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingSchedule;
