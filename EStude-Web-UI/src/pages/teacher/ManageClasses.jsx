import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaEye, FaTrash } from "react-icons/fa";
import classService from "../../services/classService";
import classSubjectService from "../../services/classSubjectService";
import teacherService from "../../services/teacherService";
import subjectService from "../../services/subjectService";
import StudentManagement from "./StudentManagement";

const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-1/2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✖
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

const formatTerm = (termNumber, beginDate, endDate) => {
  if (!termNumber || !beginDate || !endDate) return "";
  const beginYear = new Date(beginDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return `HK${termNumber} ${beginYear}-${endYear}`;
};

const ManageClasses = () => {
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [termNumber, setTermNumber] = useState("");
  const [classSize, setClassSize] = useState(0);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [school, setSchool] = useState(null);
  const [beginDate, setBeginDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Lấy schoolId từ user
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await subjectService.getAllSubjects();
      if (result) setSubjects(result);
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      const result = await teacherService.getAllTeachers();
      // Lọc các teachers có trùng schoolId với user
      const filtered = result.filter((t) => t.school?.schoolId === schoolId);
      if (filtered) setTeachers(filtered);
    };
    fetchTeachers();
  }, [schoolId]);

  useEffect(() => {
    const fetchClassesWithSubjects = async () => {
      const allClasses = await classService.getClassesBySchoolId(schoolId);
      // console.log("[DEBUG] classes by school:", allClasses);
      if (!allClasses) return;
      const allClassSubjects = await classSubjectService.getAllClassSubjects();
      // console.log("[DEBUG] allClassSubjects:", allClassSubjects);
      const classesWithSubjects = allClasses.map((cls) => {
        const subjectsForClass = allClassSubjects
          .filter((cs) => cs.clazz.classId === cls.classId)
          .map((cs) => ({
            classSubjectId: cs.classSubjectId,
            subjectId: cs.subject.subjectId,
            name: cs.subject.name,
            teacherId: cs.teacher?.userId ?? null,
            teacherName: cs.teacher?.fullName ?? null,
          }));
        return { ...cls, subjects: subjectsForClass };
      });
      // console.log("[DEBUG] classesWithSubjects:", classesWithSubjects);
      setClasses(classesWithSubjects);
    };
    fetchClassesWithSubjects();
  }, [schoolId]);

  const openModal = (type, cls = null) => {
    setSelectedClass(cls);
    setModalType(type);

    if (type === "add") {
      setName("");
      setTerm("");
      setClassSize(0);
      setSelectedSubjects([]);
      setSelectedTeacher("");
      setSchool(schoolId);
    } else if (type === "edit" && cls) {
      setName(cls.name);
      setTerm(cls.term || "");
      setClassSize(cls.classSize || 0);

      // Map subjects của lớp thành selectedSubjects
      setSelectedSubjects(
        cls.subjects?.map((s) => ({
          classSubjectId: s.classSubjectId,
          subjectId: s.subjectId,
          teacherId: s.teacherId ?? null,
        })) || []
      );

      // Set giáo viên chủ nhiệm nếu có
      setSelectedTeacher(cls.homeroomTeacher?.userId ?? "");
    }
  };

  const closeModal = () => {
    setSelectedClass(null);
    setModalType(null);
  };

  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      const allClasses = await classService.getClassesBySchoolId(schoolId);
      if (!allClasses) return;

      const allClassSubjects = await classSubjectService.getAllClassSubjects();

      const classesWithSubjects = allClasses.map((cls) => {
        const subjectsForClass = allClassSubjects
          .filter((cs) => cs.clazz.classId === cls.classId)
          .map((cs) => ({
            classSubjectId: cs.classSubjectId,
            subjectId: cs.subject.subjectId,
            name: cs.subject.name,
            teacherId: cs.teacher?.userId ?? null,
            teacherName: cs.teacher?.fullName ?? null,
          }));
        return { ...cls, subjects: subjectsForClass };
      });

      setClasses(classesWithSubjects);
    } catch (error) {
      console.error("Lỗi khi load lớp và môn:", error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchClassesWithSubjects();
  }, [fetchClassesWithSubjects]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return alert("Vui lòng nhập tên lớp");
    const calculatedTerm = formatTerm(termNumber, beginDate, endDate);
    try {
      const classPayload = {
        name,
        term: calculatedTerm,
        classSize,
        schoolId,
        beginDate,
        endDate,
      };
      const classResult = await classService.addClass(classPayload);
      if (!classResult?.classId) throw new Error("Không thêm được lớp");

      if (selectedSubjects.length > 0) {
        for (const subj of selectedSubjects) {
          await classSubjectService.addClassSubject({
            classId: classResult.classId,
            subjectId: subj.subjectId,
            teacherId: subj.teacherId ?? null,
          });
        }
      }

      await fetchClassesWithSubjects();

      closeModal();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu lớp!");
    }
  };

  const handleDelete = (classId) => {
    setClasses(classes.filter((c) => c.classId !== classId));
    closeModal();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý lớp học</h1>
          <p className="text-gray-600">
            Quản lý lớp học là một công cụ giúp giáo viên tổ chức và quản lý tất
            cả các khía cạnh của một lớp học, từ điểm danh, giao bài tập đến
            đánh giá học sinh.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Thêm lớp mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-[600px] w-full table-fixed text-sm text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-[20%]">Tên lớp học</th>
              <th className="px-4 py-3 w-[15%]">Học kì</th>
              <th className="px-4 py-3 w-[30%]">Quản lý môn học</th>
              <th className="px-4 py-3 w-[25%]">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.classId} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">{c.term || "-"}</td>
                <td className="px-4 py-2">
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
                <td className="px-4 py-2 flex flex-wrap gap-4">
                  <button
                    onClick={() => openModal("edit", c)}
                    className="text-blue-600 hover:underline"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => openModal("students", c)}
                    className="text-green-600 hover:underline"
                  >
                    Quản lý học sinh
                  </button>
                  <button
                    onClick={() => openModal("delete", c)}
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

      {/* Modal Manage Students */}
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
          title={modalType === "add" ? "Thêm lớp mới" : "Xem chi tiết lớp"}
          onClose={closeModal}
        >
          <form className="space-y-4" onSubmit={handleSave}>
            <input
              type="text"
              placeholder="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block mb-2">Học kì</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Số học kì"
                  value={termNumber}
                  onChange={(e) => setTermNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex-1">
                <label className="block mb-2">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={beginDate}
                  onChange={(e) => setBeginDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex-1">
                <label className="block mb-2">Ngày kết thúc</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Hiển thị term tự động */}
            <p className="mt-2 text-gray-600">
              Học kỳ:{" "}
              {termNumber && beginDate && endDate
                ? `HK${termNumber} ${new Date(
                    beginDate
                  ).getFullYear()}-${new Date(endDate).getFullYear()}`
                : "-"}
            </p>

            <input
              type="number"
              placeholder="Class Size"
              value={classSize}
              disabled
              onChange={(e) => setClassSize(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
            />

            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">-- Chọn giáo viên chủ nhiệm --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-64 overflow-y-auto border p-2 rounded-lg">
              {subjects.map((subj) => {
                const selected = selectedSubjects.find(
                  (s) => s.subjectId === subj.subjectId
                );

                return (
                  <div key={subj.subjectId} className="flex items-center gap-2">
                    {/* Checkbox chọn môn */}
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
                    <span className="flex-1">{subj.name}</span>

                    {/* Select giáo viên cho môn */}
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Delete */}
      {modalType === "delete" && selectedClass && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>
            Are you sure you want to delete{" "}
            <strong>{selectedClass.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(selectedClass.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageClasses;
