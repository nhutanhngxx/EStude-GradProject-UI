import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { Eye, PlusCircle, Save, Trash2, Users, X, Search } from "lucide-react";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import StudentManagement from "./StudentManagement";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

// Component SearchableSelect
const SearchableSelect = ({ teachers, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTeachers = teachers.filter((teacher) => {
    const search = searchTerm.toLowerCase();
    return (
      teacher.fullName.toLowerCase().includes(search) ||
      teacher.teacherCode.toLowerCase().includes(search)
    );
  });

  const selectedTeacher = teachers.find((t) => t.userId === value);
  const displayText = selectedTeacher
    ? `${selectedTeacher.fullName} (${selectedTeacher.teacherCode})`
    : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-left focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 flex items-center justify-between"
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc mã..."
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              -- Chọn giáo viên --
            </button>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <button
                  key={teacher.userId}
                  type="button"
                  onClick={() => {
                    onChange(teacher.userId);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    value === teacher.userId
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {teacher.fullName} ({teacher.teacherCode})
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Không tìm thấy giáo viên
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal chung
const Modal = ({ title, children, onClose }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );

// Định dạng tên học kỳ
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

// Ánh xạ khối lớp
const gradeMapping = {
  GRADE_6: "Khối 6",
  GRADE_7: "Khối 7",
  GRADE_8: "Khối 8",
  GRADE_9: "Khối 9",
  GRADE_10: "Khối 10",
  GRADE_11: "Khối 11",
  GRADE_12: "Khối 12",
};

const ManageClasses = () => {
  const { showToast } = useToast();

  // State chung
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("GRADE_10");
  const [classSize, setClassSize] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [editableSemesters, setEditableSemesters] = useState([
    { termNumber: 1, beginDate: "", endDate: "" },
  ]);

  // Xóa lớp
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // Bộ lọc: học kỳ (theo tên) + tìm kiếm
  const [selectedTermName, setSelectedTermName] = useState(null);
  const [schoolTerms, setSchoolTerms] = useState([]);
  const [keyword, setKeyword] = useState("");

  // User info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const isAdmin = user.admin === true;

  // === TẢI DỮ LIỆU ===

  // Môn học
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const result = await subjectService.getAllSubjects();
        const filtered = isAdmin
          ? result
          : result.filter(
              (s) =>
                Array.isArray(s.schools) &&
                s.schools.some((sch) => sch.schoolId === schoolId)
            );
        setSubjects(filtered);
      } catch (error) {
        showToast("Lỗi tải môn học!", "error");
      }
    };
    if (schoolId || isAdmin) fetchSubjects();
  }, [schoolId, isAdmin, showToast]);

  // Giáo viên
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const result = await teacherService.getAllTeachers();
        setTeachers(result.filter((t) => t.school?.schoolId === schoolId));
      } catch (error) {
        console.error(error);
      }
    };
    if (schoolId) fetchTeachers();
  }, [schoolId]);

  // Học kỳ toàn trường
  useEffect(() => {
    const fetchSchoolTerms = async () => {
      if (!schoolId) return;
      try {
        const schoolClasses = await classService.getClassesBySchoolId(schoolId);
        if (!Array.isArray(schoolClasses)) return;

        const termMap = new Map();
        schoolClasses.forEach((cls) => {
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
        console.error("Lỗi tải học kỳ:", err);
      }
    };
    fetchSchoolTerms();
  }, [schoolId]);

  // Danh sách học kỳ unique theo tên (cho dropdown)
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

  // Tự động chọn học kỳ hiện tại
  // useEffect(() => {
  //   if (selectedTermName || termNameOptions.length === 0) return;

  //   const today = new Date("2025-12-11");
  //   const current = schoolTerms.find((t) => {
  //     const begin = new Date(t.beginDate);
  //     const end = new Date(t.endDate);
  //     return today >= begin && today <= end;
  //   });

  //   if (current) {
  //     setSelectedTermName(current.termName);
  //   } else if (termNameOptions.length > 0) {
  //     setSelectedTermName(termNameOptions[0].termName);
  //   }
  // }, [termNameOptions, schoolTerms, selectedTermName]);

  // Lớp học + môn học
  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      const [allClasses, allClassSubjects] = await Promise.all([
        classService.getClassesBySchoolId(schoolId),
        classSubjectService.getAllClassSubjects(),
      ]);

      const classesWithSubjects = allClasses.map((cls) => {
        const subjectsForClass = allClassSubjects
          .filter((cs) => cls.terms.some((t) => t.termId === cs.term?.termId))
          .map((cs) => ({
            classSubjectId: cs.classSubjectId,
            subjectId: cs.subject.subjectId,
            name: cs.subject.name,
            teacherId: cs.teacher?.userId ?? null,
            teacherName: cs.teacher?.fullName,
            termId: cs.term?.termId,
            termName: cs.term?.name,
          }));

        return { ...cls, subjects: subjectsForClass };
      });

      setClasses(classesWithSubjects);
    } catch (err) {
      showToast("Lỗi tải lớp học!", "error");
    }
  }, [schoolId, showToast]);

  useEffect(() => {
    if (schoolId) fetchClassesWithSubjects();
  }, [schoolId, fetchClassesWithSubjects]);

  // Lọc lớp theo tên học kỳ + từ khóa
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const termPass =
        selectedTermName === null ||
        c.terms?.some((t) => t.name === selectedTermName);

      const kw = keyword.toLowerCase().trim();
      const keywordPass =
        !kw ||
        c.name.toLowerCase().includes(kw) ||
        c.subjects?.some((s) => s.name.toLowerCase().includes(kw));

      return termPass && keywordPass;
    });
  }, [classes, selectedTermName, keyword]);

  const currentTermLabel = selectedTermName || "";

  // === FORM HANDLERS ===
  const openModal = (type, cls = null) => {
    setSelectedClass(cls);
    setModalType(type);

    if (type === "add") {
      setName("");
      setGradeLevel("GRADE_10");
      setClassSize(0);
      setSelectedTeacher("");
      setSelectedSubjects([]);
      setEditableSemesters([{ termNumber: 1, beginDate: "", endDate: "" }]);
    } else if (type === "edit" && cls) {
      setName(cls.name);
      setGradeLevel(cls.gradeLevel);
      setClassSize(cls.classSize || 0);
      setSelectedTeacher(cls.homeroomTeacher?.userId ?? "");

      const subjectsMap = new Map();
      cls.subjects?.forEach((s) => {
        if (!subjectsMap.has(s.subjectId)) {
          subjectsMap.set(s.subjectId, {
            subjectId: s.subjectId,
            name: s.name,
            termTeachers: {},
          });
        }
        subjectsMap.get(s.subjectId).termTeachers[s.termId] = {
          classSubjectId: s.classSubjectId,
          teacherId: s.teacherId,
          teacherName: s.teacherName,
        };
      });
      setSelectedSubjects(Array.from(subjectsMap.values()));

      setEditableSemesters(
        cls.terms?.map((t) => ({
          termId: t.termId,
          termNumber: t.name.includes("HK1") ? 1 : 2,
          beginDate: t.beginDate?.split("T")[0] || "",
          endDate: t.endDate?.split("T")[0] || "",
        })) || [{ termNumber: 1, beginDate: "", endDate: "" }]
      );
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedClass(null);
  };

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

  const handleSave = async () => {
    if (!name.trim()) return showToast("Vui lòng nhập tên lớp!", "warn");

    try {
      const classPayload = {
        classId: selectedClass?.classId,
        name,
        gradeLevel,
        classSize,
        schoolId,
        terms: editableSemesters
          .filter((s) => s.beginDate && s.endDate)
          .map((s) => ({
            ...(s.termId && { termId: s.termId }),
            name: formatTerm(s.termNumber, s.beginDate),
            beginDate: s.beginDate,
            endDate: s.endDate,
          })),
      };

      let classResult;
      if (modalType === "add") {
        classResult = await classService.addClass(classPayload);
      } else {
        classResult = await classService.updateClass(classPayload);
      }

      if (!classResult?.classId) throw new Error("Lưu lớp thất bại");

      // GVCN
      if (selectedTeacher) {
        if (!selectedClass?.homeroomTeacher?.userId) {
          await classService.assignHomeroomTeacher(
            classResult.classId,
            selectedTeacher
          );
        } else if (selectedClass.homeroomTeacher.userId !== selectedTeacher) {
          await classService.updateHomeroomTeacher(
            classResult.classId,
            selectedTeacher
          );
        }
      }

      // Phân môn (giữ nguyên logic cũ)
      const allClassSubjects = await classSubjectService.getAllClassSubjects();

      if (modalType === "edit" && selectedClass?.subjects) {
        for (const term of classResult.terms) {
          for (const subj of selectedSubjects) {
            const termTeacher = subj.termTeachers?.[term.termId];
            const newTeacherId = termTeacher?.teacherId ?? null;

            const existingSubject = selectedClass.subjects.find(
              (s) => s.subjectId === subj.subjectId && s.termId === term.termId
            );

            if (existingSubject?.classSubjectId) {
              if (existingSubject.teacherId !== newTeacherId) {
                await classSubjectService.updateClassSubjectTeacher(
                  existingSubject.classSubjectId,
                  newTeacherId
                );
              }
            } else {
              const payload = {
                classId: classResult.classId,
                subjectId: subj.subjectId,
                teacherId: newTeacherId,
                termIds: [term.termId],
              };
              await classSubjectService.addClassSubject(payload);
            }
          }

          // Xóa môn không còn chọn
          const subjectsToRemove = selectedClass.subjects.filter(
            (s) =>
              !selectedSubjects.some((sel) => sel.subjectId === s.subjectId) &&
              s.termId === term.termId
          );
          for (const s of subjectsToRemove) {
            if (s.classSubjectId) {
              await classSubjectService.deleteClassSubject(s.classSubjectId);
            }
          }
        }
      } else if (modalType === "add") {
        for (const subj of selectedSubjects) {
          for (const term of classResult.terms) {
            const teacherId =
              subj.termTeachers?.[term.termId]?.teacherId ?? null;
            const payload = {
              classId: classResult.classId,
              subjectId: subj.subjectId,
              teacherId,
              termIds: [term.termId],
            };
            await classSubjectService.addClassSubject(payload);
          }
        }
      }

      await fetchClassesWithSubjects();
      showToast("Lưu thành công!", "success");
      closeModal();
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi lưu lớp!", "error");
    }
  };

  const handleDelete = async (classId) => {
    try {
      await classService.deleteClass(classId);
      setClasses((prev) => prev.filter((c) => c.classId !== classId));
      showToast("Xóa lớp thành công!", "success");
    } catch (error) {
      showToast("Lỗi xóa lớp!", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý lớp học (Giáo vụ)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Danh sách lớp học theo
            {selectedTermName && (
              <span className="ml-2 font-medium">{currentTermLabel}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusCircle size={18} />
          Thêm lớp mới
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <select
          value={selectedTermName ?? ""}
          onChange={(e) => setSelectedTermName(e.target.value || null)}
          className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
        >
          <option value="">Chọn học kỳ</option>
          {termNameOptions.map((opt) => (
            <option key={opt.termName} value={opt.termName}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm lớp hoặc môn học..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Danh sách lớp */}
      {selectedTermName === null ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Vui lòng chọn học kỳ để xem danh sách lớp học.
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Không có lớp học nào trong học kỳ này.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3">Học kỳ</th>
                <th className="px-4 py-3">Khối</th>
                <th className="px-4 py-3">Tên lớp</th>
                <th className="px-4 py-3">GVCN</th>
                <th className="px-4 py-3">Sĩ số</th>
                <th className="px-4 py-3">Số môn</th>
                <th className="px-4 py-3">Tùy chọn</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses
                .sort((a, b) => a.name.localeCompare(b.name, "vi"))
                .map((c) => (
                  <tr
                    key={c.classId}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      {c.terms?.map((t) => (
                        <div key={t.termId}>{t.name}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {gradeMapping[c.gradeLevel] || c.gradeLevel}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      {c.homeroomTeacher?.fullName || "-"}
                    </td>
                    <td className="px-4 py-3">{c.classSize || 0}</td>
                    <td className="px-4 py-3">
                      {new Set(c.subjects.map((s) => s.subjectId)).size}
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <button
                        onClick={() => openModal("edit", c)}
                        className="text-blue-600 hover:underline"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openModal("students", c)}
                        className="text-green-600 hover:underline"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setClassToDelete(c);
                          setConfirmOpen(true);
                        }}
                        className="text-red-600 hover:underline"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal quản lý học sinh */}
      {modalType === "students" && selectedClass && (
        <Modal
          title={`Quản lý học sinh - ${selectedClass.name}`}
          onClose={closeModal}
        >
          <StudentManagement classId={selectedClass.classId} />
        </Modal>
      )}

      {/* Modal thêm/sửa lớp */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={modalType === "add" ? "Thêm lớp mới" : "Thông tin lớp học"}
          onClose={closeModal}
        >
          <div className="flex flex-col h-[80vh]">
            <form
              id="classForm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden"
            >
              {/* Phần trái: Thông tin lớp + học kỳ */}
              <div className="space-y-4 flex flex-col h-full overflow-y-auto pr-2">
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                >
                  {Object.entries(gradeMapping).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tên lớp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Sĩ số lớp"
                  value={classSize}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
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

                <div>
                  <label className="block font-semibold mb-2">
                    Danh sách học kỳ
                  </label>
                  <div className="border rounded-lg border-gray-300 dark:border-gray-600">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2">Số HK</th>
                          <th className="px-3 py-2">Bắt đầu</th>
                          <th className="px-3 py-2">Kết thúc</th>
                          <th className="px-3 py-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableSemesters.map((sem, index) => (
                          <tr
                            key={index}
                            className="border-b dark:border-gray-700"
                          >
                            <td className="px-3 py-2 text-center">
                              {sem.termNumber}
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
                                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800"
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
                                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeSemester(index)}
                                className="text-red-600 hover:underline text-sm"
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
                    className="mt-2 text-sm px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    + Thêm học kỳ
                  </button>
                </div>
              </div>

              {/* Phần phải: Môn học & giáo viên */}
              <div className="space-y-4 overflow-y-auto pl-2">
                <label className="block font-semibold mb-2">
                  Môn học và Giáo viên theo Học kỳ
                </label>
                {subjects.length > 0 ? (
                  <div className="space-y-3 border p-3 rounded-lg border-gray-300 dark:border-gray-600 max-h-[500px] overflow-y-auto">
                    {subjects.map((subj) => {
                      const selected = selectedSubjects.find(
                        (s) => s.subjectId === subj.subjectId
                      );
                      return (
                        <div
                          key={subj.subjectId}
                          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubjects([
                                    ...selectedSubjects,
                                    {
                                      subjectId: subj.subjectId,
                                      name: subj.name,
                                      termTeachers: {},
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
                              className="w-4 h-4"
                            />
                            <span className="font-medium">{subj.name}</span>
                          </div>
                          {selected && editableSemesters.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {editableSemesters.map((term) => {
                                const termTeacher =
                                  selected.termTeachers?.[term.termId];
                                return (
                                  <div
                                    key={term.termId || term.termNumber}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                                      HK{term.termNumber}:
                                    </span>
                                    <div className="flex-1">
                                      <SearchableSelect
                                        teachers={teachers}
                                        value={termTeacher?.teacherId ?? ""}
                                        onChange={(newTeacherId) => {
                                          const teacherId = newTeacherId
                                            ? Number(newTeacherId)
                                            : null;
                                          setSelectedSubjects(
                                            selectedSubjects.map((s) =>
                                              s.subjectId === subj.subjectId
                                                ? {
                                                    ...s,
                                                    termTeachers: {
                                                      ...s.termTeachers,
                                                      [term.termId ||
                                                      term.termNumber]: {
                                                        teacherId,
                                                        classSubjectId:
                                                          termTeacher?.classSubjectId,
                                                      },
                                                    },
                                                  }
                                                : s
                                            )
                                          );
                                        }}
                                        placeholder="-- Chọn giáo viên --"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có môn học nào.</p>
                )}
              </div>
            </form>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="classForm"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
        onConfirm={() => {
          if (classToDelete) handleDelete(classToDelete.classId);
          setConfirmOpen(false);
          setClassToDelete(null);
        }}
      />
    </div>
  );
};

export default ManageClasses;
