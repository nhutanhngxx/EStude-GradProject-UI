import React, { useEffect, useState, useRef } from "react";
import {
  PlusCircle,
  Edit2,
  Trash2,
  UploadCloud,
  Download,
  X,
  Eye,
} from "lucide-react";

import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import * as XLSX from "xlsx";

export default function ManageSubjects() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const isAdmin = user.admin === true;

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true); // ĐÃ THÊM
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const result = await subjectService.getAllSubjects();
        if (result) {
          const filtered = isAdmin
            ? result
            : result.filter((s) =>
                s.schools?.some((sch) => sch.schoolId === schoolId)
              );
          setSubjects(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi lấy môn học:", error);
        showToast("Lỗi khi tải danh sách môn học!", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [schoolId, showToast, isAdmin]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedSubject(null);
  };

  // ĐÃ THÊM hàm openModal
  const openModal = (action, subject = null) => {
    if (action === "add") {
      resetForm();
      setIsFormOpen(true);
    } else if (action === "view" && subject) {
      setSelectedSubject(subject);
      setName(subject.name);
      setDescription(subject.description || "");
      setIsFormOpen(true);
    } else if (action === "delete" && subject) {
      handleDeleteSubject(subject.subjectId);
    }
  };

  const handleSaveSubject = async () => {
    if (!name.trim()) {
      showToast("Vui lòng nhập tên môn học.", "warn");
      return;
    }

    const isDuplicate = subjects.some(
      (s) =>
        s.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (!selectedSubject || s.subjectId !== selectedSubject.subjectId)
    );
    if (isDuplicate) {
      showToast(`Môn học "${name}" đã tồn tại.`, "error");
      return;
    }

    try {
      let result;
      if (selectedSubject) {
        const payload = isAdmin
          ? { subjectId: selectedSubject.subjectId, name, description }
          : {
              subjectId: selectedSubject.subjectId,
              name,
              description,
              schoolId,
            };
        result = await subjectService.updateSubject(payload);
      } else {
        const payload = isAdmin
          ? { name, description }
          : { name, description, schoolId };
        result = await subjectService.addSubject(payload);
      }

      if (result) {
        if (selectedSubject) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.subjectId === result.subjectId
                ? {
                    ...s,
                    name: result.name,
                    description: result.description || "",
                  }
                : s
            )
          );
          showToast("Cập nhật thành công!", "success");
        } else {
          setSubjects((prev) => [...prev, result]);
          showToast("Thêm môn học thành công!", "success");
        }
        setIsFormOpen(false);
        resetForm();
      }
    } catch (error) {
      showToast("Lỗi khi lưu môn học!", "error");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    const ok = await confirm(
      "Xóa môn học?",
      "Bạn có chắc chắn muốn xóa môn học này? Hành động này không thể hoàn tác."
    );
    if (!ok) return;

    try {
      await subjectService.deleteSubject(subjectId);
      setSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
      showToast("Xóa thành công!", "success");
    } catch (error) {
      showToast("Không thể xóa môn học (có thể đang được sử dụng).", "error");
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["name", "description"],
      ["Toán", "Môn Toán học"],
      ["Lý", "Môn Vật lý"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Subjects");
    XLSX.writeFile(wb, "mau-mon-hoc.xlsx");
  };

  const handleFileChange = async (e) => {
    // ... (giữ nguyên hàm import Excel của bạn)
    // (Bạn có thể copy nguyên hàm cũ vào đây)
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Quản lý môn học {isAdmin && "(Giáo vụ)"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Quản lý danh sách môn học trong trường.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle size={18} /> Thêm môn học
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Download size={18} /> Tải mẫu
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <UploadCloud size={18} /> Import Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          /> */}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Mã môn học
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Tên môn học
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Mô tả
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Đang tải...
                </td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Chưa có môn học nào.
                </td>
              </tr>
            ) : (
              subjects.map((subject) => (
                <tr
                  key={subject.subjectId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm">{subject.subjectId}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {subject.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {subject.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => openModal("view", subject)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem"
                      >
                        <Eye size={16} />
                      </button>
                      {/* <button
                        onClick={() => openModal("delete", subject)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedSubject
                  ? "Xem thông tin cơ bản môn học"
                  : "Thêm môn học mới"}
              </h2>
              <button onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên môn học"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Mô tả (tùy chọn)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {/* <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lưu
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
