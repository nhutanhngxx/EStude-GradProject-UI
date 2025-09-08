import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Eye, CheckSquare } from "lucide-react";
import studentService from "../../services/studentService";
import enrollmentService from "../../services/enrollmentService";

import { useToast } from "../../contexts/ToastContext";

const StudentManagement = ({ classId }) => {
  const { showToast } = useToast();
  const [editingStudent, setEditingStudent] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Load tất cả học sinh
  useEffect(() => {
    studentService.getAllStudents().then((res) => res && setAllStudents(res));
  }, []);

  // Load học sinh trong lớp
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await enrollmentService.getAllEnrollments();
        setAllEnrollments(res);
        const filtered = res
          .filter((e) => e.clazz.classId === classId)
          .map((e) => ({
            enrollmentId: e.enrollmentId,
            userId: e.student.userId,
            fullName: e.student.fullName,
            dob: e.student.dob,
            studentCode: e.student.studentCode,
            email: e.student.email,
          }));
        setStudentsInClass(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEnrollments();
  }, [classId]);

  const handleToggle = (userId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allStudents.map((s) => s.userId));
    }
    setSelectAll(!selectAll);
  };

  const handleEnroll = async () => {
    if (selectedStudentIds.length === 0)
      return showToast("Chọn ít nhất 01 học sinh để thêm vào lớp!", "warn");
    const newIds = selectedStudentIds.filter(
      (id) => !studentsInClass.find((s) => s.userId === id)
    );
    if (newIds.length === 0) {
      setSelectedStudentIds([]);
      return showToast("Các học sinh đã trong lớp!", "warn");
    }

    try {
      const enrollments = await enrollmentService.enrollStudentsBatch(
        classId,
        newIds
      );
      const newStudents = enrollments.map((en) => ({
        enrollmentId: en.enrollmentId,
        userId: en.student.userId,
        fullName: en.student.fullName,
        dob: en.student.dob,
        studentCode: en.student.studentCode,
        email: en.student.email,
      }));
      setStudentsInClass((prev) => [...prev, ...newStudents]);
      setSelectedStudentIds([]);
      showToast("Thêm học sinh vào lớp thành công!", "success");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi thêm học sinh vào lớp", "error");
    }
  };

  const handleRemove = async (enrollmentId) => {
    if (!confirm("Xóa học sinh khỏi lớp?")) return;
    const success = await enrollmentService.unenrollStudent(enrollmentId);
    if (success) {
      showToast("Xóa học sinh khỏi lớp thành công!", "error");
      setStudentsInClass((prev) =>
        prev.filter((s) => s.enrollmentId !== enrollmentId)
      );
    }
  };

  const handleRemoveMultiple = async () => {
    // if (selectedStudentIds.length === 0)
    //   return showToast("Chọn ít nhất 01 học sinh để xóa!", "warn");
    // if (!confirm("Xóa các học sinh đã chọn khỏi lớp?")) return;

    // for (const id of selectedStudentIds) {
    //   const student = studentsInClass.find((s) => s.userId === id);
    //   if (student)
    //     await enrollmentService.unenrollStudent(student.enrollmentId);
    // }

    // setStudentsInClass((prev) =>
    //   prev.filter((s) => !selectedStudentIds.includes(s.userId))
    // );
    showToast("Chức năng đang được phát triển!", "warn");
    // setSelectedStudentIds([]);
  };

  const filteredStudents = allStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Danh sách học sinh */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">
          Danh sách học sinh
        </h2>

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-100 transition"
          >
            <CheckSquare size={18} />
            {selectAll ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          <input
            type="text"
            placeholder="Tìm kiếm học sinh..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-80 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
          {filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Không tìm thấy học sinh
            </p>
          ) : (
            filteredStudents.map((s) => (
              <label
                key={s.userId}
                className="flex items-center gap-3 p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(s.userId)}
                  onChange={() => handleToggle(s.userId)}
                  className="mt-1 w-4 h-4 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{s.fullName}</p>
                  <p className="text-gray-500 text-sm">
                    {s.dob ? `Ngày sinh: ${s.dob}` : "Chưa có ngày sinh"}
                  </p>
                  <p className="text-xs text-gray-400">MSSV: {s.studentCode}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEnroll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            <PlusCircle size={18} /> Thêm vào lớp
          </button>
        </div>
      </div>

      {/* Học sinh trong lớp */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">
          Học sinh trong lớp
        </h2>

        <div className="border rounded-lg max-h-96 overflow-y-auto divide-y divide-gray-200 bg-white shadow-sm">
          {studentsInClass.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Chưa có học sinh nào
            </p>
          ) : (
            studentsInClass.map((s) => (
              <div
                key={s.enrollmentId}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
              >
                {/* Checkbox chọn học sinh */}
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-blue-600 mr-3"
                />

                {/* Thông tin học sinh */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {s.fullName}
                  </p>
                  <p className="text-gray-500 text-sm truncate">
                    {s.dob ? `Ngày sinh: ${s.dob}` : "Chưa có ngày sinh"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    MSSV: {s.studentCode}
                  </p>
                </div>

                {/* Nút hành động */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingStudent(s)}
                    className="flex items-center gap-1 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 transition"
                  >
                    <Eye size={16} /> Xem
                  </button>
                  <button
                    onClick={() => handleRemove(s.enrollmentId)}
                    className="flex items-center gap-1 text-red-600 px-3 py-1 rounded-md hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRemoveMultiple}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Xóa khỏi lớp
          </button>
        </div>
      </div>

      {/* Modal chỉnh sửa học sinh */}
      {editingStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thông tin học sinh</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editingStudent.fullName}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    fullName: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Họ và tên"
              />
              <input
                type="date"
                value={editingStudent.dob || ""}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, dob: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                value={editingStudent.studentCode}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    studentCode: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="MSSV"
              />
              <input
                type="email"
                value={editingStudent.email}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    email: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Email"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition"
              >
                Đóng
              </button>
              <button
                onClick={() => alert("Lưu thông tin")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
