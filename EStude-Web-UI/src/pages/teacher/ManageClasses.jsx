import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, User, X } from "lucide-react";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import StudentManagement from "./StudentManagement";
import { useToast } from "../../contexts/ToastContext";

const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-5/6 max-w-6xl overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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

// ---------------- Toolbar ----------------
const Toolbar = ({ filterStatus, setFilterStatus, keyword, setKeyword }) => (
  <div className="flex flex-wrap gap-4 items-center">
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Tìm kiếm lớp/môn..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="px-3 py-2 border rounded-lg flex-1"
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border rounded-lg"
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

      setClasses(classesWithSubjects);
    } catch (err) {
      console.error("Lỗi khi load lớp và môn:", err);
    }
  }, [schoolId]);

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
      const classPayload = {
        classId: selectedClass?.classId,
        name,
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
              await classSubjectService.addClassSubject({
                classId: classResult.classId,
                subjectId: subj.subjectId,
                teacherId: subj.teacherId ?? null,
                termIds: [term.termId],
              });
            }
          }
        }
      }

      await fetchClassesWithSubjects();
      showToast("Lưu lớp thành công!", "success");
      closeModal();
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi lưu lớp!", "error");
    }
  };

  const handleDelete = (classId) => {
    setClasses((prev) => prev.filter((c) => c.classId !== classId));
    closeModal();
  };

  // ----------------- Render -----------------
  const filteredClasses = classes
    .filter((c) => {
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          c.name.toLowerCase().includes(kw) ||
          c.subjects?.some((s) => s.name.toLowerCase().includes(kw))
        );
      }
      return true;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý lớp học</h1>
          <p className="text-gray-600">
            Quản lý lớp học là công cụ giúp giáo viên tổ chức và quản lý lớp:
            điểm danh, giao bài, đánh giá học sinh.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
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
      <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
        <table className="min-w-[600px] w-full table-fixed text-sm text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-[20%]">Tên lớp học</th>
              <th className="px-4 py-3 w-[30%]">Môn học</th>
              <th className="px-4 py-3 w-[25%]">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {[...filteredClasses]
              .sort((a, b) => a.name.localeCompare(b.name, "vi"))
              .map((c) => (
                <tr key={c.classId} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.subjects?.length
                      ? c.subjects.map((s) => (
                          <Badge
                            key={s.subjectId}
                            text={s.name}
                            color="bg-blue-100 text-blue-700 mr-1"
                          />
                        ))
                      : "-"}
                  </td>
                  <td className="px-4 py-3 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => openModal("edit", c)}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Xem</span>
                    </button>
                    <button
                      onClick={() => openModal("students", c)}
                      className="flex items-center gap-1 text-green-600 hover:underline"
                    >
                      <User size={16} />
                      <span className="hidden sm:inline">Danh sách lớp</span>
                    </button>
                    <button
                      onClick={() => openModal("delete", c)}
                      className="flex items-center gap-1 text-red-500 hover:underline"
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
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden"
            >
              {/* Cột 1 */}
              <div className="space-y-4 flex flex-col h-full overflow-y-auto pr-2">
                {/* Tên lớp */}
                <input
                  type="text"
                  placeholder="Tên lớp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />

                {/* Sĩ số */}
                <input
                  type="number"
                  placeholder="Sĩ số lớp"
                  value={classSize}
                  disabled
                  onChange={(e) => setClassSize(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />

                {/* GVCN */}
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">-- Chọn giáo viên chủ nhiệm --</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.fullName}
                    </option>
                  ))}
                </select>

                {/* Học kỳ */}
                <div>
                  <label className="block font-semibold mb-2">
                    Danh sách học kỳ
                  </label>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left overflow-y-auto">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2">Số học kỳ</th>
                          <th className="px-3 py-2">Bắt đầu</th>
                          <th className="px-3 py-2">Kết thúc</th>
                          <th className="px-3 py-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableSemesters.map((sem, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={sem.termNumber}
                                readOnly
                                className="w-12 px-2 py-1 border rounded text-center"
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
                                className="px-2 py-1 border rounded"
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
                                className="px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeSemester(index)}
                                className="text-red-600 hover:underline"
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
                    className="mt-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  >
                    + Thêm học kỳ
                  </button>
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4 flex flex-col h-full overflow-y-auto pl-2">
                {/* Môn học */}
                <div>
                  <label className="block font-semibold mb-2">Môn học</label>
                  <div className="space-y-2 border p-2 rounded-lg">
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
                            className="accent-blue-600"
                          />
                          <span className="flex-1">{subj.name}</span>
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
                            className="px-2 py-1 border rounded-lg"
                            disabled={!selected}
                          >
                            <option value="">-- Chọn giáo viên --</option>
                            {teachers.map((t) => (
                              <option key={t.userId} value={t.userId}>
                                {t.fullName}
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
                type="submit"
                form="classForm"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 
               hover:bg-blue-500 hover:text-white transition"
              >
                {modalType === "add" ? "Lưu lớp học" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Delete */}
      {modalType === "delete" && selectedClass && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>
            Bạn có chắc chắn muốn xóa <strong>{selectedClass.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={() => handleDelete(selectedClass.classId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageClasses;
