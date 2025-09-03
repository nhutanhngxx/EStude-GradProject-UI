import { useEffect, useState } from "react";
import { User, Check, X, Clock } from "lucide-react";
import studentService from "../../services/studentService";

export default function AttendanceModal({ classId, isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (!isOpen || !classId) return;

    const fetchStudents = async () => {
      try {
        const result = await studentService.getStudentsByClass(classId);
        if (result) {
          setStudents(result);

          // Khởi tạo mặc định = PRESENT
          setAttendance((prev) => {
            const next = { ...prev };
            result.forEach((s) => {
              const id = s.userId;
              if (!(id in next)) {
                next[id] = "PRESENT";
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Lỗi tải danh sách học sinh:", err);
      }
    };

    fetchStudents();
  }, [isOpen, classId]);

  const cycleAttendance = (userId) => {
    setAttendance((prev) => {
      const current = prev[userId];
      let nextStatus = "PRESENT";
      if (current === "PRESENT") nextStatus = "LATE";
      else if (current === "LATE") nextStatus = "ABSENT";
      else nextStatus = "PRESENT";
      return {
        ...prev,
        [userId]: nextStatus,
      };
    });
  };

  const handleSave = async () => {
    try {
      const records = students.map((s) => ({
        studentId: s.userId,
        status: attendance[s.userId],
      }));

      console.log("📌 Gửi dữ liệu điểm danh:", records);

      // TODO: call API: teacherService.saveAttendance(classId, records)

      onClose();
    } catch (err) {
      console.error("Lỗi lưu điểm danh:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-[75%] h-[70%] p-6 overflow-auto z-10 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <User className="text-blue-600" size={22} />
            Điểm danh lớp
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full border border-gray-200 dark:border-gray-700 table-fixed">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 w-1/4 text-left">Mã SV</th>
                <th className="px-4 py-2 w-2/4 text-left">Tên sinh viên</th>
                <th className="px-4 py-2 w-1/4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const id = s.userId;
                const status = attendance[id];

                let btnClass = "";
                let label = "";
                let icon = null;

                if (status === "PRESENT") {
                  btnClass =
                    "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300";
                  label = "Có mặt";
                  icon = <Check size={16} />;
                } else if (status === "LATE") {
                  btnClass =
                    "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300";
                  label = "Trễ";
                  icon = <Clock size={16} />;
                } else {
                  btnClass =
                    "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300";
                  label = "Vắng";
                  icon = <X size={16} />;
                }

                return (
                  <tr key={id} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2 truncate">
                      {s.studentCode ?? `SV${id}`}
                    </td>
                    <td className="px-4 py-2 truncate">{s.fullName}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => cycleAttendance(id)}
                        className={`px-3 py-1 rounded-lg flex items-center gap-1 w-28 justify-center transition ${btnClass}`}
                      >
                        {icon}
                        {label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Check size={18} />
            Lưu điểm danh
          </button>
        </div>
      </div>
    </div>
  );
}
