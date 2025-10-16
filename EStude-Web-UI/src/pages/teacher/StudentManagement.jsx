import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PlusCircle,
  Trash2,
  Eye,
  CheckSquare,
  X,
  FileUp,
  FileDown,
  FileDownIcon,
} from "lucide-react";
import studentService from "../../services/studentService";
import enrollmentService from "../../services/enrollmentService";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const StudentManagement = ({ classId }) => {
  const { showToast } = useToast();
  const [editingStudent, setEditingStudent] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    studentService.getAllStudents().then((res) => res && setAllStudents(res));
  }, []);

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
      console.error("Lỗi khi tải danh sách học sinh:", err);
      showToast("Lỗi khi tải danh sách học sinh!", "error");
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [showToast]);

  const handleToggle = (userId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const availableStudents = filteredStudents.map((s) => s.userId);
    if (selectAll) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents);
    }
    setSelectAll(!selectAll);
  };

  const confirmAction = (title, message, action) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      },
    });
  };

  const handleEnroll = () => {
    if (selectedStudentIds.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 học sinh để thêm!", "warn");

    confirmAction(
      "Xác nhận thêm học sinh",
      `Bạn có chắc chắn muốn thêm ${selectedStudentIds.length} học sinh vào lớp?`,
      async () => {
        try {
          const enrollments = await enrollmentService.enrollStudentsBatch(
            classId,
            selectedStudentIds
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
          setSelectAll(false);
          showToast("Thêm học sinh vào lớp thành công!", "success");
        } catch (err) {
          console.error("Lỗi khi thêm học sinh:", err);
          showToast("Lỗi khi thêm học sinh vào lớp!", "error");
        }
      }
    );
  };

  const handleRemove = (enrollmentId) => {
    confirmAction(
      "Xóa học sinh",
      "Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?",
      async () => {
        try {
          await enrollmentService.unenrollStudent(enrollmentId);
          setStudentsInClass((prev) =>
            prev.filter((s) => s.enrollmentId !== enrollmentId)
          );
          showToast("Xóa học sinh khỏi lớp thành công!", "success");
        } catch (err) {
          console.error("Lỗi khi xóa học sinh:", err);
          showToast("Lỗi khi xóa học sinh khỏi lớp!", "error");
        }
      }
    );
  };

  const handleRemoveMultiple = () => {
    if (selectedStudentIds.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 học sinh để xóa!", "warn");

    confirmAction(
      "Xóa nhiều học sinh",
      `Bạn có chắc chắn muốn xóa ${selectedStudentIds.length} học sinh khỏi lớp?`,
      async () => {
        try {
          for (const id of selectedStudentIds) {
            const student = studentsInClass.find((s) => s.userId === id);
            if (student) {
              await enrollmentService.unenrollStudent(student.enrollmentId);
            }
          }
          setStudentsInClass((prev) =>
            prev.filter((s) => !selectedStudentIds.includes(s.userId))
          );
          setSelectedStudentIds([]);
          showToast("Xóa học sinh khỏi lớp thành công!", "success");
        } catch (err) {
          console.error("Lỗi khi xóa nhiều học sinh:", err);
          showToast("Lỗi khi xóa học sinh khỏi lớp!", "error");
        }
      }
    );
  };

  const filteredStudents = allStudents.filter(
    (s) =>
      !allEnrollments.some((e) => e.student.userId === s.userId) &&
      s.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDownloadTemplate = () => {
    const sampleData = [
      [
        "Mã HS (bắt buộc)",
        "Họ Tên (bắt buộc)",
        "Ngày Sinh (bắt buộc)",
        "Email",
      ],
      ["21139431", "NGUYỄN NHỰT ANH", "'17/03/2003", "nhutanhngxx@gmail.com"],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Mau_Import_HocSinh.xlsx");
  };

  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const studentMap = new Map(allStudents.map((s) => [s.studentCode, s]));
        const validStudentIds = [];
        let errorCount = 0;

        jsonData.forEach((row) => {
          const code = row["Mã HS"];
          const student = studentMap.get(code);

          if (
            student &&
            !allEnrollments.some((e) => e.student.userId === student.userId)
          ) {
            validStudentIds.push(student.userId);
          } else {
            errorCount++;
          }
        });

        if (validStudentIds.length > 0) {
          const enrollments = await enrollmentService.enrollStudentsBatch(
            classId,
            validStudentIds
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
          showToast(
            `Import thành công ${newStudents.length} học sinh, ${errorCount} lỗi!`,
            errorCount > 0 ? "warning" : "success"
          );
        } else {
          showToast("Không có học sinh hợp lệ trong file!", "error");
        }
      } catch (err) {
        console.error("Import error:", err);
        showToast("Import thất bại!", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleExportExcel = () => {
    const data = studentsInClass.map((s) => ({
      MãHS: s.studentCode,
      HọTên: s.fullName,
      NgàySinh: s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "Chưa có",
      Email: s.email || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HocSinh");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `DanhSachHocSinh.xlsx`);
  };

  return (
    <>
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Thêm học sinh
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
               text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 
               hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FileDown size={18} /> Tải file mẫu
              </button>
              <label
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
               text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 cursor-pointer 
               hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FileUp size={18} />
                Import
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
               text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 
               hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FileDown size={18} />
                Export
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <CheckSquare size={18} />
              {selectAll ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 text-sm"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {filteredStudents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                Không tìm thấy học sinh
              </p>
            ) : (
              filteredStudents.map((s) => (
                <label
                  key={s.userId}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border-gray-200 dark:border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.userId)}
                    onChange={() => handleToggle(s.userId)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-200 dark:focus:ring-blue-400"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                      {s.fullName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {s.dob
                        ? `Ngày sinh: ${new Date(s.dob).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}`
                        : "Chưa có ngày sinh"}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                      MSSV: {s.studentCode}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
          <button
            onClick={handleEnroll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition text-sm"
          >
            <PlusCircle size={18} /> Thêm vào lớp
          </button>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Học sinh trong lớp ({studentsInClass.length})
          </h2>
          <div className="border rounded-lg max-h-[455px] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {studentsInClass.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                Chưa có học sinh nào
              </p>
            ) : (
              studentsInClass.map((s) => (
                <div
                  key={s.enrollmentId}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.userId)}
                      onChange={() => handleToggle(s.userId)}
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-200 dark:focus:ring-blue-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                        {s.fullName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                        {s.dob ? `Ngày sinh: ${s.dob}` : "Chưa có ngày sinh"}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs truncate">
                        MSSV: {s.studentCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingStudent(s)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition text-sm"
                    >
                      <Eye size={16} /> Xem
                    </button>
                    <button
                      onClick={() => handleRemove(s.enrollmentId)}
                      className="flex items-center gap-1 text-red-600 dark:text-red-400 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm"
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleRemoveMultiple}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-500 transition text-sm"
          >
            <Trash2 size={18} /> Xóa khỏi lớp
          </button>
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full p-4 min-h-[50vh] items-stretch">
        <div className="flex flex-col h-full">
          <section className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <PlusCircle size={20} /> Thêm học sinh thủ công
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Tìm theo tên, mã hoặc email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-sm"
              />
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {selectAll ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 p-4 text-sm">
                  Không tìm thấy học sinh phù hợp
                </p>
              ) : (
                filteredStudents.map((s) => (
                  <label
                    key={s.userId}
                    className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.userId)}
                      onChange={() => handleToggle(s.userId)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {s.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.studentCode} | {s.email} |{" "}
                        {s.dob
                          ? new Date(s.dob).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Đang xử lý...
                </span>
              ) : (
                <>
                  <CheckSquare size={16} /> Thêm vào lớp (
                  {selectedStudentIds.length})
                </>
              )}
            </button>
          </section>
        </div>

        <div className="flex flex-col h-full">
          <section className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-sm pb-5">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileUp size={20} /> Thêm học sinh bằng file Excel
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Tải file mẫu, điền danh sách học sinh cần thêm và import vào hệ
              thống.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileDown size={18} /> Tải file mẫu
              </button>

              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <FileUp size={18} /> Import danh sách
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          <section className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Học sinh trong lớp ({studentsInClass.length})
              </h2>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileDown size={16} /> Xuất Excel
              </button>
            </div>

            <div className="relative overflow-x-auto max-h-[350px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 z-10">
                  <tr>
                    <th className="p-2">Mã HS</th>
                    <th className="p-2 text-left">Họ tên</th>
                    <th className="p-2">Ngày sinh</th>
                    <th className="p-2">Email</th>
                    <th className="p-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-4 text-gray-500"
                      >
                        Chưa có học sinh nào trong lớp
                      </td>
                    </tr>
                  ) : (
                    studentsInClass.map((s) => (
                      <tr
                        key={s.enrollmentId}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-2 text-left">{s.studentCode}</td>
                        <td className="p-2">{s.fullName}</td>
                        <td className="p-2 text-center">
                          {s.dob
                            ? new Date(s.dob).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="p-2 text-left">{s.email}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemove(s.enrollmentId)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* {selectedStudentIds.length > 0 && (
              <button
                onClick={handleRemoveMultiple}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                <Trash2 size={16} /> Xóa các học sinh đã chọn
              </button>
            )} */}
          </section>
        </div>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 overflow-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thông tin học sinh
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editingStudent.fullName}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    fullName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Họ và tên"
              />
              <input
                type="date"
                value={editingStudent.dob || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    dob: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
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
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
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
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Email"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  showToast("Chức năng lưu đang được phát triển!", "warn");
                  setEditingStudent(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition text-sm"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
};

export default StudentManagement;
