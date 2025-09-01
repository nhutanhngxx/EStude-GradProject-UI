import React, { useState, useEffect } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import schoolService from "../../services/schoolService";

const Badge = ({ text, color }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full p-6">
      <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <button
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          onClick={onClose}
        >
          ✖
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ManageSchools = () => {
  const [message, setMessage] = useState("");
  const [schools, setSchools] = useState([]);
  const [excelSchools, setExcelSchools] = useState([]);
  const [editableSchools, setEditableSchools] = useState([
    { code: "", name: "", address: "", email: "", phone: "" },
  ]);
  const [modalType, setModalType] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await schoolService.getAllSchools();
        if (data) {
          const mappedSchools = data.map((s) => ({
            id: s.id,
            code: s.schoolCode,
            name: s.schoolName,
            address: s.address,
            email: s.contactEmail,
            phone: s.contactPhone,
          }));
          setSchools(mappedSchools);
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách trường:", error);
      }
    };
    fetchSchools();
  }, []); // chạy 1 lần khi load trang
  const openModal = (type, school = null) => {
    setSelectedSchool(school);
    setModalType(type);
  };
  const closeModal = () => {
    setSelectedSchool(null);
    setModalType(null);
    setExcelSchools([]);
  };
  const deleteSchool = (id) => {
    setSchools(schools.filter((s) => s.id !== id));
    closeModal();
  };
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const rows = jsonData.slice(1);

      const newSchools = rows.map((row, index) => ({
        id: Date.now() + index,
        code: row[0] || "",
        name: row[1] || "",
        address: row[2] || "",
        email: row[3] || "",
        phone: row[4] || "",
      }));

      setExcelSchools(newSchools);
      console.log(newSchools);
    };

    reader.readAsArrayBuffer(file);
  };
  const addRow = () => {
    setEditableSchools([
      ...editableSchools,
      { code: "", name: "", address: "", email: "", phone: "" },
    ]);
  };
  const removeRow = (index) => {
    const updated = [...editableSchools];
    updated.splice(index, 1);
    setEditableSchools(updated);
  };
  const updateCell = (index, field, value) => {
    const updated = [...editableSchools];
    updated[index][field] = value;
    setEditableSchools(updated);
  };
  const saveSchools = async () => {
    try {
      let count = 0;
      for (let s of editableSchools) {
        const newSchool = {
          schoolCode: s.code,
          schoolName: s.name,
          address: s.address,
          contactEmail: s.email,
          contactPhone: s.phone,
        };
        console.log("Thêm trường:", newSchool);
        const result = await schoolService.addSchool(newSchool);
        if (result) {
          count++;
        }
        if (result) {
          console.log("Thêm thành công:", result);
        }
      }
      setEditableSchools([
        { code: "", name: "", address: "", email: "", phone: "" },
      ]);
      closeModal();
      if (count > 0) {
        setMessage(`Đã thêm thành công ${count} trường`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
    }
  };
  const handleSubmitExcelSchools = async () => {
    try {
      let count = 0;
      for (let s of excelSchools) {
        const newSchool = {
          schoolCode: s.code,
          schoolName: s.name,
          address: s.address,
          contactEmail: s.email,
          contactPhone: s.phone,
        };
        const result = await schoolService.addSchool(newSchool);
        if (result) {
          count++;
        }
      }
      setExcelSchools([]);
      closeModal();
      if (count > 0) {
        setMessage(`Import thành công ${count} trường từ Excel`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi import:", error);
    }
  };
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {message && (
        <div
          className="fixed top-14 right-5 z-50 px-4 py-3 rounded-lg shadow-lg 
               bg-green-500 text-white transform transition-all duration-500
               animate-slide-in"
        >
          {message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="md:w-4/6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý Trường học
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Quản lý thông tin trường học: mã trường, tên, địa chỉ, email, số
            điện thoại. Dễ dàng thêm, xem và xóa trường.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
        >
          + Thêm trường mới
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm trường.."
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow">
          Bộ lọc
        </button>
        <button className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow">
          Xuất excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3">Mã trường</th>
              <th className="px-4 py-3">Tên trường</th>
              <th className="px-4 py-3">Địa chỉ</th>
              <th className="px-4 py-3">Email liên hệ</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr
                key={s.id}
                className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td className="px-4 py-3">{s.code}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.address}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openModal("view", s)}
                    className="text-blue-600 dark:text-blue-400 hover:underline transition"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openModal("delete", s)}
                    className="text-red-600 dark:text-red-400 hover:underline transition"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modalType === "add" && (
        <Modal title="Thêm trường mới" onClose={closeModal}>
          <div className="space-y-4">
            {/* Link tải file Excel mẫu */}
            <div className="text-sm text-gray-700 dark:text-gray-200 flex gap-2">
              <p>Tải file Excel mẫu để thêm nhiều trường nhanh:</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const wb = XLSX.utils.book_new();
                  const wsData = [
                    [
                      "Mã trường",
                      "Tên trường",
                      "Địa chỉ",
                      "Email",
                      "Số điện thoại",
                    ],
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  XLSX.utils.book_append_sheet(wb, ws, "Schools");
                  XLSX.writeFile(wb, "schools-template.xlsx");
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Tải file mẫu tại đây
              </a>
            </div>

            {/* Upload file Excel */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-200">
                Upload Excel
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={handleExcelUpload}
              />
            </div>

            {/* Hiển thị bảng review dữ liệu Excel */}
            {excelSchools.length > 0 && (
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-4">
                {/* Thêm scroll theo chiều dọc */}
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2">Mã trường</th>
                        <th className="px-4 py-2">Tên trường</th>
                        <th className="px-4 py-2">Địa chỉ</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Số điện thoại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelSchools.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <td className="px-4 py-2">{s.code}</td>
                          <td className="px-4 py-2">{s.name}</td>
                          <td className="px-4 py-2">{s.address}</td>
                          <td className="px-4 py-2">{s.email}</td>
                          <td className="px-4 py-2">{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
              Hoặc điền thông tin trường bên dưới:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2">Mã trường</th>
                    <th className="px-4 py-2">Tên trường</th>
                    <th className="px-4 py-2">Địa chỉ</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Số điện thoại</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {editableSchools.map((s, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={s.code}
                          onChange={(e) =>
                            updateCell(index, "code", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) =>
                            updateCell(index, "name", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={s.address}
                          onChange={(e) =>
                            updateCell(index, "address", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="email"
                          value={s.email}
                          onChange={(e) =>
                            updateCell(index, "email", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={s.phone}
                          onChange={(e) =>
                            updateCell(index, "phone", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={addRow}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Thêm dòng
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={
                  excelSchools.length > 0
                    ? handleSubmitExcelSchools
                    : saveSchools
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "view" && selectedSchool && (
        <Modal title="Chi tiết trường" onClose={closeModal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mã trường
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {selectedSchool.code}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tên trường
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {selectedSchool.name}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Địa chỉ
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.address}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email liên hệ
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.email}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Số điện thoại
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.phone}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "delete" && selectedSchool && (
        <Modal title="Xác nhận xóa" onClose={closeModal}>
          <p className="text-gray-800 dark:text-gray-200">
            Bạn có chắc muốn xóa <strong>{selectedSchool.name}</strong> không?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => deleteSchool(selectedSchool.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageSchools;
