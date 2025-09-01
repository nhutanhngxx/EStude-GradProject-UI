import { useEffect, useState } from "react";
import studentService from "../../services/studentService";

export default function ClassStudentModal({ classId, isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const fetchStudents = async () => {
      const result = await studentService.getStudentsByClass(classId);
      if (result) {
        setStudents(result);
        // Khởi tạo bảng điểm rỗng
        const initGrades = {};
        result.forEach((s) => {
          initGrades[s.id] = {
            gk: "",
            tk1: "",
            tk2: "",
            tk3: "",
            th1: "",
            th2: "",
            th3: "",
            ck: "",
          };
        });
        setGrades(initGrades);
      }
    };
    fetchStudents();
  }, [classId, isOpen]);

  const handleChange = (studentId, field, value) => {
    // Giữ nguyên kiểu string để input không nhảy linh tinh
    let newValue = value;

    let error = "";
    // Chỉ kiểm tra khi có dữ liệu nhập
    if (
      newValue !== "" &&
      (isNaN(Number(newValue)) || Number(newValue) < 0 || Number(newValue) > 10)
    ) {
      error = "Điểm phải từ 0 đến 10";
    }

    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: newValue, // giữ string
        [`${field}_error`]: error,
      },
    }));
  };

  const handleSave = () => {
    let hasError = false;
    const formattedGrades = {};

    Object.entries(grades).forEach(([studentId, g]) => {
      formattedGrades[studentId] = {};
      for (const key of [
        "gk",
        "tk1",
        "tk2",
        "tk3",
        "th1",
        "th2",
        "th3",
        "ck",
      ]) {
        if (g[`${key}_error`]) {
          hasError = true;
        }
        formattedGrades[studentId][key] = g[key] === "" ? null : Number(g[key]);
      }
    });

    if (hasError) {
      alert("Vui lòng sửa hết lỗi trước khi lưu!");
      return;
    }

    console.log("Điểm đã nhập:", formattedGrades);
    alert("Đã lưu điểm (mock)");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[95%] h-[90%] p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Danh sách học sinh
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Đóng
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border px-3 py-2">Tên học sinh</th>
                {["GK", "TK1", "TK2", "TK3", "TH1", "TH2", "TH3", "CK"].map(
                  (label) => (
                    <th key={label} className="border px-3 py-2">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{s.fullName}</td>
                  {["gk", "tk1", "tk2", "tk3", "th1", "th2", "th3", "ck"].map(
                    (field) => (
                      <td key={field} className="border px-2 py-1 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={grades[s.id]?.[field] ?? ""}
                          onChange={(e) =>
                            handleChange(s.id, field, e.target.value)
                          }
                          className={`w-14 px-1 py-0.5 border rounded text-center ${
                            grades[s.id]?.[`${field}_error`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {grades[s.id]?.[`${field}_error`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {grades[s.id][`${field}_error`]}
                          </p>
                        )}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Lưu điểm
          </button>
        </div>
      </div>
    </div>
  );
}
