import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, User, X } from "lucide-react";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import StudentManagement from "./StudentManagement";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const Badge = ({ text, color }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${color} dark:bg-blue-900/30 dark:text-blue-300`}
  >
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-10/12 max-w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );

const formatTerm = (termNumber, beginDate) => {
  if (!termNumber) return "";
  if (!beginDate) return `HK${termNumber}`;

  const d = new Date(beginDate);
  if (isNaN(d)) return `HK${termNumber}`;

  const month = d.getMonth(); // 0..11
  const academicStart = month >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  const academicEnd = academicStart + 1;

  return `HK${termNumber} ${academicStart} - ${academicEnd}`;
};

const gradeMapping = {
  GRADE_6: "Khối 6",
  GRADE_7: "Khối 7",
  GRADE_8: "Khối 8",
  GRADE_9: "Khối 9",
  GRADE_10: "Khối 10",
  GRADE_11: "Khối 11",
  GRADE_12: "Khối 12",
};

// ---------------- Toolbar ----------------
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

// ---------------- Main ----------------
const ManageClasses = () => {
  const { showToast } = useToast();

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
  const [editableSemesters, setEditableSemesters] = useState([
    { termNumber: 1, beginDate: "", endDate: "" },
  ]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // Toolbar states
  const [filterStatus, setFilterStatus] = useState("all");
  const [keyword, setKeyword] = useState("");

  // Lấy schoolId từ user
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await subjectService.getAllSubjects();
      if (result) setSubjects(result);
    };
    fetchSubjects();
  }, []);

  // Load teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      const result = await teacherService.getAllTeachers();
      const filtered = result.filter((t) => t.school?.schoolId === schoolId);
      setTeachers(filtered);
    };
    fetchTeachers();
  }, [schoolId]);

  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      const allClasses = await classService.getClassesBySchoolId(schoolId);
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
      console.log("classesWithSubjects:", classesWithSubjects);

      setClasses(classesWithSubjects);
    } catch (err) {
      console.error("Lỗi khi load lớp và môn:", err);
      showToast("Lỗi khi tải dữ liệu lớp học!", "error");
    }
  }, [schoolId, showToast]);

  useEffect(() => {
    fetchClassesWithSubjects();
  }, [fetchClassesWithSubjects]);

  // ----------------- Functions -----------------
  const addSemester = () => {
    setEditableSemesters((prev) => [
      ...prev,
      { termNumber: prev.length + 1, beginDate: "", endDate: "" },
    ]);
  };

  const removeSemester = (index) => {
    setEditableSemesters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSemester = (index, field, value) => {
    setEditableSemesters((prev) =>
      prev.map((sem, i) => (i === index ? { ...sem, [field]: value } : sem))
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

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

  const closeModal = () => {
    setSelectedClass(null);
    setModalType(null);
  };

  const handleSave = async () => {
    if (!name) return showToast("Vui lòng nhập tên lớp!", "warn");

    try {
      // Payload lớp
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

      // 1. Thêm hoặc update lớp
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

      // 2. Gán / cập nhật giáo viên chủ nhiệm
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

      // 3. Gán môn học cho lớp (chỉ thêm mới)
      if (selectedSubjects.length > 0) {
        for (const subj of selectedSubjects) {
          for (const term of classResult.terms) {
            const exists = classes.some(
              (c) =>
                c.classId === classResult.classId &&
                c.subjects?.some(
                  (s) =>
                    s.subjectId === subj.subjectId && s.termId === term.termId
                )
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

  // ----------------- Render -----------------
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

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          + Thêm lớp mới
        </button>
      </div>
      {/* Toolbar */}
      <Toolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        keyword={keyword}
        setKeyword={setKeyword}
      />
      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-4 border border-gray-200 dark:border-gray-600">
        <table className="min-w-[800px] w-full table-fixed text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Khối
              </th>
              <th className="px-4 py-3 w-[20%] text-gray-900 dark:text-gray-100">
                Tên lớp học
              </th>
              <th className="px-4 py-3 w-[20%] text-gray-900 dark:text-gray-100">
                Giáo viên chủ nhiệm
              </th>
              <th className="px-4 py-3 w-[10%] text-gray-900 dark:text-gray-100">
                Sĩ số
              </th>
              <th className="px-4 py-3 w-[20%] text-gray-900 dark:text-gray-100">
                Môn học
              </th>
              <th className="px-4 py-3 w-[20%] text-gray-900 dark:text-gray-100">
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
                    {gradeMapping[c.gradeLevel] || c.gradeLevel}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.homeroomTeacher?.fullName || "-"}
                  </td>

                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {c.classSize}
                  </td>
                  <td className="px-4 py-3">
                    {c.subjects?.length ? (
                      c.subjects.map((s) => (
                        <Badge
                          key={s.subjectId}
                          text={s.name}
                          color="bg-blue-100 text-blue-700 mr-1 dark:bg-blue-900/30 dark:text-blue-300"
                        />
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => openModal("edit", c)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Xem</span>
                    </button>
                    <button
                      onClick={() => openModal("students", c)}
                      className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline"
                    >
                      <User size={16} />
                      <span className="hidden sm:inline">Danh sách lớp</span>
                    </button>
                    <button
                      onClick={() => {
                        setClassToDelete(c);
                        setConfirmOpen(true);
                      }}
                      className="flex items-center gap-1 text-red-500 dark:text-red-400 hover:underline"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal Students */}
      {modalType === "students" && selectedClass && (
        <Modal
          title={`Quản lý học sinh - ${selectedClass.name}`}
          onClose={closeModal}
        >
          <StudentManagement classId={selectedClass.classId} />
        </Modal>
      )}

      {/* Modal Add/Edit */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={modalType === "add" ? "Thêm lớp mới" : "Thông tin lớp học"}
          onClose={closeModal}
        >
          <div className="flex flex-col h-[60vh]">
            {/* Nội dung chính */}
            <form
              id="classForm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden"
            >
              {/* Cột 1 */}
              <div className="space-y-4 flex flex-col h-full overflow-y-auto pr-2">
                {/* Khối lớp */}
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
                          border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 
                            focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                >
                  <option value="GRADE_6">Khối 6</option>
                  <option value="GRADE_7">Khối 7</option>
                  <option value="GRADE_8">Khối 8</option>
                  <option value="GRADE_9">Khối 9</option>
                  <option value="GRADE_10">Khối 10</option>
                  <option value="GRADE_11">Khối 11</option>
                  <option value="GRADE_12">Khối 12</option>
                </select>

                {/* Tên lớp */}
                <input
                  type="text"
                  placeholder="Tên lớp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />

                {/* Sĩ số */}
                <input
                  type="number"
                  placeholder="Sĩ số lớp"
                  value={classSize}
                  disabled
                  onChange={(e) => setClassSize(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />

                {/* GVCN */}
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 
             border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 
             focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                >
                  <option value="">-- Chọn giáo viên chủ nhiệm --</option>
                  {teachers
                    .filter((t) => t.homeroomTeacher)
                    .map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {t.fullName}
                      </option>
                    ))}
                </select>

                {/* Học kỳ */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
                    Danh sách học kỳ
                  </label>
                  <div className="overflow-x-auto border rounded-lg border-gray-300 dark:border-gray-600">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            Số học kỳ
                          </th>
                          <th className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            Bắt đầu
                          </th>
                          <th className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            Kết thúc
                          </th>
                          <th className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableSemesters.map((sem, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-700"
                          >
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={sem.termNumber}
                                readOnly
                                className="w-12 px-2 py-1 border rounded text-center bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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
                                className="px-2 py-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
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
                                className="px-2 py-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeSemester(index)}
                                className="text-red-600 dark:text-red-400 hover:underline"
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
                    className="mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    + Thêm học kỳ
                  </button>
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4 flex flex-col h-full overflow-y-auto pl-2">
                {/* Môn học */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
                    Môn học
                  </label>
                  <div className="space-y-2 border p-2 rounded-lg border-gray-300 dark:border-gray-600">
                    {subjects.map((subj) => {
                      const selected = selectedSubjects.find(
                        (s) => s.subjectId === subj.subjectId
                      );
                      return (
                        <div
                          key={subj.subjectId}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([
                                  ...selectedSubjects,
                                  {
                                    subjectId: subj.subjectId,
                                    teacherId: null,
                                  },
                                ]);
                              } else {
                                setSelectedSubjects(
                                  selectedSubjects.filter(
                                    (s) => s.subjectId !== subj.subjectId
                                  )
                                );
                              }
                            }}
                            className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-200 dark:focus:ring-blue-400"
                          />
                          <span className="flex-1 text-gray-900 dark:text-gray-100">
                            {subj.name}
                          </span>
                          <select
                            value={selected?.teacherId ?? ""}
                            onChange={(e) =>
                              setSelectedSubjects(
                                selectedSubjects.map((s) =>
                                  s.subjectId === subj.subjectId
                                    ? {
                                        ...s,
                                        teacherId: e.target.value
                                          ? Number(e.target.value)
                                          : null,
                                      }
                                    : s
                                )
                              )
                            }
                            className="px-2 py-1 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                            disabled={!selected}
                          >
                            <option value="">
                              {selected?.teacherName || "-- Chọn giáo viên --"}
                            </option>
                            {teachers.map((t) => (
                              <option key={t.userId} value={t.userId}>
                                {t.fullName} - {t.teacherCode}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </form>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="classForm"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition"
              >
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
