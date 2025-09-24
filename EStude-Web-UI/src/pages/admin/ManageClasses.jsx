import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, User, X } from "lucide-react";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import schoolService from "../../services/schoolService";
import StudentManagement from "../teacher/StudentManagement";
import Toolbar from "../../components/common/Toolbar";
import { useToast } from "../../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import Pagination from "../../components/common/Pagination";

// ----------------- Components -----------------
const Badge = ({
  text,
  color = "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full mr-1 ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-5/6 max-w-6xl overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );

// ----------------- Utils -----------------
const formatTerm = (termNumber, beginDate) => {
  if (!termNumber) return "";
  if (!beginDate) return `HK${termNumber}`;
  const d = new Date(beginDate);
  if (isNaN(d)) return `HK${termNumber}`;
  const month = d.getMonth();
  const academicStart = month >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  const academicEnd = academicStart + 1;
  return `HK${termNumber} ${academicStart}-${academicEnd}`;
};

// ----------------- Main Component -----------------
const ManageClassesAdmin = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [name, setName] = useState("");
  const [classSize, setClassSize] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");

  const [editableSemesters, setEditableSemesters] = useState([
    { termNumber: 1, beginDate: "", endDate: "" },
  ]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 item trên mỗi trang

  // ----------------- Data Fetching -----------------
  useEffect(() => {
    schoolService.getAllSchools().then(setSchools);
    subjectService.getAllSubjects().then(setSubjects);
    teacherService.getAllTeachers().then(setTeachers);
  }, []);

  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      const allClasses = await classService.getAllClasses();
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
      console.error("Error loading classes:", err);
    }
  }, []);

  useEffect(() => {
    fetchClassesWithSubjects();
  }, [fetchClassesWithSubjects]);

  // ----------------- Semester Handlers -----------------
  const addSemester = () =>
    setEditableSemesters((prev) => [
      ...prev,
      { termNumber: prev.length + 1, beginDate: "", endDate: "" },
    ]);
  const removeSemester = (index) =>
    setEditableSemesters((prev) => prev.filter((_, i) => i !== index));
  const updateSemester = (index, field, value) =>
    setEditableSemesters((prev) =>
      prev.map((sem, i) => (i === index ? { ...sem, [field]: value } : sem))
    );

  // ----------------- Modal -----------------
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
          subjectId: s.subjectId,
          teacherId: s.teacherId ?? null,
        })) || []
      );
      setSelectedTeacher(cls.homeroomTeacher?.userId ?? "");
      setEditableSemesters(
        cls.terms?.map((t, idx) => ({
          termId: t.termId,
          termNumber: idx + 1,
          beginDate: t.beginDate?.split("T")[0],
          endDate: t.endDate?.split("T")[0],
        })) || [{ termNumber: 1, beginDate: "", endDate: "" }]
      );
    }
  };
  const closeModal = () => {
    setSelectedClass(null);
    setModalType(null);
  };

  // ----------------- CRUD -----------------
  const handleSave = async () => {
    if (!name) return showToast("Vui lòng nhập tên lớp!", "warn");

    try {
      const classPayload = {
        classId: selectedClass?.classId,
        name,
        classSize,
        schoolId: selectedSchool ? Number(selectedSchool) : undefined,
        terms: editableSemesters
          .filter((s) => s.beginDate && s.endDate)
          .map((s) => ({ ...s, name: formatTerm(s.termNumber, s.beginDate) })),
      };

      let classResult;
      if (modalType === "add")
        classResult = await classService.addClass(classPayload);
      else if (modalType === "edit")
        classResult = await classService.updateClass(classPayload);

      for (const subj of selectedSubjects) {
        for (const term of classResult.terms) {
          await classSubjectService.addClassSubject({
            classId: classResult.classId,
            subjectId: subj.subjectId,
            teacherId: subj.teacherId ?? null,
            termIds: [term.termId],
          });
        }
      }

      fetchClassesWithSubjects();
      showToast("Lưu lớp thành công!", "success");
      closeModal();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu lớp!", "error");
    }
  };

  const handleDelete = async (classId) => {
    await classService.deleteClass(classId);
    fetchClassesWithSubjects();
    closeModal();
  };

  // ----------------- Filtering -----------------
  const filteredClasses = classes.filter((cls) => {
    const kw = keyword.trim().toLowerCase();
    const matchesKeyword =
      !kw ||
      cls.name.toLowerCase().includes(kw) ||
      cls.subjects?.some((s) => s.name.toLowerCase().includes(kw));
    const matchesSchool =
      !selectedSchool || cls.school?.schoolId === Number(selectedSchool);

    let matchesStatus = true;
    if (filterStatus !== "all") {
      const now = new Date();
      const isCurrent = cls.terms?.some(
        (t) => new Date(t.beginDate) <= now && new Date(t.endDate) >= now
      );
      const isUpcoming = cls.terms?.some((t) => new Date(t.beginDate) > now);
      const isEnded = cls.terms?.every((t) => new Date(t.endDate) < now);

      matchesStatus =
        filterStatus === "current"
          ? isCurrent
          : filterStatus === "upcoming"
          ? isUpcoming
          : filterStatus === "ended"
          ? isEnded
          : true;
    }

    return matchesKeyword && matchesSchool && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClasses = filteredClasses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalItems = filteredClasses.length;

  // ----------------- Render -----------------
  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("manageClasses.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("manageClasses.subtitle")}
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-indigo-700 rounded-lg text-white text-sm shadow"
        >
          + {t("manageClasses.addNewClass")}
        </button>
      </div>

      <Toolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        keyword={keyword}
        setKeyword={setKeyword}
        selectedSchool={selectedSchool}
        setSelectedSchool={setSelectedSchool}
        schools={schools}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-gray-800 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                {t("manageClasses.table.name")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageClasses.table.school")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageClasses.table.subjects")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageClasses.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentClasses.length > 0 ? (
              currentClasses.map((c) => (
                <tr
                  key={c.classId}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.school?.schoolName || "-"}</td>
                  <td className="px-4 py-3">
                    {c.subjects?.map((s) => (
                      <Badge key={s.subjectId} text={s.name} />
                    )) || "-"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openModal("edit", c)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openModal("students", c)}
                      className="text-green-600 dark:text-green-400 hover:underline"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openModal("delete", c)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-center text-gray-500 dark:text-gray-400"
                >
                  {t("manageClasses.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        siblingCount={1}
      />

      {/* Modals */}
      {modalType === "students" && selectedClass && (
        <Modal
          title={`Quản lý học sinh - ${selectedClass.name}`}
          onClose={closeModal}
        >
          <StudentManagement classId={selectedClass.classId} />
        </Modal>
      )}

      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={
            modalType === "add"
              ? t("manageClasses.addNewClass")
              : t("manageClasses.classInfo")
          }
          onClose={closeModal}
        >
          {/* Form */}
          <form
            id="classForm"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {/* Left Column */}
            <div className="space-y-4 flex flex-col overflow-y-auto p-1">
              {/* Class Name */}
              <input
                type="text"
                placeholder={t("manageClasses.className")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Class Size */}
              <input
                type="number"
                placeholder={t("manageClasses.classSize")}
                value={classSize}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />

              {/* Homeroom Teacher */}
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  -- {t("manageClasses.selectHomeroomTeacher")} --
                </option>
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName}
                  </option>
                ))}
              </select>

              {/* Semesters */}
              <div>
                <label className="block font-semibold mb-2 dark:text-gray-100">
                  {t("manageClasses.semesters")}
                </label>
                <div className="overflow-x-auto border rounded-lg border-gray-300 dark:border-gray-600">
                  <table className="w-full text-sm text-gray-800 dark:text-gray-100">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2">
                          {t("manageClasses.table.semesterNumber")}
                        </th>
                        <th className="px-3 py-2">
                          {t("manageClasses.table.startDate")}
                        </th>
                        <th className="px-3 py-2">
                          {t("manageClasses.table.endDate")}
                        </th>
                        <th className="px-3 py-2">
                          {t("manageClasses.table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableSemesters.map((sem, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 dark:border-gray-700"
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
                                updateSemester(idx, "beginDate", e.target.value)
                              }
                              className="px-2 py-1 border rounded w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={sem.endDate}
                              onChange={(e) =>
                                updateSemester(idx, "endDate", e.target.value)
                              }
                              className="px-2 py-1 border rounded w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeSemester(idx)}
                              className="text-red-600 hover:underline"
                            >
                              <Trash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    onClick={addSemester}
                    className="mt-2 px-3 py-2 rounded-lg  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    + {t("manageClasses.addSemester")}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Subjects */}
            <div className="space-y-4 flex flex-col overflow-y-auto">
              <label className="block font-semibold dark:text-gray-100">
                {t("manageClasses.subjects")}
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
                              { subjectId: subj.subjectId, teacherId: null },
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
                        disabled={!selected}
                        className="px-2 py-1 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      >
                        <option value="">
                          {t("manageClasses.selectTeacher")}
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

            {/* Action Buttons */}
            <div className="col-span-2 flex justify-end gap-2 mt-4">
              {/* <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {t("manageClasses.cancel")}
              </button> */}
              <button
                type="submit"
                form="classForm"
                className="px-4 py-2 bg-green-700 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {modalType === "add"
                  ? t("manageClasses.saveClass")
                  : t("manageClasses.saveChanges")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedClass && (
        <Modal title="Xác nhận xóa" onClose={closeModal}>
          <p className="text-gray-900 dark:text-gray-100">
            Bạn có chắc chắn muốn xóa <strong>{selectedClass.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => handleDelete(selectedClass.classId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageClassesAdmin;
