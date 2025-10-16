import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import classService from "../../services/classService";
import scheduleService from "../../services/scheduleService";
import classSubjectService from "../../services/classSubjectService";
import {
  Upload,
  Plus,
  Calendar,
  FileText,
  BarChart2,
  Filter,
  X,
  Edit,
  Trash2,
  PlusCircle,
  UploadCloud,
  XCircle,
  Save,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";

const translateStatus = (status) => {
  switch (status) {
    case "SCHEDULED":
      return "Đã lên lịch";
    case "CANCELLED":
      return "Đã hủy";
    case "COMPLETED":
      return "Đã hoàn tất";
    case "SUSPENDED":
      return "Tạm ngưng";
    default:
      return status;
  }
};

const translateType = (type) => {
  switch (type) {
    case "REGULAR":
      return "Lịch học thường xuyên";
    case "EXAM":
      return "Lịch thi";
    case "MAKEUP":
      return "Lịch học bù";
    case "SUSPENDED":
      return "Lịch học tạm ngưng";
    default:
      return type;
  }
};

const ManageSchedules = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    week: 1,
    details: "",
    date: "",
    startPeriod: "",
    endPeriod: "",
    room: "",
    status: "SCHEDULED",
    type: "REGULAR",
    termId: "",
    classSubjectId: "",
    teacherId: "",
  });
  const [errors, setErrors] = useState({});
  const [subjectStats, setSubjectStats] = useState([]);

  // Bộ lọc
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDateVN = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toISOString().split("T")[0];
  };

  const calculateWeek = (date, classObj) => {
    if (!date || !classObj?.terms?.length) return 1;
    const d = new Date(date);
    const terms = [...classObj.terms].sort(
      (a, b) => new Date(a.beginDate) - new Date(b.beginDate)
    );

    let totalWeeks = 0;
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const begin = new Date(term.beginDate);
      const end = new Date(term.endDate);

      if (d >= begin && d <= end) {
        const diffDays = Math.floor((d - begin) / (1000 * 60 * 60 * 24));
        const weekInThisTerm = Math.floor(diffDays / 7) + 1;
        return totalWeeks + weekInThisTerm;
      } else {
        const diffDays = Math.floor((end - begin) / (1000 * 60 * 60 * 24));
        const termWeeks = Math.floor(diffDays / 7) + 1;
        totalWeeks += termWeeks;
      }
    }
    return totalWeeks + 1;
  };

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true);
        const classesRes = await classService.getAllClasses();
        setClasses(classesRes || []);
        const csRes = await classSubjectService.getAllClassSubjects();
        setClassSubjects(csRes || []);
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
        showToast("Không thể tải dữ liệu!", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setTerms([]);
      setSelectedTerm("");
      setFilteredSubjects([]);
      setSchedules([]);
      setSubjectStats([]);
      setFilteredSchedules([]);
      setFromDate("");
      setToDate("");
      setSelectedType("");
      setSelectedStatus("");
      setCurrentPage(1);
      return;
    }

    const fetchClassDetails = async () => {
      try {
        const classDetail = await classService.getClassById(selectedClass);
        setTerms(classDetail.terms || []);
      } catch (err) {
        console.error("Lỗi khi load chi tiết lớp:", err);
        showToast("Không thể tải học kỳ của lớp!", "error");
      }
    };

    const fetchSchedules = async () => {
      try {
        const schedulesRes = await scheduleService.getSchedulesByClass(
          selectedClass
        );
        setSchedules(schedulesRes || []);
      } catch (err) {
        console.error("Lỗi khi tải lịch học:", err);
        showToast("Không thể tải lịch học cho lớp!", "error");
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchClassDetails(), fetchSchedules()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setFilteredSubjects([]);
      return;
    }

    const list = classSubjects.filter(
      (cs) =>
        parseInt(cs.classId) === parseInt(selectedClass) &&
        parseInt(cs.term.termId) === parseInt(selectedTerm)
    );
    setFilteredSubjects(list);
  }, [selectedClass, selectedTerm, classSubjects]);

  useEffect(() => {
    if (schedules.length === 0) {
      setSubjectStats([]);
      return;
    }

    const statsMap = {};
    schedules
      .filter((s) => s.type !== "EXAM" && s.classSubject?.subjectName)
      .forEach((s) => {
        const subjectName = s.classSubject.subjectName || "Không xác định";
        const periods = s.endPeriod - s.startPeriod + 1;
        if (!statsMap[subjectName]) {
          statsMap[subjectName] = 0;
        }
        statsMap[subjectName] += periods;
      });

    const statsArray = Object.entries(statsMap).map(
      ([subject, totalPeriods]) => ({
        subject,
        totalPeriods,
      })
    );
    setSubjectStats(statsArray);
  }, [schedules]);

  useEffect(() => {
    let filtered = schedules;

    // Lọc theo các điều kiện
    if (fromDate) {
      filtered = filtered.filter((s) => new Date(s.date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter((s) => new Date(s.date) <= new Date(toDate));
    }
    if (selectedType) {
      filtered = filtered.filter((s) => s.type === selectedType);
    }
    if (selectedStatus) {
      filtered = filtered.filter((s) => s.status === selectedStatus);
    }

    // Sắp xếp theo ngày học (date) tăng dần
    filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredSchedules(filtered);
    setCurrentPage(1);
  }, [schedules, fromDate, toDate, selectedType, selectedStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "classSubjectId") {
      const subject = filteredSubjects.find(
        (s) => s.classSubjectId === parseInt(value)
      );
      if (subject) {
        setNewSchedule((prev) => ({
          ...prev,
          classSubjectId: value,
          teacherId: subject.teacher ? subject.teacher.userId : "",
          termId: subject.term ? subject.term.termId : "",
        }));
      }
    } else if (name === "date") {
      const selectedClassObj = classes.find(
        (c) => c.classId === parseInt(selectedClass)
      );
      let weekValue = newSchedule.week;
      if (selectedClassObj) {
        weekValue = calculateWeek(value, selectedClassObj);
      }
      setNewSchedule((prev) => ({
        ...prev,
        date: value,
        week: weekValue,
      }));
    } else {
      setNewSchedule((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!newSchedule.date) {
      errs.date = "Ngày học là bắt buộc";
    }
    if (!newSchedule.startPeriod) {
      errs.startPeriod = "Tiết bắt đầu là bắt buộc";
    }
    if (!newSchedule.endPeriod) {
      errs.endPeriod = "Tiết kết thúc là bắt buộc";
    }
    if (parseInt(newSchedule.startPeriod) > parseInt(newSchedule.endPeriod)) {
      errs.endPeriod = "Tiết kết thúc phải lớn hơn tiết bắt đầu";
    }
    if (!newSchedule.classSubjectId) {
      errs.classSubjectId = "Môn học là bắt buộc";
    }
    if (Object.keys(errs).length > 0) {
      Object.values(errs).forEach((msg) => showToast(msg, "error"));
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dữ liệu trước khi gửi
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      week: newSchedule.week ? parseInt(newSchedule.week) : null,
      details: newSchedule.details?.trim() || "",
      date: newSchedule.date ? new Date(newSchedule.date).toISOString() : null,
      startPeriod: newSchedule.startPeriod
        ? parseInt(newSchedule.startPeriod)
        : null,
      endPeriod: newSchedule.endPeriod ? parseInt(newSchedule.endPeriod) : null,
      room: newSchedule.room?.trim() || "",
      status: newSchedule.status || "SCHEDULED",
      type: newSchedule.type || "REGULAR",
      term: newSchedule.termId
        ? { termId: parseInt(newSchedule.termId) }
        : null,
      classSubject: newSchedule.classSubjectId
        ? { classSubjectId: parseInt(newSchedule.classSubjectId) }
        : null,
    };

    try {
      setLoading(true);
      let res = null;

      if (isEditing) {
        res = await scheduleService.updateSchedule(editingScheduleId, payload);
        if (res && (res.success || res.scheduleId)) {
          showToast("Cập nhật lịch thành công", "success");
        } else {
          showToast("Cập nhật lịch thất bại", "error");
          return;
        }
      } else {
        res = await scheduleService.createSchedule(payload);
        if (res && res.scheduleId) {
          showToast("Tạo lịch thành công", "success");
        } else {
          showToast("Tạo lịch thất bại", "error");
          return;
        }
      }

      // Refresh danh sách
      const schedulesRes = await scheduleService.getSchedulesByClass(
        selectedClass
      );
      setSchedules(schedulesRes || []);

      // Reset form
      setNewSchedule({
        week: 1,
        details: "",
        date: "",
        startPeriod: "",
        endPeriod: "",
        room: "",
        status: "SCHEDULED",
        type: "REGULAR",
        termId: "",
        classSubjectId: "",
        teacherId: "",
      });
      setShowManualForm(false);
      setIsEditing(false);
      setEditingScheduleId(null);
    } catch (err) {
      console.error(`Lỗi khi ${isEditing ? "cập nhật" : "tạo"} lịch:`, err);
      showToast(
        `Lỗi hệ thống khi ${isEditing ? "cập nhật" : "tạo"} lịch`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setIsEditing(true);
    setSelectedTerm(schedule.term?.termId || "");
    setEditingScheduleId(schedule.scheduleId);
    setNewSchedule({
      week: schedule.week,
      details: schedule.details || "",
      date: formatDateForInput(schedule.date),
      startPeriod: schedule.startPeriod,
      endPeriod: schedule.endPeriod,
      room: schedule.room || "",
      status: schedule.status,
      type: schedule.type,
      termId: schedule.term?.termId || "",
      classSubjectId: schedule.classSubject?.classSubjectId || "",
      teacherId: schedule.classSubject?.teacherId || "",
    });
    setShowManualForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Bạn có chắc muốn xóa lịch học này?")) return;

    try {
      setLoading(true);
      await scheduleService.deleteSchedule(scheduleId);
      showToast("Xóa lịch thành công", "success");
      const schedulesRes = await scheduleService.getSchedulesByClass(
        selectedClass
      );
      setSchedules(schedulesRes || []);
    } catch (err) {
      console.error("Lỗi khi xóa lịch:", err);
      showToast("Lỗi hệ thống khi xóa lịch", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = parseCSV(text);
      const selectedClassObj = classes.find(
        (c) => c.classId === parseInt(selectedClass)
      );

      try {
        setLoading(true);
        for (const row of rows) {
          const classSubject = filteredSubjects.find(
            (s) => s.classSubjectId === parseInt(row.classSubjectId)
          );
          if (!classSubject) {
            showToast(
              `Môn học ID ${row.classSubjectId} không tồn tại`,
              "error"
            );
            continue;
          }

          const week = calculateWeek(row.date, selectedClassObj);
          const payload = {
            week: week,
            details: row.details || "",
            date: row.date,
            startPeriod: parseInt(row.startPeriod),
            endPeriod: parseInt(row.endPeriod),
            room: row.room || "",
            status: row.status || "SCHEDULED",
            type: row.type || "REGULAR",
            term: { termId: classSubject.term.termId },
            classSubject: { classSubjectId: parseInt(row.classSubjectId) },
          };

          await scheduleService.createSchedule(payload);
        }
        showToast("Import lịch thành công", "success");
        const schedulesRes = await scheduleService.getSchedulesByClass(
          selectedClass
        );
        setSchedules(schedulesRes || []);
      } catch (err) {
        console.error("Lỗi khi import lịch:", err);
        showToast("Lỗi khi import lịch", "error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(",");
    return lines
      .slice(1)
      .map((line) => {
        const values = line.split(",");
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {});
      })
      .filter((row) => Object.values(row).some((v) => v));
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedType("");
    setSelectedStatus("");
    setCurrentPage(1);
    showToast("Đã xóa tất cả bộ lọc", "success");
  };

  const totalItems = filteredSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 sm:p-6 bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Quản lý lịch học (Giáo vụ)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Quản lý lịch học cho các lớp học.
          </p>
        </div>
      </div>

      {/* Chọn lớp (luôn hiển thị) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chọn Lớp Học
        </label>
        {loading ? (
          <div className="w-full max-w-md h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        ) : (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
               rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* View 1: Chọn học kỳ, thống kê, và form thủ công */}
      {selectedClass && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {loading ? (
            <>
              {/* Placeholder cột trái */}
              <div className="space-y-6">
                <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, idx) => (
                      <div
                        key={idx}
                        className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                  <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                </div>
              </div>
              {/* Placeholder cột phải */}
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Cột trái: Chọn học kỳ, thống kê, nút hành động */}
              <div className="space-y-6">
                {/* Chọn Học Kỳ */}
                {terms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chọn Học Kỳ
                    </label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                         rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">-- Chọn học kỳ --</option>
                      {terms.map((t) => (
                        <option key={t.termId} value={t.termId}>
                          {t.name} (
                          {new Date(t.beginDate).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          -
                          {new Date(t.endDate).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Thống kê số tiết học */}
                {subjectStats.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-green-500" />
                      Thống kê số tiết học theo môn (Cả năm)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-900 dark:text-gray-100">
                        <thead className="text-xs uppercase bg-green-50 dark:bg-green-900/20">
                          <tr>
                            <th className="px-4 py-3">Môn học</th>
                            <th className="px-4 py-3">Tổng số tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectStats.map((stat, idx) => (
                            <tr
                              key={idx}
                              className="border-b dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/10"
                            >
                              <td className="px-4 py-2">{stat.subject}</td>
                              <td className="px-4 py-2">{stat.totalPeriods}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex flex-wrap gap-4">
                  <label
                    htmlFor="import-file"
                    className="text-sm flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer transition"
                  >
                    <UploadCloud className="w-5 h-5" />
                    Import Lịch Học Từ File
                    <input
                      id="import-file"
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setShowManualForm(!showManualForm);
                      if (showManualForm) {
                        setIsEditing(false);
                        setEditingScheduleId(null);
                        setNewSchedule({
                          week: 1,
                          details: "",
                          date: "",
                          startPeriod: "",
                          endPeriod: "",
                          room: "",
                          status: "SCHEDULED",
                          type: "REGULAR",
                          termId: "",
                          classSubjectId: "",
                          teacherId: "",
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                  >
                    {showManualForm ? (
                      <XCircle size={16} />
                    ) : (
                      <PlusCircle size={16} />
                    )}
                    {showManualForm
                      ? "Ẩn Form"
                      : isEditing
                      ? "Chỉnh Sửa Lịch"
                      : "Thêm Lịch Thủ Công (Học Bù/Thi)"}
                  </button>
                </div>
              </div>

              {/* Cột phải: Form thủ công */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  {isEditing ? "Chỉnh Sửa Lịch Học" : "Thêm Lịch Học Thủ Công"}
                </h2>
                {showManualForm ? (
                  <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      <input
                        type="hidden"
                        name="week"
                        value={newSchedule.week}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Trạng thái
                        </label>
                        <select
                          name="status"
                          value={newSchedule.status}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="SCHEDULED">Đã lên lịch</option>
                          <option value="CANCELLED">Lịch học bị hủy</option>
                          <option value="COMPLETED">Đã diễn ra</option>
                          <option value="SUSPENDED">Tạm ngưng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Loại lịch
                        </label>
                        <select
                          name="type"
                          value={newSchedule.type}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="REGULAR">Lịch học thường xuyên</option>
                          <option value="EXAM">Lịch thi</option>
                          <option value="MAKEUP">Lịch học bù</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ngày học (Tuần {newSchedule.week})
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={newSchedule.date}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {errors.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.date}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Môn học
                        </label>
                        <select
                          name="classSubjectId"
                          value={newSchedule.classSubjectId}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">-- Chọn môn --</option>
                          {filteredSubjects.map((s) => (
                            <option
                              key={s.classSubjectId}
                              value={s.classSubjectId}
                            >
                              {s.subject.name} ({s.term.name})
                            </option>
                          ))}
                        </select>
                        {errors.classSubjectId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.classSubjectId}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Giáo viên
                        </label>
                        <input
                          type="text"
                          value={
                            filteredSubjects.find(
                              (s) =>
                                s.classSubjectId ===
                                parseInt(newSchedule.classSubjectId)
                            )?.teacher?.fullName || ""
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md p-2 cursor-not-allowed"
                          readOnly
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ghi chú buổi học
                        </label>
                        <input
                          type="text"
                          name="details"
                          value={newSchedule.details}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="VD: Buổi học Văn cơ bản"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tiết bắt đầu
                        </label>
                        <input
                          type="number"
                          name="startPeriod"
                          value={newSchedule.startPeriod}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {errors.startPeriod && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.startPeriod}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tiết kết thúc
                        </label>
                        <input
                          type="number"
                          name="endPeriod"
                          value={newSchedule.endPeriod}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {errors.endPeriod && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.endPeriod}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phòng học
                        </label>
                        <input
                          type="text"
                          name="room"
                          value={newSchedule.room}
                          onChange={handleChange}
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowManualForm(false);
                            setIsEditing(false);
                            setEditingScheduleId(null);
                            setNewSchedule({
                              week: 1,
                              details: "",
                              date: "",
                              startPeriod: "",
                              endPeriod: "",
                              room: "",
                              status: "SCHEDULED",
                              type: "REGULAR",
                              termId: "",
                              classSubjectId: "",
                              teacherId: "",
                            });
                          }}
                          className="text-sm px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="text-sm flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                        >
                          <Save size={16} />
                          {isEditing ? "Cập Nhật Lịch" : "Lưu Lịch"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900 text-center text-gray-500 dark:text-gray-400">
                    <p>Nhấn "Thêm Lịch Thủ Công" để tạo lịch mới</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* View 2: Bộ lọc và danh sách lịch */}
      {selectedClass && (
        <div>
          {loading ? (
            <>
              {/* Placeholder bộ lọc */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-green-100 dark:border-green-900">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="flex flex-wrap gap-4">
                  {[...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              {/* Placeholder danh sách lịch */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Bộ lọc */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-green-100 dark:border-green-900">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-green-500" />
                  Bộ Lọc Lịch Học
                </h2>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white 
                         dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white 
                         dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loại lịch
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white 
                         dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">-- Tất cả --</option>
                      <option value="REGULAR">Lịch học thường xuyên</option>
                      <option value="EXAM">Lịch thi</option>
                      <option value="MAKEUP">Lịch học bù</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white 
                         dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">-- Tất cả --</option>
                      <option value="SCHEDULED">Đã lên lịch</option>
                      <option value="CANCELLED">Đã hủy</option>
                      <option value="COMPLETED">Đã hoàn tất</option>
                      <option value="SUSPENDED">Tạm ngưng</option>
                    </select>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 px-2 py-2.5 border border-red-600 text-red-600 
                       rounded-md hover:bg-red-700 focus:outline-none hover:text-white
                       focus:ring-2 focus:ring-red-500 transition text-sm"
                  >
                    <XCircle className="w-5 h-5" />
                    Xóa hết
                  </button>
                </div>
              </div>

              {/* Danh sách lịch */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-green-100 dark:border-green-900">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Danh Sách Lịch Học Đã Tạo
                </h2>
                {currentSchedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-900 dark:text-gray-100">
                      <thead className="text-xs uppercase bg-green-50 dark:bg-green-900/20">
                        <tr>
                          <th className="px-4 py-3">Môn học</th>
                          <th className="px-4 py-3">Ngày học</th>
                          <th className="px-4 py-3">Tiết học</th>
                          <th className="px-4 py-3">Phòng</th>
                          <th className="px-4 py-3">Loại</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSchedules.map((s) => (
                          <tr
                            key={s.scheduleId}
                            className="border-b dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/10"
                          >
                            <td className="px-4 py-2">
                              {s.classSubject?.subjectName || "Không xác định"}
                            </td>
                            <td className="px-4 py-2">
                              {formatDateVN(s.date)}
                            </td>
                            <td className="px-4 py-2">
                              {s.startPeriod}-{s.endPeriod}
                            </td>
                            <td className="px-4 py-2">{s.room}</td>
                            <td className="px-4 py-3">
                              {translateType(s.type)}
                            </td>
                            <td className="px-4 py-3">
                              {translateStatus(s.status)}
                            </td>
                            <td className="px-4 py-2 flex gap-2">
                              <button
                                onClick={() => handleEdit(s)}
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.scheduleId)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Xóa"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Chưa có lịch học nào cho lớp này.
                  </p>
                )}
                {totalItems > 0 && (
                  <Pagination
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    siblingCount={1}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageSchedules;
