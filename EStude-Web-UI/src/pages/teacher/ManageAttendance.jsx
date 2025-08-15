import React, { useState } from "react";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";

export default function ManageAttendance() {
  const [classes] = useState([
    { id: 1, name: "Lớp 10A1", subject: "Toán" },
    { id: 2, name: "Lớp 11B2", subject: "Vật lý" },
    { id: 3, name: "Lớp 12C3", subject: "Hóa học" },
  ]);
  const [students] = useState({
    1: [
      { id: 101, name: "Nguyễn Văn A" },
      { id: 102, name: "Trần Thị B" },
      { id: 103, name: "Lê Văn C" },
    ],
    2: [
      { id: 201, name: "Phạm Văn D" },
      { id: 202, name: "Ngô Thị E" },
    ],
    3: [
      { id: 301, name: "Hoàng Văn F" },
      { id: 302, name: "Đỗ Thị G" },
    ],
  });

  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [note, setNote] = useState({});

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    console.log("Lưu điểm danh:", {
      classId: selectedClass,
      data: attendance,
      note,
    });
    alert("Điểm danh đã được lưu!");
    setSelectedClass(null);
    setAttendance({});
    setNote({});
  };

  return (
    <div className="p-6">
      {!selectedClass ? (
        // Danh sách lớp
        <div>
          <h1 className="text-2xl font-bold mb-6">
            Danh sách lớp đang giảng dạy
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold">{cls.name}</h2>
                  <p className="text-gray-500">{cls.subject}</p>
                </div>
                <button
                  onClick={() => setSelectedClass(cls.id)}
                  className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  <FaClipboardList className="inline mr-2" />
                  Điểm danh
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Màn hình điểm danh
        <div>
          <h1 className="text-2xl font-bold mb-4">
            Điểm danh - {classes.find((c) => c.id === selectedClass)?.name}
          </h1>
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-3 text-left">Họ và tên</th>
                <th className="p-3 text-center">Có mặt</th>
                <th className="p-3 text-center">Vắng</th>
                <th className="p-3 text-center">Muộn</th>
                <th className="p-3 text-left">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {students[selectedClass]?.map((stu) => (
                <tr key={stu.id} className="border-t dark:border-gray-700">
                  <td className="p-3">{stu.name}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleStatusChange(stu.id, "present")}
                      className={`${
                        attendance[stu.id] === "present"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <FaCheckCircle size={20} />
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleStatusChange(stu.id, "absent")}
                      className={`${
                        attendance[stu.id] === "absent"
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      <FaTimesCircle size={20} />
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleStatusChange(stu.id, "late")}
                      className={`${
                        attendance[stu.id] === "late"
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }`}
                    >
                      <FaClock size={20} />
                    </button>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      placeholder="Nhập ghi chú..."
                      value={note[stu.id] || ""}
                      onChange={(e) =>
                        setNote((prev) => ({
                          ...prev,
                          [stu.id]: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border rounded-lg dark:bg-gray-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setSelectedClass(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Quay lại
            </button>
            <button
              onClick={handleSaveAttendance}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Lưu điểm danh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
