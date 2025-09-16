import React, { useEffect, useState, useRef } from "react";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  UploadCloud,
  Download,
} from "lucide-react";
import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ManageSubjects() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // file input ref (ẩn)
  const fileInputRef = useRef();

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

    // Kiểm tra trùng tên trong danh sách môn học hiện tại (cùng schoolId)
    const isDuplicate = subjects.some(
      (s) =>
        s.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (!selectedSubject || s.id !== selectedSubject.id)
    );
    if (isDuplicate) {
      showToast("Môn học này đã tồn tại trong trường của bạn.", "error");
      return;
    }

    try {
      let result;
      if (selectedSubject) {
        // --- Update ---
        result = await subjectService.updateSubject({
          subjectId: selectedSubject.subjectId,
          name,
          description,
          schoolId,
        });
        if (result) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.subjectId === selectedSubject.subjectId
                ? {
                    ...s,
                    name: result.name,
                    description: result.description || "",
                  }
                : s
            )
          );

          showToast("Cập nhật môn học thành công!", "success");
        }
      } else {
        // --- Add new ---
        result = await subjectService.addSubject({
          name,
          description,
          schoolId,
        });
        if (result) {
          setSubjects((prev) => [
            ...prev,
            {
              subjectId: result.subjectId,
              name: result.name,
              description: result.description || "",
            },
          ]);
          showToast("Thêm môn học thành công!", "success");
        }
      }

      if (result) {
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

  const handleDeleteSubject = async (subjectId) => {
    const ok = await confirm(
      "Xóa môn học vĩnh viễn!",
      "Việc xoá môn học sẽ ảnh hưởng tới hệ thống (lớp học, bài tập, thống kê...). Bạn có chắc chắn?"
    );

    if (!ok) return;

    const success = await subjectService.deleteSubject(subjectId);
    if (success) {
      setSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
      showToast("Xoá môn học thành công", "success");
    } else {
      showToast("Xoá môn học thất bại", "error");
    }
  };

  // ---------------- Excel template & import/export ----------------

  // Tạo workbook mẫu và trigger download (xlsx)
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["name", "description"],
      ["Toán", "Môn Toán chương trình THPT"],
      ["Văn", "Ngữ văn chương trình THPT"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "SubjectsTemplate");
    XLSX.writeFile(wb, "subjects-template.xlsx");
  };

  // Xử lý file khi người dùng chọn
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // json is an array of objects where keys are header names
      const rows = json.map((row, idx) => ({
        rowIndex: idx + 2,
        name: (row.name || row.Name || "").toString().trim(),
        description: (row.description || row.Description || "")
          .toString()
          .trim(),
        schoolId: schoolId, // luôn lấy từ user đang đăng nhập
      }));

      // Validate rows
      const invalid = rows.filter((r) => !r.name);
      if (invalid.length > 0) {
        showToast(
          `Có ${invalid.length} dòng thiếu tên môn (ví dụ: dòng ${invalid
            .slice(0, 3)
            .map((r) => r.rowIndex)
            .join(", ")}...). Vui lòng kiểm tra file.`,
          "error"
        );
        e.target.value = null;
        return;
      }

      // Lọc trùng tên với subjects trong state
      const duplicates = rows.filter((r) =>
        subjects.some(
          (s) => s.name.trim().toLowerCase() === r.name.trim().toLowerCase()
        )
      );

      if (duplicates.length > 0) {
        showToast(
          `Có ${duplicates.length} môn đã tồn tại (ví dụ: ${duplicates
            .slice(0, 3)
            .map((d) => d.name)
            .join(", ")}...). Chúng sẽ bị bỏ qua.`,
          "warn"
        );
      }

      // Chỉ giữ lại môn chưa có để import
      const rowsToImport = rows.filter(
        (r) =>
          !subjects.some(
            (s) => s.name.trim().toLowerCase() === r.name.trim().toLowerCase()
          )
      );

      if (rowsToImport.length === 0) {
        showToast("Không có môn học mới nào để import.", "info");
        e.target.value = null;
        return;
      }

      // if (
      //   !window.confirm(
      //     `Import ${rowsToImport.length} môn học mới từ file Excel?`
      //   )
      // ) {
      //   e.target.value = null;
      //   return;
      // }

      showToast("Đang import... Vui lòng chờ.", "info");
      const added = [];
      for (const r of rowsToImport) {
        try {
          const payload = {
            name: r.name,
            description: r.description,
            schoolId,
          };
          const res = await subjectService.addSubject(payload);
          if (res) added.push(res);
        } catch (err) {
          console.error("Error adding subject row:", r, err);
        }
      }

      if (added.length > 0) {
        setSubjects((prev) => [
          ...prev,
          ...added.map((res) => ({
            id: res.id || Date.now() + Math.random(),
            name: res.name,
            description: res.description || "",
          })),
        ]);
        showToast(`Import thành công ${added.length} môn học.`, "success");
      } else {
        showToast("Không có môn học nào được thêm.", "warn");
      }

      e.target.value = null;
    } catch (error) {
      console.error("Lỗi khi đọc file Excel:", error);
      showToast("Lỗi khi đọc file Excel. Kiểm tra định dạng file.", "error");
      e.target.value = null;
    }
  };

  // ---------------- Chart data ----------------
  const chartData = {
    labels: subjects.map((s) => s.name), // tên môn học
    datasets: [
      {
        label: "Số lớp được phân",
        data: subjects.map((s) => s.classes?.length || 0), // số lớp
        // không đặt màu cứng nếu bạn muốn chart.js pick defaults, nhưng trước đó bạn dùng hex
        backgroundColor: "#3b82f6",
      },
    ],
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
        <div className="flex gap-3">
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

          {/* Download mẫu */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            title="Tải file mẫu Excel"
          >
            <Download size={16} />
            Tải file mẫu
          </button>

          {/* Import file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            title="Import file Excel"
          >
            <UploadCloud size={16} />
            Import Excel
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Table */}
        <div className="flex-1 overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                  Tên môn
                </th>
                {/* <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                  Mô tả
                </th> */}
                <th className="p-3 border-b border-gray-200 dark:border-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.length > 0 ? (
                [...subjects] // copy để không mutate state trực tiếp
                  .sort((a, b) => a.name.localeCompare(b.name, "vi")) // sort theo tên, có hỗ trợ tiếng Việt
                  .map((subject) => (
                    <tr
                      key={subject.subjectId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3 border-b border-gray-200 dark:border-gray-600">
                        {subject.name}
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
                            className="flex items-center gap-1 text-red-500"
                            title="Xóa"
                            onClick={() =>
                              handleDeleteSubject(subject.subjectId)
                            }
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

        {/* Right: Chart */}
        <div className="flex-1 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Thống kê số lớp phân cho môn học
          </h2>
          {subjects.length > 0 ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true, stepSize: 1 } },
              }}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu để hiển thị biểu đồ.
            </p>
          )}
        </div>
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
                <PlusCircle size={16} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
