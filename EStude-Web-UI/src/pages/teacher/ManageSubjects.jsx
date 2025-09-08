import React, { useEffect, useState } from "react";
import { PlusCircle, Edit2, Trash2, User, FileText, Eye } from "lucide-react";
import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";

export default function ManageSubjects() {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [newStudentId, setNewStudentId] = useState("");
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    dueDate: "",
    description: "",
    type: "essay",
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const result = await subjectService.getAllSubjects();
        if (result) {
          const filtered = result.filter((s) =>
            s.schools?.some((sch) => sch.schoolId === schoolId)
          );
          setSubjects(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi lấy môn học:", error);
      }
    };
    fetchSubjects();
  }, [schoolId]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedSubject(null);
  };

  const handleSaveSubject = async () => {
    if (!name) {
      showToast("Vui lòng nhập tên môn học.", "warn");
      return;
    }
    const payload = { name, description, schoolId };
    try {
      const result = await subjectService.addSubject(payload);
      if (result) {
        if (selectedSubject) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === selectedSubject.id
                ? {
                    ...s,
                    name: result.name,
                    description: result.description || "",
                  }
                : s
            )
          );
          showToast("Cập nhật môn học thành công!", "success");
        } else {
          setSubjects((prev) => [
            ...prev,
            {
              id: result.id || Date.now(),
              name: result.name,
              description: result.description || "",
            },
          ]);
          showToast("Thêm môn học thành công!", "success");
        }
        setIsFormOpen(false);
        resetForm();
      } else {
        showToast("Lỗi khi lưu môn học!", "error");
      }
    } catch (error) {
      console.error("Lỗi khi lưu môn học:", error);
      showToast("Lỗi khi lưu môn học!", "error");
    }
  };

  const handleDeleteSubject = (id) => {
    if (window.confirm("Xoá môn học này?")) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleAddStudent = () => {
    if (!newStudentId) return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? { ...s, students: [...(s.students || []), newStudentId] }
          : s
      )
    );
    setNewStudentId("");
  };

  const handleRemoveStudent = (id) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? { ...s, students: s.students.filter((st) => st !== id) }
          : s
      )
    );
  };

  const handleAddAssignment = () => {
    if (
      !newAssignment.title ||
      (!newAssignment.dueDate && newAssignment.type === "essay")
    )
      return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? {
              ...s,
              assignments: [
                ...(s.assignments || []),
                { ...newAssignment, id: Date.now() },
              ],
            }
          : s
      )
    );
    setNewAssignment({
      title: "",
      dueDate: "",
      description: "",
      type: "essay",
    });
  };

  const handleRemoveAssignment = (id) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? { ...s, assignments: s.assignments.filter((a) => a.id !== id) }
          : s
      )
    );
  };

  return (
    <div className="p-6 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý môn học</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Quản lý môn học giúp giáo viên tổ chức và quản lý điểm danh, bài tập
            và đánh giá học sinh.
          </p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            resetForm();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          <PlusCircle size={16} />
          Thêm mới môn học
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow max-w-4xl mx-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                Tên môn
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                Mô tả
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="p-3 border-b border-gray-200 dark:border-gray-600">
                    {subject.name}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-600">
                    {subject.description}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex gap-5">
                      <button
                        className="flex items-center gap-1 text-blue-600"
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setName(subject.name);
                          setDescription(subject.description || "");
                          setIsFormOpen(true);
                        }}
                      >
                        <Eye size={16} /> Xem
                      </button>
                      <button
                        className="flex items-center gap-1 text-yellow-500"
                        title="Sửa"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setName(subject.name);
                          setDescription(subject.description || "");
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 size={16} /> Sửa
                      </button>
                      <button
                        className="flex items-center gap-1 text-red-500"
                        title="Xóa"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="p-4 text-center text-gray-500 dark:text-gray-400"
                >
                  Chưa có môn học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit Subject */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedSubject ? "Sửa môn học" : "Thêm môn học"}
            </h2>
            <input
              type="text"
              placeholder="Tên môn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-gray-700"
            />
            <textarea
              placeholder="Mô tả môn học"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-gray-700 min-h-[80px]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSubject}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                <PlusCircle size={16} />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
