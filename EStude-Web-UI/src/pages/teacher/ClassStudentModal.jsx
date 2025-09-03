import { useEffect, useState } from "react";
import { X, ListChecks } from "lucide-react";
import studentService from "../../services/studentService";

export default function ClassStudentModal({ classId, isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const fetchStudents = async () => {
      const result = await studentService.getStudentsByClass(classId);
      console.log("result:", result);

      if (result) {
        setStudents(result);

        // Khởi tạo bảng điểm rỗng
        const initGrades = {};
        result.forEach((s) => {
          initGrades[s.userId] = {
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

  const handleChange = (userId, field, value) => {
    let newValue = value;
    let error = "";

    if (
      newValue !== "" &&
      (isNaN(Number(newValue)) || Number(newValue) < 0 || Number(newValue) > 10)
    ) {
      error = "Điểm phải từ 0 đến 10";
    }

    setGrades((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: newValue,
        [`${field}_error`]: error,
      },
    }));
  };

  const handleSave = () => {
    let hasError = false;
    const formattedGrades = {};

    Object.entries(grades).forEach(([userId, g]) => {
      formattedGrades[userId] = {};
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
        formattedGrades[userId][key] = g[key] === "" ? null : Number(g[key]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[70%] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <ListChecks className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold">Danh sách học sinh</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-4">
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
                  <tr key={s.userId} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{s.fullName}</td>
                    {["gk", "tk1", "tk2", "tk3", "th1", "th2", "th3", "ck"].map(
                      (field) => (
                        <td
                          key={field}
                          className="border px-2 py-1 text-center"
                        >
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grades[s.userId]?.[field] ?? ""}
                            onChange={(e) =>
                              handleChange(s.userId, field, e.target.value)
                            }
                            className={`w-14 px-1 py-0.5 border rounded text-center ${
                              grades[s.userId]?.[`${field}_error`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {grades[s.userId]?.[`${field}_error`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {grades[s.userId][`${field}_error`]}
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
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              onClick={onClose}
            >
              Huỷ
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSave}
            >
              Lưu điểm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
