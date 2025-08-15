import React, { useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserGraduate,
  FaTasks,
  FaEye,
} from "react-icons/fa";

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([
    {
      id: 1,
      code: "MTH101",
      name: "Mathematics",
      teacher: "Nguyễn Văn A",
      students: ["SV001", "SV002"],
      assignments: [],
    },
  ]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");

  // Student management
  const [newStudentId, setNewStudentId] = useState("");

  // Assignment management
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    dueDate: "",
    description: "",
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setTeacher("");
    setSelectedSubject(null);
  };

  const handleSaveSubject = () => {
    if (!code || !name || !teacher) {
      alert("Vui lòng nhập đầy đủ thông tin môn học.");
      return;
    }
    if (selectedSubject) {
      // Update
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === selectedSubject.id ? { ...s, code, name, teacher } : s
        )
      );
    } else {
      // Add new
      setSubjects((prev) => [
        ...prev,
        {
          id: Date.now(),
          code,
          name,
          teacher,
          students: [],
          assignments: [],
        },
      ]);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteSubject = (id) => {
    if (window.confirm("Xoá môn học này?")) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Students
  const handleAddStudent = () => {
    if (!newStudentId) return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? { ...s, students: [...s.students, newStudentId] }
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

  // Assignments
  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.dueDate) return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? {
              ...s,
              assignments: [
                ...s.assignments,
                { ...newAssignment, id: Date.now() },
              ],
            }
          : s
      )
    );
    setNewAssignment({ title: "", dueDate: "", description: "" });
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
    <div className="p-6 dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý môn học</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => {
            setIsFormOpen(true);
            resetForm();
          }}
        >
          <FaPlus /> Thêm môn học
        </button>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border-b border-gray-200 dark:border-gray-700">
                Mã môn
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-700">
                Tên môn
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-700">
                Giáo viên
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">
                Số HS
              </th>
              <th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">
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
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    {subject.code}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    {subject.name}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    {subject.teacher}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">
                    {subject.students.length}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center gap-3">
                      <button
                        className="text-yellow-500"
                        title="Sửa"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setCode(subject.code);
                          setName(subject.name);
                          setTeacher(subject.teacher);
                          setIsFormOpen(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="text-red-500"
                        title="Xoá"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <FaTrash />
                      </button>
                      <button
                        className="text-green-500"
                        title="Quản lý học sinh"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setIsStudentsOpen(true);
                        }}
                      >
                        <FaUserGraduate />
                      </button>
                      <button
                        className="text-purple-500"
                        title="Quản lý bài tập"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setIsAssignmentsOpen(true);
                        }}
                      >
                        <FaTasks />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
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
              placeholder="Mã môn"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Tên môn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Giáo viên phụ trách"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-gray-700"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsFormOpen(false)}>Hủy</button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={handleSaveSubject}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manage Students */}
      {isStudentsOpen && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Quản lý học sinh - {selectedSubject.name}
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Mã học sinh"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700"
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
                onClick={handleAddStudent}
              >
                Thêm
              </button>
            </div>
            <ul className="space-y-2">
              {selectedSubject.students.map((st) => (
                <li
                  key={st}
                  className="flex justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"
                >
                  {st}
                  <button
                    className="text-red-500"
                    onClick={() => handleRemoveStudent(st)}
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button onClick={() => setIsStudentsOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manage Assignments */}
      {isAssignmentsOpen && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl shadow-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">
              Quản lý bài tập - {selectedSubject.name}
            </h2>

            {/* Loại bài */}
            <label className="block mb-2 font-semibold">Loại bài</label>
            <select
              value={newAssignment.type}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, type: e.target.value })
              }
              className="w-full mb-4 px-4 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="essay">Bài tập / Bài thi tự luận</option>
              <option value="quiz">Bài thi trắc nghiệm</option>
            </select>

            {/* Tiêu đề */}
            <input
              type="text"
              placeholder="Tiêu đề"
              value={newAssignment.title}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, title: e.target.value })
              }
              className="w-full mb-4 px-4 py-2 border rounded-lg dark:bg-gray-700"
            />

            {/* Nếu là trắc nghiệm */}
            {newAssignment.type === "quiz" && (
              <>
                <label className="block mb-2 font-semibold">
                  Tải lên đề thi (Excel)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      file: e.target.files[0],
                    })
                  }
                  className="w-full mb-4"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      value={newAssignment.startTime}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      value={newAssignment.endTime}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Nếu là tự luận */}
            {newAssignment.type === "essay" && (
              <>
                <textarea
                  placeholder="Mô tả / Ghi chú"
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value,
                    })
                  }
                  className="w-full mb-4 px-4 py-2 border rounded-lg dark:bg-gray-700 min-h-[100px]"
                />
                <label className="block mb-2 font-semibold">Hạn nộp</label>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full mb-4 px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
                <label className="block mb-2 font-semibold">
                  Tệp đính kèm (tuỳ chọn)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      file: e.target.files[0],
                    })
                  }
                  className="w-full mb-4"
                />
              </>
            )}

            {/* Nút thêm */}
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
              onClick={handleAddAssignment}
            >
              Lưu bài
            </button>

            {/* Danh sách bài */}
            <ul className="mt-6 space-y-2">
              {selectedSubject.assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div>
                    <strong>{a.title}</strong>{" "}
                    <span className="text-sm text-gray-500">({a.type})</span>
                    {a.type === "quiz" && (
                      <div className="text-xs text-gray-500">
                        {a.startTime} → {a.endTime}
                      </div>
                    )}
                    {a.type === "essay" && (
                      <div className="text-xs text-gray-500">
                        Hạn: {a.dueDate}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleRemoveAssignment(a.id)}
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>

            {/* Nút đóng */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsAssignmentsOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
