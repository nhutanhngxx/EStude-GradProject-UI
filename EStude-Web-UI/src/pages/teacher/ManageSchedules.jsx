import React, { useEffect, useState, useMemo, useContext } from "react";
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

  const [allClasses, setAllClasses] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [schoolTerms, setSchoolTerms] = useState([]);

  const [selectedTermName, setSelectedTermName] = useState(null);

  const [selectedClass, setSelectedClass] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
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

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [subjectStats, setSubjectStats] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!schoolId) return;
      setLoading(true);
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          classService.getClassesBySchoolId(schoolId),
          classSubjectService.getAllClassSubjects(),
        ]);

        setAllClasses(classesRes || []);
        setClassSubjects(subjectsRes || []);

        const termMap = new Map();
        (classesRes || []).forEach((cls) => {
          cls.terms?.forEach((term) => {
            if (!termMap.has(term.termId)) {
              termMap.set(term.termId, {
                termId: term.termId,
                termName: term.name,
                beginDate: term.beginDate,
                endDate: term.endDate,
              });
            }
          });
        });

        const uniqueTerms = Array.from(termMap.values()).sort(
          (a, b) => new Date(b.beginDate) - new Date(a.beginDate)
        );
        setSchoolTerms(uniqueTerms);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        showToast("Không thể tải dữ liệu!", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [schoolId]);

  const termNameOptions = useMemo(() => {
    const uniqueNames = new Set();
    const options = [];

    const sortedTerms = [...schoolTerms].sort(
      (a, b) => new Date(b.beginDate) - new Date(a.beginDate)
    );

    sortedTerms.forEach((term) => {
      if (!uniqueNames.has(term.termName)) {
        uniqueNames.add(term.termName);
        options.push({
          label: term.termName,
          termName: term.termName,
        });
      }
    });

    return options;
  }, [schoolTerms]);

  useEffect(() => {
    if (selectedTermName || termNameOptions.length === 0) return;

    const today = new Date("2025-12-11");
    const current = schoolTerms.find((t) => {
      const begin = new Date(t.beginDate);
      const end = new Date(t.endDate);
      return today >= begin && today <= end;
    });

    if (current) {
      setSelectedTermName(current.termName);
    } else if (termNameOptions.length > 0) {
      setSelectedTermName(termNameOptions[0].termName);
    }
  }, [termNameOptions, schoolTerms, selectedTermName]);

  const classesInSelectedTerm = useMemo(() => {
    if (!selectedTermName) return [];
    return allClasses.filter((cls) =>
      cls.terms?.some((t) => t.name === selectedTermName)
    );
  }, [allClasses, selectedTermName]);

  useEffect(() => {
    if (!selectedClass) {
      setTerms([]);
      setFilteredSubjects([]);
      setSchedules([]);
      setSubjectStats([]);
      setFilteredSchedules([]);
      setSelectedTerm("");
      setFromDate("");
      setToDate("");
      setSelectedType("");
      setSelectedStatus("");
      setCurrentPage(1);
      return;
    }

    const fetchClassData = async () => {
      setLoading(true);
      try {
        const [schedulesRes, classDetail] = await Promise.all([
          scheduleService.getSchedulesByClass(selectedClass),
          classService.getClassById(selectedClass),
        ]);

        setSchedules(schedulesRes || []);
        if (classDetail.terms) {
          const sortedTerms = classDetail.terms.sort(
            (a, b) => new Date(a.beginDate) - new Date(b.beginDate)
          );
          setTerms(sortedTerms);

          const matchingTerm = sortedTerms.find(
            (t) => t.name === selectedTermName
          );
          if (matchingTerm) {
            setSelectedTerm(matchingTerm.termId);
          }
        }
      } catch (err) {
        showToast("Lỗi tải dữ liệu lớp!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [selectedClass, selectedTermName]);

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

    filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredSchedules(filtered);
    setCurrentPage(1);
  }, [schedules, fromDate, toDate, selectedType, selectedStatus]);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setFilteredSubjects([]);
      return;
    }

    const list = classSubjects.filter(
      (cs) =>
        cs.classId === parseInt(selectedClass) &&
        cs.term.termId === parseInt(selectedTerm)
    );
    setFilteredSubjects(list);
  }, [selectedClass, selectedTerm, classSubjects]);

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
      const selectedClassObj = allClasses.find(
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
    if (!newSchedule.date) errs.date = "Ngày học là bắt buộc";
    if (!newSchedule.startPeriod) errs.startPeriod = "Tiết bắt đầu là bắt buộc";
    if (!newSchedule.endPeriod) errs.endPeriod = "Tiết kết thúc là bắt buộc";
    if (parseInt(newSchedule.startPeriod) > parseInt(newSchedule.endPeriod)) {
      errs.endPeriod = "Tiết kết thúc phải lớn hơn tiết bắt đầu";
    }
    if (!newSchedule.classSubjectId)
      errs.classSubjectId = "Môn học là bắt buộc";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      week: newSchedule.week,
      details: newSchedule.details?.trim() || "",
      date: newSchedule.date,
      startPeriod: parseInt(newSchedule.startPeriod),
      endPeriod: parseInt(newSchedule.endPeriod),
      room: newSchedule.room?.trim() || "",
      status: newSchedule.status || "SCHEDULED",
      type: newSchedule.type || "REGULAR",
      term: { termId: parseInt(newSchedule.termId) },
      classSubject: { classSubjectId: parseInt(newSchedule.classSubjectId) },
    };

    try {
      setLoading(true);
      let res;
      if (isEditing) {
        res = await scheduleService.updateSchedule(editingScheduleId, payload);
        showToast("Cập nhật lịch thành công!", "success");
      } else {
        res = await scheduleService.createSchedule(payload);
        showToast("Tạo lịch thành công!", "success");
      }

      const schedulesRes = await scheduleService.getSchedulesByClass(
        selectedClass
      );
      setSchedules(schedulesRes || []);
      setShowModal(false);
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
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu lịch!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setIsEditing(true);
    setEditingScheduleId(schedule.scheduleId);
    setSelectedTerm(schedule.term?.termId || "");
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
      teacherId: schedule.classSubject?.teacher?.userId || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Bạn có chắc muốn xóa lịch học này?")) return;

    try {
      await scheduleService.deleteSchedule(scheduleId);
      showToast("Xóa lịch thành công", "success");
      const schedulesRes = await scheduleService.getSchedulesByClass(
        selectedClass
      );
      setSchedules(schedulesRes || []);
    } catch (err) {
      console.error("Lỗi khi xóa lịch:", err);
      showToast("Lỗi hệ thống khi xóa lịch", "error");
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = parseCSV(text);
      const selectedClassObj = allClasses.find(
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
    showToast("Đã xóa bộ lọc", "success");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toISOString().split("T")[0];
  };

  const formatDateVN = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
    <div className="bg-bg-transparent dark:bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Quản lý lịch học (Giáo vụ)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý lịch học là công cụ giúp giáo viên tổ chức và quản lý lớp:
            điểm danh, giao bài, đánh giá học sinh.
          </p>
        </div>
        <div className="flex gap-4">
          {/* <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            <UploadCloud size={16} /> Import lịch
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label> */}
          <button
            onClick={() => {
              setShowModal(true);
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusCircle size={16} /> Thêm lịch thủ công
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-5">
        {/* DIV 1: chọn học kỳ + chọn lớp */}
        <div className="w-full md:w-1/3 space-y-6">
          <div>
            <label className="block font-medium mb-2 text-gray-700 dark:text-gray-200">
              Chọn học kỳ
            </label>
            <select
              value={selectedTermName ?? ""}
              onChange={(e) => setSelectedTermName(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
                  border-gray-300 dark:border-gray-600 
                  text-gray-900 dark:text-gray-100 
                  focus:outline-none focus:ring-2 
                  focus:ring-blue-200 dark:focus:ring-blue-400"
            >
              <option value="">Chọn học kỳ</option>
              {termNameOptions.map((option) => (
                <option key={option.termName} value={option.termName}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTermName && (
            <div>
              <label className="block font-medium mb-2 text-gray-700 dark:text-gray-200">
                Chọn lớp học trong {selectedTermName}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
                    border-gray-300 dark:border-gray-600 
                    text-gray-900 dark:text-gray-100 
                    focus:outline-none focus:ring-2 
                    focus:ring-blue-200 dark:focus:ring-blue-400"
              >
                <option value="">Chọn lớp học</option>
                {classesInSelectedTerm.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* DIV 2: thống kê */}
        {/* <div className="">
          {selectedClass && subjectStats.length > 0 && (
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow 
                      border border-gray-200 dark:border-gray-600"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BarChart2 size={20} /> Thống kê số tiết học
              </h3>

              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2">Môn học</th>
                    <th className="text-right pb-2">Số tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectStats.map((stat, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2">{stat.subject}</td>
                      <td className="py-2 text-right">{stat.totalPeriods}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}
      </div>

      {selectedClass && (
        <div className="mb-5">
          <div className="bg-transparent dark:bg-gray-800 mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Filter size={20} /> Bộ lọc lịch học
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Từ ngày"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Đến ngày"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
              >
                <option value="">Loại lịch</option>
                <option value="REGULAR">Thường</option>
                <option value="EXAM">Thi</option>
                <option value="MAKEUP">Bù</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
              >
                <option value="">Trạng thái</option>
                <option value="SCHEDULED">Đã lên</option>
                <option value="CANCELLED">Hủy</option>
                <option value="COMPLETED">Hoàn tất</option>
                <option value="SUSPENDED">Tạm ngưng</option>
              </select>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex justify-content-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 size={18} />
              Xóa bộ lọc
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Calendar size={20} /> Danh sách lịch học
            </h3>
            {currentSchedules.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Không có lịch học nào phù hợp với bộ lọc hiện tại.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <th className="p-3 text-left font-semibold">Môn học</th>
                        <th className="p-3 text-left font-semibold">Ngày</th>
                        <th className="p-3 text-left font-semibold">Tiết</th>
                        <th className="p-3 text-left font-semibold">Phòng</th>
                        <th className="p-3 text-left font-semibold">Loại</th>
                        <th className="p-3 text-left font-semibold">
                          Trạng thái
                        </th>
                        <th className="p-3 text-left font-semibold">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSchedules.map((s) => (
                        <tr
                          key={s.scheduleId}
                          className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="p-3">
                            {s.classSubject?.subjectName || "Không xác định"}
                          </td>
                          <td className="p-3">{formatDateVN(s.date)}</td>
                          <td className="p-3">
                            {s.startPeriod} - {s.endPeriod}
                          </td>
                          <td className="p-3">{s.room || "-"}</td>
                          <td className="p-3">{translateType(s.type)}</td>
                          <td className="p-3">{translateStatus(s.status)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(s)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(s.scheduleId)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {isEditing ? "Chỉnh sửa lịch học" : "Thêm lịch học thủ công"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
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
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input type="hidden" name="week" value={newSchedule.week} />
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
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
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
                    <option key={s.classSubjectId} value={s.classSubjectId}>
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-2 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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
        </div>
      )}
    </div>
  );
};

export default ManageSchedules;
