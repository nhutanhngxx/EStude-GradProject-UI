import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BookUser,
  Edit,
  Eye,
  PlusCircle,
  Save,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import StudentManagement from "./StudentManagement";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

// Component hiển thị badge cho môn học
const Badge = ({ text, color }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${color} dark:bg-blue-900/30 dark:text-blue-300`}
  >
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[90%] h-[90vh] flex flex-col border border-gray-200 dark:border-gray-600">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - chiếm toàn bộ chiều cao còn lại */}
        <div className="flex-1 overflow-hidden px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );

// Hàm định dạng học kỳ
const formatTerm = (termNumber, beginDate) => {
  if (!termNumber) return "";
  if (!beginDate) return `HK${termNumber}`;

  const d = new Date(beginDate);
  if (isNaN(d)) return `HK${termNumber}`;

  const month = d.getMonth();
  const academicStart = month >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  const academicEnd = academicStart + 1;

  return `HK${termNumber} ${academicStart} - ${academicEnd}`;
};

// Object ánh xạ khối lớp
const gradeMapping = {
  GRADE_6: "Khối 6",
  GRADE_7: "Khối 7",
  GRADE_8: "Khối 8",
  GRADE_9: "Khối 9",
  GRADE_10: "Khối 10",
  GRADE_11: "Khối 11",
  GRADE_12: "Khối 12",
};

// Component thanh công cụ tìm kiếm và lọc
const Toolbar = ({ filterStatus, setFilterStatus, keyword, setKeyword }) => (
  <div className="flex flex-wrap gap-4 items-center">
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Tìm kiếm lớp/môn..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="px-3 py-2 w-full sm:w-64 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
      >
        <option value="current">Đang diễn ra</option>
        <option value="upcoming">Sắp diễn ra</option>
        <option value="ended">Đã xong</option>
        <option value="all">Tất cả</option>
      </select>
    </div>
  </div>
);

// Component chính để quản lý lớp học
const ManageClasses = () => {
  const { showToast } = useToast();

  // State quản lý thông tin lớp học
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("GRADE_10");
  const [classSize, setClassSize] = useState(0);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState({});
  const [editTeacher, setEditTeacher] = useState(null);

  const [editableSemesters, setEditableSemesters] = useState([
    { termNumber: 1, beginDate: "", endDate: "" },
  ]);

  // State cho modal xác nhận xóa
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // State cho toolbar
  const [filterStatus, setFilterStatus] = useState("current"); // all | current | upcoming | ended
  const [keyword, setKeyword] = useState("");

  // Lấy schoolId từ user
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  // console.log("School ID của user: ", schoolId);

  // Load danh sách môn học
  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await subjectService.getAllSubjects();
      // console.log("Subjects: ", result);

      const filtered = result.filter(
        (s) =>
          Array.isArray(s.schools) &&
          s.schools.some((sch) => sch.schoolId === schoolId)
      );

      // console.log("Filtered Subjects: ", filtered);
      setSubjects(filtered);
    };

    if (schoolId) {
      fetchSubjects();
    }
  }, [schoolId]);

  // Load danh sách giáo viên
  useEffect(() => {
    const fetchTeachers = async () => {
      const result = await teacherService.getAllTeachers();
      const filtered = result.filter((t) => t.school?.schoolId === schoolId);
      setTeachers(filtered);
    };
    fetchTeachers();
  }, [schoolId]);

  // Hàm lấy danh sách lớp học kèm môn học
  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      const allClasses = await classService.getClassesBySchoolId(schoolId);
      console.log("all class: ", allClasses);

      const allClassSubjects = await classSubjectService.getAllClassSubjects();
      if (!allClasses || !allClassSubjects) return;

      const classesWithSubjects = allClasses.map((cls) => {
        const subjectsForClass = [
          ...new Map(
            allClassSubjects
              .filter((cs) =>
                cls.terms.some((t) => t.termId === cs.term?.termId)
              )
              .map((cs) => [
                cs.subject.subjectId,
                {
                  classSubjectId: cs.classSubjectId,
                  subjectId: cs.subject.subjectId,
                  name: cs.subject.name,
                  teacherId: cs.teacher?.userId ?? null,
                  teacherName: cs.teacher?.fullName,
                  termId: cs.term?.termId,
                  termName: cs.term?.name,
                },
              ])
          ).values(),
        ];

        return { ...cls, subjects: subjectsForClass };
      });

      setClasses(classesWithSubjects);
    } catch (err) {
      console.error("Lỗi khi load lớp và môn:", err);
      showToast("Lỗi khi tải dữ liệu lớp học!", "error");
    }
  }, [schoolId, showToast]);

  useEffect(() => {
    fetchClassesWithSubjects();
  }, [fetchClassesWithSubjects]);

  // Thêm học kỳ mới
  const addSemester = () => {
    setEditableSemesters((prev) => [
      ...prev,
      { termNumber: prev.length + 1, beginDate: "", endDate: "" },
    ]);
  };

  // Xóa học kỳ
  const removeSemester = (index) => {
    setEditableSemesters((prev) => prev.filter((_, i) => i !== index));
  };

  // Cập nhật thông tin học kỳ
  const updateSemester = (index, field, value) => {
    setEditableSemesters((prev) =>
      prev.map((sem, i) => (i === index ? { ...sem, [field]: value } : sem))
    );
  };

  // Định dạng ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

  // Mở modal
  const openModal = (type, cls = null) => {
    setSelectedClass(cls);
    setModalType(type);

    if (type === "add") {
      setName("");
      setClassSize(0);
      setSelectedSubjects([]);
      setSelectedTeacher("");
      setEditableSemesters([{ termNumber: 1, beginDate: "", endDate: "" }]);
    } else if (type === "edit" && cls) {
      setName(cls.name);
      setClassSize(cls.classSize || 0);
      setSelectedSubjects(
        cls.subjects?.map((s) => ({
          classSubjectId: s.classSubjectId,
          subjectId: s.subjectId,
          teacherId: s.teacherId ?? null,
          teacherName: s.teacherName || "",
        })) || []
      );
      setSelectedTeacher(cls.homeroomTeacher?.userId ?? "");
      setEditableSemesters(
        cls.terms?.map((t, idx) => ({
          termId: t.termId,
          termNumber: idx + 1,
          beginDate: formatDate(t.beginDate),
          endDate: formatDate(t.endDate),
        })) || [{ termNumber: 1, beginDate: "", endDate: "" }]
      );
    }
  };

  // Đóng modal
  const closeModal = () => {
    setSelectedClass(null);
    setModalType(null);
  };

  // Xử lý lưu lớp học
  const handleSave = async () => {
    if (!name) return showToast("Vui lòng nhập tên lớp!", "warn");

    try {
      // Payload lớp học
      const classPayload = {
        classId: selectedClass?.classId,
        name,
        gradeLevel,
        classSize,
        schoolId,
        terms: editableSemesters
          .filter((sem) => sem.beginDate && sem.endDate)
          .map((sem) => {
            const term = {
              name: formatTerm(sem.termNumber, sem.beginDate),
              beginDate: sem.beginDate,
              endDate: sem.endDate,
            };
            if (sem.termId) term.termId = sem.termId;
            return term;
          }),
      };

      // 1. Thêm hoặc cập nhật lớp học
      let classResult;
      if (modalType === "add") {
        classResult = await classService.addClass(classPayload);
      } else if (modalType === "edit") {
        classResult = await classService.updateClass(classPayload);
      }

      if (!classResult?.classId) {
        showToast("Lỗi khi lưu lớp!", "error");
        return;
      }

      // 2. Gán hoặc cập nhật giáo viên chủ nhiệm
      if (selectedTeacher) {
        if (modalType === "add" || !selectedClass?.homeroomTeacher) {
          await classService.assignHomeroomTeacher(
            classResult.classId,
            selectedTeacher
          );
        } else if (
          modalType === "edit" &&
          selectedClass?.homeroomTeacher?.userId !== selectedTeacher
        ) {
          await classService.updateHomeroomTeacher(
            classResult.classId,
            selectedTeacher
          );
        }
      }

      // 3. Cập nhật môn học và giáo viên
      const allClassSubjects = await classSubjectService.getAllClassSubjects();

      if (modalType === "edit" && selectedClass?.subjects) {
        for (const term of classResult.terms) {
          for (const subj of selectedSubjects) {
            const existingSubject = selectedClass.subjects.find(
              (s) => s.subjectId === subj.subjectId && s.termId === term.termId
            );

            // Cập nhật hoặc thêm mới classSubject
            const payload = {
              classId: classResult.classId,
              subjectId: subj.subjectId,
              teacherId: subj.teacherId ?? null,
              termIds: [term.termId],
            };
            if (existingSubject?.classSubjectId) {
              payload.classSubjectId = existingSubject.classSubjectId;
            }
            await classSubjectService.addClassSubject(payload);
          }

          // Xóa các môn học không còn được chọn
          const subjectsToRemove = selectedClass.subjects.filter(
            (existingSubject) =>
              !selectedSubjects.some(
                (selected) => selected.subjectId === existingSubject.subjectId
              ) && existingSubject.termId === term.termId
          );

          for (const subject of subjectsToRemove) {
            if (subject.classSubjectId) {
              await classSubjectService.deleteClassSubject(
                subject.classSubjectId
              );
            }
          }
        }
      } else if (modalType === "add") {
        // Thêm mới môn học cho lớp
        for (const subj of selectedSubjects) {
          for (const term of classResult.terms) {
            const exists = allClassSubjects.some(
              (cs) =>
                cs.classId === classResult.classId &&
                cs.subject.subjectId === subj.subjectId &&
                cs.term.termId === term.termId
            );

            if (!exists) {
              const payload = {
                classId: classResult.classId,
                subjectId: subj.subjectId,
                teacherId: subj.teacherId ?? null,
                termIds: [term.termId],
              };
              await classSubjectService.addClassSubject(payload);
            }
          }
        }
      }

      // Refresh dữ liệu
      await fetchClassesWithSubjects();
      showToast("Lưu lớp thành công!", "success");
      closeModal();
    } catch (error) {
      console.error("Lỗi khi lưu lớp:", error);
      showToast("Lỗi khi lưu lớp!", "error");
    }
  };

  // Xử lý xóa lớp học
  const handleDelete = async (classId) => {
    try {
      await classService.deleteClass(classId);
      setClasses((prev) => prev.filter((c) => c.classId !== classId));
      showToast("Xóa lớp thành công!", "success");
      closeModal();
    } catch (error) {
      console.error("Lỗi khi xóa lớp:", error);
      showToast("Lỗi khi xóa lớp!", "error");
    }
  };

  // Lọc danh sách lớp học theo từ khóa và trạng thái
  const filteredClasses = classes
    .filter((c) => {
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase();
      return (
        c.name.toLowerCase().includes(kw) ||
        c.subjects?.some((s) => s.name.toLowerCase().includes(kw))
      );
    })
    .filter((c) => {
      if (filterStatus === "all") return true;
      const now = new Date();
      const isCurrent = c.terms?.some(
        (t) => new Date(t.beginDate) <= now && new Date(t.endDate) >= now
      );
      const isUpcoming = c.terms?.some((t) => new Date(t.beginDate) > now);
      const isEnded = c.terms?.every((t) => new Date(t.endDate) < now);

      if (filterStatus === "current") return isCurrent;
      if (filterStatus === "upcoming") return isUpcoming;
      if (filterStatus === "ended") return isEnded;
      return true;
    });

  const homeroomTeachers = teachers.filter((t) => t.homeroomTeacher);
  const subjectTeachers = teachers;

  console.log("homeroomTeachers: ", homeroomTeachers);
  console.log("subjectTeachers: ", subjectTeachers);

  // Giao diện chính
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý lớp học (Giáo vụ)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý lớp học là công cụ giúp giáo viên tổ chức và quản lý lớp:
            điểm danh, giao bài, đánh giá học sinh.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
        >
          <PlusCircle size={16} />
          Thêm lớp mới
        </button>
      </div>
      <Toolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        keyword={keyword}
        setKeyword={setKeyword}
      />
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-4 border border-gray-200 dark:border-gray-600">
        <table className="min-w-[800px] w-full table-fixed text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Học kỳ
              </th>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Khối
              </th>
              <th className="px-4 py-3 w-[20%] text-gray-900 dark:text-gray-100">
                Tên lớp học
              </th>
              <th className="px-4 py-3 w-[25%] text-gray-900 dark:text-gray-100">
                Giáo viên chủ nhiệm
              </th>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Sĩ số
              </th>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Môn học
              </th>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Tùy chọn
              </th>
            </tr>
          </thead>
          <tbody>
            {[...filteredClasses]
              .sort((a, b) => a.name.localeCompare(b.name, "vi"))
              .map((c) => (
                <tr
                  key={c.classId}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {/* Học kỳ */}
                    {c.terms && c.terms.length > 0 ? (
                      c.terms.map((t) => <div key={t.termId}>{t.name}</div>)
                    ) : (
                      <div>Chưa có học kỳ</div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {gradeMapping[c.gradeLevel] || c.gradeLevel}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.homeroomTeacher?.fullName || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {/* {c.classSize} */}
                    {c.classSize ? (
                      <span className="font-medium">{c.classSize}</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        0
                      </span>
                    )}
                  </td>
                  {/* <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                    <div className="flex overflow-hidden whitespace-nowrap tablet:overflow-x-auto tablet:scrollbar-thin tablet:scrollbar-thumb-gray-400 tablet:scrollbar-track-transparent">
                      {c.subjects?.length ? (
                        c.subjects.map((s) => (
                          <Badge
                            key={s.subjectId}
                            text={s.name}
                            color="bg-blue-100 text-blue-700 mr-1 dark:bg-blue-900/30 dark:text-blue-300 shrink-0"
                          />
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          -
                        </span>
                      )}
                    </div>
                  </td> */}
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.subjects?.length ? (
                      <span className="font-medium">{c.subjects.length}</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        0
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => openModal("edit", c)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye size={16} />
                      {/* <span className="hidden sm:inline">Xem</span> */}
                    </button>
                    <button
                      onClick={() => openModal("students", c)}
                      className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline"
                    >
                      <Users size={16} />
                      {/* <span className="hidden sm:inline">Danh sách lớp</span> */}
                    </button>
                    <button
                      onClick={() => {
                        setClassToDelete(c);
                        setConfirmOpen(true);
                      }}
                      className="flex items-center gap-1 text-red-500 dark:text-red-400 hover:underline"
                    >
                      <Trash2 size={16} />
                      {/* <span className="hidden sm:inline">Xóa</span> */}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal quản lý học sinh */}
      {modalType === "students" && selectedClass && (
        <Modal
          title={`Quản lý học sinh - ${selectedClass.name}`}
          onClose={closeModal}
        >
          <StudentManagement classId={selectedClass.classId} />
        </Modal>
      )}

      {/* Modal thêm/sửa lớp học */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={modalType === "add" ? "Thêm lớp mới" : "Thông tin lớp học"}
          onClose={closeModal}
        >
          <div className="flex flex-col h-full">
            <form
              id="classForm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex-1 min-h-0" // Quan trọng: cho phép form co giãn
            >
              {/* Grid 2 cột - bằng nhau, khít */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Cột trái */}
                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Khối & Tên lớp */}
                    <div className="flex gap-4">
                      <div className="flex-[3]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Khối
                        </label>
                        <select
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                        >
                          <option value="GRADE_6">Khối 6</option>
                          <option value="GRADE_7">Khối 7</option>
                          <option value="GRADE_8">Khối 8</option>
                          <option value="GRADE_9">Khối 9</option>
                          <option value="GRADE_10">Khối 10</option>
                          <option value="GRADE_11">Khối 11</option>
                          <option value="GRADE_12">Khối 12</option>
                        </select>
                      </div>
                      <div className="flex-[7]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Tên lớp
                        </label>
                        <input
                          type="text"
                          placeholder="VD: 12A1"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    {/* Sĩ số & GVCN */}
                    <div className="flex gap-4">
                      <div className="flex-[3]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Sĩ số lớp
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={classSize}
                          disabled
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex-[7]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Giáo viên chủ nhiệm
                        </label>
                        <select
                          value={selectedTeacher}
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                        >
                          <option value="">
                            -- Chọn giáo viên chủ nhiệm --
                          </option>
                          {homeroomTeachers.map((t) => (
                            <option key={t.userId} value={t.userId}>
                              {t.fullName} ({t.teacherCode})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Danh sách học kỳ */}
                    <div>
                      <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
                        Danh sách học kỳ
                      </label>
                      <div className="border rounded-lg border-gray-300 dark:border-gray-600 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left">Số học kỳ</th>
                              <th className="px-3 py-2 text-left">Bắt đầu</th>
                              <th className="px-3 py-2 text-left">Kết thúc</th>
                              <th className="px-3 py-2 text-left">Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editableSemesters.map((sem, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-200 dark:border-gray-700"
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={sem.termNumber}
                                    readOnly
                                    className="w-12 px-2 py-1 border rounded text-center bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="date"
                                    value={sem.beginDate}
                                    onChange={(e) =>
                                      updateSemester(
                                        index,
                                        "beginDate",
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1 border rounded w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="date"
                                    value={sem.endDate}
                                    onChange={(e) =>
                                      updateSemester(
                                        index,
                                        "endDate",
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1 border rounded w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => removeSemester(index)}
                                    className="text-red-600 dark:text-red-400 hover:underline text-sm"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        onClick={addSemester}
                        className="mt-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        + Thêm học kỳ
                      </button>
                    </div>

                    {/* Danh sách môn học đã chọn */}
                    <div>
                      <label className="flex items-center gap-2 font-semibold mb-2 text-gray-700 dark:text-gray-200">
                        <BookUser size={16} />
                        Danh sách môn học đã thêm
                      </label>
                      {selectedSubjects.length > 0 ? (
                        <ul className="space-y-2 border rounded-lg p-2 max-h-48 overflow-y-auto border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                          {selectedSubjects.map((subj) => {
                            const subjectInfo = subjects.find(
                              (s) => s.subjectId === subj.subjectId
                            );
                            const teacherInfo = teachers.find(
                              (t) => t.userId === subj.teacherId
                            );
                            return (
                              <li
                                key={subj.subjectId}
                                className="flex justify-between items-center text-sm bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm"
                              >
                                <div className="flex-1 flex justify-between gap-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {subjectInfo?.name}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 truncate">
                                    {teacherInfo
                                      ? `${teacherInfo.fullName} (${teacherInfo.teacherCode})`
                                      : "Chưa chọn"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedSubjects((prev) =>
                                      prev.filter(
                                        (s) => s.subjectId !== subj.subjectId
                                      )
                                    )
                                  }
                                  className="text-red-500 dark:text-red-400 hover:underline text-xs ml-2"
                                >
                                  Xóa
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Chưa thêm môn học nào.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột phải - Môn học & Giáo viên */}
                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto pl-2 space-y-4">
                    <div>
                      <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
                        Môn học & Giáo viên phụ trách
                      </label>

                      {/* Ô tìm kiếm môn */}
                      <input
                        type="text"
                        placeholder="Tìm môn học..."
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />

                      {/* Danh sách môn */}
                      <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                        {subjects
                          .filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes(subjectSearch.toLowerCase())
                          )
                          .map((subj) => {
                            const selected = selectedSubjects.find(
                              (s) => s.subjectId === subj.subjectId
                            );
                            const teacher = teachers.find(
                              (t) => t.userId === selected?.teacherId
                            );

                            return (
                              <div
                                key={subj.subjectId}
                                className={`p-3 border rounded-lg transition-all ${
                                  selected
                                    ? "bg-green-50 dark:bg-green-900/30 border-green-400"
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!selected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSubjects((prev) => [
                                            ...prev,
                                            {
                                              subjectId: subj.subjectId,
                                              teacherId: null,
                                            },
                                          ]);
                                        } else {
                                          setSelectedSubjects((prev) =>
                                            prev.filter(
                                              (s) =>
                                                s.subjectId !== subj.subjectId
                                            )
                                          );
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-200"
                                    />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {subj.name}
                                    </span>
                                  </div>
                                </div>

                                {selected && (
                                  <div className="mt-3">
                                    {!teacher ||
                                    editTeacher === subj.subjectId ? (
                                      <>
                                        <input
                                          type="text"
                                          placeholder="Tìm giáo viên..."
                                          value={
                                            teacherSearch[subj.subjectId] || ""
                                          }
                                          onChange={(e) =>
                                            setTeacherSearch((prev) => ({
                                              ...prev,
                                              [subj.subjectId]: e.target.value,
                                            }))
                                          }
                                          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                        <div className="max-h-32 overflow-y-auto border rounded mt-1 border-gray-200 dark:border-gray-600">
                                          {subjectTeachers
                                            .filter((t) => {
                                              const term = (
                                                teacherSearch[subj.subjectId] ||
                                                ""
                                              ).toLowerCase();
                                              return (
                                                t.fullName
                                                  .toLowerCase()
                                                  .includes(term) ||
                                                (t.teacherCode &&
                                                  t.teacherCode
                                                    .toLowerCase()
                                                    .includes(term))
                                              );
                                            })
                                            .map((t) => (
                                              <div
                                                key={t.userId}
                                                onClick={() => {
                                                  setSelectedSubjects((prev) =>
                                                    prev.map((s) =>
                                                      s.subjectId ===
                                                      subj.subjectId
                                                        ? {
                                                            ...s,
                                                            teacherId: t.userId,
                                                          }
                                                        : s
                                                    )
                                                  );
                                                  setEditTeacher(null);
                                                  setTeacherSearch((prev) => ({
                                                    ...prev,
                                                    [subj.subjectId]: "",
                                                  }));
                                                }}
                                                className={`px-2 py-1.5 cursor-pointer text-sm transition-colors ${
                                                  t.userId ===
                                                  selected.teacherId
                                                    ? "bg-blue-600 text-white"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                              >
                                                <span className="font-medium">
                                                  {t.fullName}
                                                </span>
                                                <span className="text-xs ml-1">
                                                  (
                                                  {t.teacherCode ||
                                                    "Chưa có mã"}
                                                  )
                                                </span>
                                              </div>
                                            ))}
                                          {subjectTeachers.filter((t) => {
                                            const term = (
                                              teacherSearch[subj.subjectId] ||
                                              ""
                                            ).toLowerCase();
                                            return (
                                              t.fullName
                                                .toLowerCase()
                                                .includes(term) ||
                                              (t.teacherCode &&
                                                t.teacherCode
                                                  .toLowerCase()
                                                  .includes(term))
                                            );
                                          }).length === 0 && (
                                            <div className="px-2 py-1 text-xs text-gray-500 italic">
                                              Không tìm thấy giáo viên
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-green-700 dark:text-green-400">
                                          GV:{" "}
                                          <span className="font-semibold">
                                            {teacher.fullName}
                                          </span>{" "}
                                          ({teacher.teacherCode})
                                        </span>
                                        <button
                                          onClick={() =>
                                            setEditTeacher(subj.subjectId)
                                          }
                                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
                                        >
                                          <Edit size={14} /> Sửa
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {subjects.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Chưa có môn học nào.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="classForm"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition"
              >
                <Save size={16} />
                {modalType === "add" ? "Lưu lớp học" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác nhận xóa"
        message={
          classToDelete
            ? `Bạn có chắc chắn muốn xóa lớp ${classToDelete.name}?`
            : ""
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!classToDelete) return;
          try {
            await handleDelete(classToDelete.classId);
            setConfirmOpen(false);
            setClassToDelete(null);
          } catch (error) {
            console.error(error);
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ManageClasses;
