import React, { useState, useEffect } from "react";
import studentService from "../../services/studentService";
import enrollmentService from "../../services/enrollmentService";

const StudentManagement = ({ classId }) => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]); // Học sinh trong lớp
  const [allStudents, setAllStudents] = useState([]); // Học sinh từ DB
  const [selectedStudentIds, setSelectedStudentIds] = useState([]); // Checkbox chọn nhiều
  const [searchText, setSearchText] = useState("");

  // Load tất cả học sinh từ DB
  useEffect(() => {
    const fetchAllStudents = async () => {
      const result = await studentService.getAllStudents();
      if (result) setAllStudents(result);
    };
    fetchAllStudents();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (error) {
        console.error("Lỗi khi load enrollments:", error);
      }
    };

    fetchData();
  }, [classId]);

  // Toggle checkbox chọn học sinh
  const handleToggle = (userId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Enroll nhiều học sinh vào lớp
  const handleEnroll = async () => {
    if (selectedStudentIds.length === 0)
      return alert("Chọn ít nhất 1 học sinh");

    // Lọc ra học sinh chưa có trong lớp
    const newStudentIds = selectedStudentIds.filter(
      (id) => !studentsInClass.find((s) => s.userId === id)
    );
    if (newStudentIds.length === 0) {
      setSelectedStudentIds([]);
      return alert("Những học sinh này đã có trong lớp");
    }

    try {
      // Enroll từng học sinh -> API trả về enrollment object
      const enrollments = await enrollmentService.enrollStudentsBatch(
        classId,
        newStudentIds
      );

      // Convert dữ liệu API về đúng format để render
      const newStudents = enrollments.map((en) => ({
        enrollmentId: en.enrollmentId,
        userId: en.student.userId,
        fullName: en.student.fullName,
        dob: en.student.dob,
        studentCode: en.student.studentCode,
        email: en.student.email,
      }));

      // Thêm vào state
      setStudentsInClass((prev) => [...prev, ...newStudents]);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi thêm học sinh vào lớp");
    }
  };

  // Xóa học sinh khỏi lớp
  const handleRemove = async (enrollmentId) => {
    if (!confirm("Bạn có chắc muốn xóa học sinh khỏi lớp này?")) return;
    const success = await enrollmentService.unenrollStudent(enrollmentId);
    if (success) {
      setStudentsInClass((prev) =>
        prev.filter((e) => e.enrollmentId !== enrollmentId)
      );
    }
  };

  // Lưu chỉnh sửa thông tin học sinh
  const handleSaveEdit = async () => {
    //     try {
    //       const updated = await studentService.updateStudent(
    //         editingStudent.userId,
    //         editingStudent
    //       );
    //       if (updated) {
    //         setStudentsInClass((prev) =>
    //           prev.map((s) =>
    //             s.userId === updated.userId ? { ...s, ...updated } : s
    //           )
    //         );
    //         setEditingStudent(null);
    //       }
    //     } catch (error) {
    //       console.error("Lỗi khi cập nhật học sinh:", error);
    //       alert("Cập nhật thất bại");
    //     }
  };

  // Lọc học sinh theo tìm kiếm
  const filteredStudents = allStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Cột trái - tất cả học sinh */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">
          Danh sách học sinh
        </h2>

        <input
          type="text"
          placeholder="Tìm kiếm học sinh..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="max-h-80 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
          {filteredStudents.length === 0 && (
            <p className="text-gray-500 text-center py-6">
              Không tìm thấy học sinh
            </p>
          )}
          {filteredStudents.map((s) => (
            <label
              key={s.userId}
              className="flex items-start gap-3 p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
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
          ))}
        </div>

        <button
          onClick={handleEnroll}
          className="w-full px-6 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition-colors duration-200"
        >
          Thêm vào lớp
        </button>
      </div>

      {/* Cột phải - học sinh trong lớp */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">
          Học sinh trong lớp
        </h2>

        <div className="border rounded-lg max-h-96 overflow-y-auto divide-y">
          {studentsInClass.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Chưa có học sinh nào
            </p>
          ) : (
            studentsInClass.map((s) => (
              <div
                key={s.enrollmentId}
                className="flex justify-between items-center p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{s.fullName}</p>
                  <p className="text-gray-500 text-sm">
                    {s.dob ? `Ngày sinh: ${s.dob}` : "Chưa có ngày sinh"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingStudent(s)}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => handleRemove(s.enrollmentId)}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal chỉnh sửa học sinh */}
      {editingStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
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
                className="px-4 py-2 rounded-lg border"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
