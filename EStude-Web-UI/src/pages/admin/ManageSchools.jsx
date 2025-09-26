import React, { useState, useEffect } from "react";
import { Eye, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import schoolService from "../../services/schoolService";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";

const Badge = ({ text, color }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm max-w-5xl w-full p-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ManageSchools = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");
  const [schools, setSchools] = useState([]);
  const [excelSchools, setExcelSchools] = useState([]);
  const [editableSchools, setEditableSchools] = useState([
    { code: "", name: "", address: "", email: "", phone: "" },
  ]);
  const [modalType, setModalType] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load dark mode từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

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
        console.error("Error loading schools:", error);
      }
    };
    fetchSchools();
  }, []);

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

  const filteredSchools = schools.filter((s) =>
    [s.code, s.name, s.address, s.email, s.phone]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchools = filteredSchools.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalItems = filteredSchools.length;

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
      const existingCodes = schools.map((s) => s.code.toLowerCase());
      const existingNames = schools.map((s) => s.name.toLowerCase());

      const uniqueSchools = editableSchools.filter(
        (s) =>
          s.code &&
          s.name &&
          !existingCodes.includes(s.code.toLowerCase()) &&
          !existingNames.includes(s.name.toLowerCase())
      );

      let count = 0;
      for (let s of uniqueSchools) {
        const newSchool = {
          schoolCode: s.code,
          schoolName: s.name,
          address: s.address,
          contactEmail: s.email,
          contactPhone: s.phone,
        };
        const result = await schoolService.addSchool(newSchool);
        if (result) count++;
      }

      const skipped = editableSchools.length - uniqueSchools.length;

      setEditableSchools([
        { code: "", name: "", address: "", email: "", phone: "" },
      ]);
      closeModal();

      if (count > 0) {
        showToast(t("school.addSuccess", { count }), "success");
      }
      if (skipped > 0) {
        showToast(t("school.addSkipped", { count: skipped }), "warning");
      }
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      showToast(t("school.addError"), "error");
    }
  };

  const handleSubmitExcelSchools = async () => {
    try {
      const existingCodes = schools.map((s) => s.code.toLowerCase());
      const existingNames = schools.map((s) => s.name.toLowerCase());

      const uniqueExcelSchools = excelSchools.filter(
        (s) =>
          s.code &&
          s.name &&
          !existingCodes.includes(s.code.toLowerCase()) &&
          !existingNames.includes(s.name.toLowerCase())
      );

      let count = 0;
      for (let s of uniqueExcelSchools) {
        const newSchool = {
          schoolCode: s.code,
          schoolName: s.name,
          address: s.address,
          contactEmail: s.email,
          contactPhone: s.phone,
        };
        const result = await schoolService.addSchool(newSchool);
        if (result) count++;
      }

      const skipped = excelSchools.length - uniqueExcelSchools.length;

      setExcelSchools([]);
      closeModal();

      if (count > 0) {
        showToast(t("school.importSuccess", { count }), "success");
      }
      if (skipped > 0) {
        showToast(t("school.importSkipped", { count: skipped }), "warning");
      }
    } catch (error) {
      console.error("Lỗi khi import:", error);
      showToast(t("school.importError"), "error");
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("manageSchools.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("manageSchools.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-indigo-700 rounded-lg text-white text-sm shadow"
          >
            + {t("manageSchools.addButton")}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("common.searchSchool")}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {t("common.filter")}
        </button>
        <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {t("common.exportExcel")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-14">{t("fields.code")}</th>
              <th className="px-4 py-3 text-left w-48">{t("fields.name")}</th>
              <th className="px-4 py-3 text-left w-72">
                {t("fields.address")}
              </th>
              <th className="px-4 py-3 text-left w-48">{t("fields.email")}</th>
              <th className="px-4 py-3 text-left w-32">{t("fields.phone")}</th>
              <th className="px-4 py-3 text-left w-24">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentSchools.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td className="px-4 py-3">{s.code}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.address}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openModal("view", s)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openModal("delete", s)}
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        siblingCount={1}
      />

      {modalType === "add" && (
        <Modal title={t("manageSchools.addTitle")} onClose={closeModal}>
          <div className="space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-400 flex gap-1">
              <p>{t("manageSchools.downloadTemplate")}</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const wb = XLSX.utils.book_new();
                  const wsData = [
                    [
                      t("fields.code"),
                      t("fields.name"),
                      t("fields.address"),
                      t("fields.email"),
                      t("fields.phone"),
                    ],
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  XLSX.utils.book_append_sheet(wb, ws, "Schools");
                  XLSX.writeFile(wb, "schools-template.xlsx");
                }}
                className="text-green-700 font-medium dark:text-green-200 hover:underline"
              >
                {t("manageSchools.downloadHere")}
              </a>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-400">
                {t("manageSchools.uploadExcel")}
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                onChange={handleExcelUpload}
              />
            </div>

            {excelSchools.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          {t("fields.code")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("fields.name")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("fields.address")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("fields.email")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("fields.phone")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelSchools.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <td className="px-4 py-3">{s.code}</td>
                          <td className="px-4 py-3">{s.name}</td>
                          <td className="px-4 py-3">{s.address}</td>
                          <td className="px-4 py-3">{s.email}</td>
                          <td className="px-4 py-3">{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("manageSchools.orFill")}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">{t("fields.code")}</th>
                    <th className="px-4 py-3 text-left">{t("fields.name")}</th>
                    <th className="px-4 py-3 text-left">
                      {t("fields.address")}
                    </th>
                    <th className="px-4 py-3 text-left">{t("fields.email")}</th>
                    <th className="px-4 py-3 text-left">{t("fields.phone")}</th>
                    <th className="px-4 py-3 text-left">
                      {t("actions.action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editableSchools.map((s, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={s.code}
                          onChange={(e) =>
                            updateCell(index, "code", e.target.value)
                          }
                          className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) =>
                            updateCell(index, "name", e.target.value)
                          }
                          className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={s.address}
                          onChange={(e) =>
                            updateCell(index, "address", e.target.value)
                          }
                          className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={s.email}
                          onChange={(e) =>
                            updateCell(index, "email", e.target.value)
                          }
                          className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={s.phone}
                          onChange={(e) =>
                            updateCell(index, "phone", e.target.value)
                          }
                          className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          {t("actions.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={addRow}
                className="mt-2 px-4 py-2 text-green-700 dark:text-green-200 hover:underline"
              >
                {t("actions.addSchool")}
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={
                  excelSchools.length > 0
                    ? handleSubmitExcelSchools
                    : saveSchools
                }
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-indigo-700"
              >
                {t("actions.save")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "delete" && selectedSchool && (
        <Modal title={t("manageSchools.confirmDelete")} onClose={closeModal}>
          <p className="text-gray-800 dark:text-gray-200">
            {t("manageSchools.confirmDeleteMsg", { name: selectedSchool.name })}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => deleteSchool(selectedSchool.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t("common.delete")}
            </button>
          </div>
        </Modal>
      )}

      {modalType === "view" && selectedSchool && (
        <Modal title={t("manageSchools.viewTitle")} onClose={closeModal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("fields.code")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedSchool.code}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("fields.name")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedSchool.name}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("fields.address")}
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.address}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("fields.email")}
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.email}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("fields.phone")}
              </p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {selectedSchool.phone}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageSchools;
