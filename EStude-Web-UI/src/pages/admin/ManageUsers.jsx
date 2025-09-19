import React, { useState, useEffect } from "react";
import { Eye, Trash2, X } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import adminService from "../../services/adminService";
import schoolService from "../../services/schoolService";
import { useTranslation } from "react-i18next";
import { useToast } from "../../contexts/ToastContext";

const Badge = ({ text, color }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
    {text}
  </span>
);

const Avatar = ({ name }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
      {initials}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
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

const ManageAccounts = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [excelUsers, setExcelUsers] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load dark mode từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const result = await schoolService.getAllSchools();
        if (result) {
          setSchools(result);
          setSelectedSchool(result[0]?.schoolId || null);
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách trường:", error);
        showToast(t("manageAccounts.fetchSchoolsError"), "error");
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await adminService.getAllUsers();
        if (result) {
          setUsers(result);
        }
      } catch (error) {
        console.error("Lỗi khi load users:", error);
        showToast(t("manageAccounts.fetchUsersError"), "error");
      }
    };
    fetchUsers();
  }, []);

  const openModal = (type, user = null) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
    setGeneratedPassword("");
    setExcelUsers([]);
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.userId !== id));
    closeModal();
    showToast(t("manageAccounts.deleteSuccess"), "success");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(users);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "users.xlsx");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const role = e.target.role.value;
    const dob = new Date(e.target.dob.value);

    const formatDobToPassword = (date) => {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}${mm}${yyyy}`;
    };

    const password = formatDobToPassword(dob);

    const newUser = {
      schoolId: selectedSchool || undefined,
      fullName: e.target.fullName.value,
      email: e.target.email.value,
      numberPhone: e.target.numberPhone.value,
      password: password,
      dob: dob,
    };

    try {
      let result;
      if (role === "STUDENT") {
        result = await adminService.addStudent({
          ...newUser,
          studentCode: "STU" + Date.now(),
        });
      } else if (role === "TEACHER") {
        result = await adminService.addTeacher({
          ...newUser,
          teacherCode: "TEA" + Date.now(),
          isAdmin,
          isHomeroomTeacher,
        });
      } else if (role === "ADMIN") {
        result = await adminService.addAdmin({
          ...newUser,
          adminCode: "ADM" + Date.now(),
        });
      }

      if (result) {
        setUsers([
          ...users,
          {
            userId: result.data?.userId || Date.now(),
            fullName: result.data?.fullName || newUser.fullName,
            email: result.data?.email || newUser.email,
            role: role,
            numberPhone: result.data?.numberPhone || newUser.numberPhone,
            dob: newUser.dob.toISOString().split("T")[0],
            adminCode:
              role === "ADMIN"
                ? result.data?.adminCode || "ADM" + Date.now()
                : undefined,
            teacherCode:
              role === "TEACHER"
                ? result.data?.teacherCode || "TEA" + Date.now()
                : undefined,
            studentCode:
              role === "STUDENT"
                ? result.data?.studentCode || "STU" + Date.now()
                : undefined,
          },
        ]);
        setGeneratedPassword(password);
        setModalType("password");
        showToast(t("manageAccounts.addSuccess"), "success");
      } else {
        showToast(t("manageAccounts.addUserFailed"), "error");
      }
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      showToast(t("manageAccounts.addUserFailed"), "error");
    }
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
      const newUsers = rows.map((row, index) => ({
        id: Date.now() + index,
        fullName: row[0] || "",
        email: row[1] || "",
        numberPhone: row[2] || "",
        role: row[3] || "STUDENT",
        dob: row[4] ? new Date(row[4]) : null,
        schoolId: row[5] || null,
        isHomeroomTeacher: row[6] === "✓" || row[6] === "x",
        subject: row[7] || "",
      }));
      setExcelUsers(newUsers);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitExcelUsers = async () => {
    try {
      let count = 0;
      for (let u of excelUsers) {
        const password = u.dob
          ? `${String(u.dob.getDate()).padStart(2, "0")}${String(
              u.dob.getMonth() + 1
            ).padStart(2, "0")}${u.dob.getFullYear()}`
          : "12345678";
        const newUser = { ...u, password };
        let result;
        if (u.role === "STUDENT") {
          result = await adminService.addStudent({
            ...newUser,
            studentCode: "STU" + Date.now(),
          });
        } else if (u.role === "TEACHER") {
          result = await adminService.addTeacher({
            ...newUser,
            teacherCode: "TEA" + Date.now(),
            isAdmin: false,
            isHomeroomTeacher: u.isHomeroomTeacher,
          });
        } else if (u.role === "ADMIN") {
          result = await adminService.addAdmin({
            ...newUser,
            adminCode: "ADM" + Date.now(),
          });
        }
        if (result) count++;
      }
      setUsers([...users, ...excelUsers]);
      setExcelUsers([]);
      closeModal();
      if (count > 0) {
        showToast(t("manageAccounts.importSuccess", { count }), "success");
      }
      if (excelUsers.length - count > 0) {
        showToast(
          t("manageAccounts.importSkipped", {
            count: excelUsers.length - count,
          }),
          "warning"
        );
      }
    } catch (error) {
      console.error("Lỗi khi import:", error);
      showToast(t("manageAccounts.importError"), "error");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (filterRole === "ALL" || u.role === filterRole) &&
      (u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const roleLabels = {
    STUDENT: t("manageAccounts.roles.student"),
    TEACHER: t("manageAccounts.roles.teacher"),
    ADMIN: t("manageAccounts.roles.admin"),
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("manageAccounts.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("manageAccounts.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-indigo-700 rounded-lg text-white text-sm shadow"
          >
            + {t("manageAccounts.addNewUser")}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <input
          type="text"
          placeholder={t("manageAccounts.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">{t("manageAccounts.filters.all")}</option>
          <option value="STUDENT">{t("manageAccounts.roles.student")}</option>
          <option value="TEACHER">{t("manageAccounts.roles.teacher")}</option>
          <option value="ADMIN">{t("manageAccounts.roles.admin")}</option>
        </select>
        <button
          onClick={exportToExcel}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t("manageAccounts.exportExcel")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                {t("manageAccounts.loginCode")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageAccounts.user")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageAccounts.role")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("manageAccounts.phone")}
              </th>
              <th className="px-4 py-3 text-left">{t("manageAccounts.dob")}</th>
              <th className="px-4 py-3 text-left">
                {t("manageAccounts.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.userId}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td className="px-4 py-3">
                  {u.role === "ADMIN"
                    ? u.adminCode
                    : u.role === "TEACHER"
                    ? u.teacherCode
                    : u.role === "STUDENT"
                    ? u.studentCode
                    : "-"}
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <Avatar name={u.fullName} />
                  <div>
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      {u.email}
                    </div>
                  </div>
                </td>
                <td>
                  <Badge
                    text={roleLabels[u.role] || u.role}
                    color={
                      u.role === "STUDENT"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : u.role === "TEACHER"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : u.role === "ADMIN"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }
                  />
                </td>
                <td className="px-4 py-3">{u.numberPhone}</td>
                <td className="px-4 py-3">
                  {u.dob ? new Date(u.dob).toLocaleDateString("vi-VN") : ""}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openModal("view", u)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openModal("delete", u)}
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

      {modalType === "add" && (
        <Modal
          title={t("manageAccounts.addUserModal.title")}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-400 flex gap-2">
              <p>{t("manageAccounts.downloadTemplate")}</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const wb = XLSX.utils.book_new();
                  const wsData = [
                    [
                      t("manageAccounts.placeholders.fullName"),
                      t("manageAccounts.placeholders.email"),
                      t("manageAccounts.placeholders.phone"),
                      t("manageAccounts.placeholders.role"),
                      t("manageAccounts.placeholders.dob"),
                      t("manageAccounts.placeholders.school"),
                      t("manageAccounts.homeroomTeacher"),
                      t("manageAccounts.subject"),
                    ],
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  XLSX.utils.book_append_sheet(wb, ws, "Users");
                  XLSX.writeFile(wb, "users-template.xlsx");
                }}
                className="text-green-700 font-medium dark:text-green-200 hover:underline"
              >
                {t("manageAccounts.downloadHere")}
              </a>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-400">
                {t("manageAccounts.uploadExcel")}
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                onChange={handleExcelUpload}
              />
            </div>

            {excelUsers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.fullName")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.email")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.phone")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.role")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.dob")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.placeholders.school")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.homeroomTeacher")}
                        </th>
                        <th className="px-4 py-3 text-left">
                          {t("manageAccounts.subject")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <td className="px-4 py-3">{u.fullName}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">{u.numberPhone}</td>
                          <td className="px-4 py-3">{u.role}</td>
                          <td className="px-4 py-3">
                            {u.dob
                              ? new Date(u.dob).toLocaleDateString("vi-VN")
                              : ""}
                          </td>
                          <td className="px-4 py-3">{u.schoolId}</td>
                          <td className="px-4 py-3">
                            {u.isHomeroomTeacher ? "✓" : ""}
                          </td>
                          <td className="px-4 py-3">{u.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("manageAccounts.orFill")}
            </p>

            <form className="space-y-4" onSubmit={handleAddUser}>
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="STUDENT">
                  {t("manageAccounts.roles.student")}
                </option>
                <option value="TEACHER">
                  {t("manageAccounts.roles.teacher")}
                </option>
                <option value="ADMIN">{t("manageAccounts.roles.admin")}</option>
              </select>
              {selectedRole === "TEACHER" && (
                <>
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={isHomeroomTeacher}
                      onChange={(e) => setIsHomeroomTeacher(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t("manageAccounts.homeroomTeacher")}
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={isAdmin}
                      onChange={(e) => setIsAdmin(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t("manageAccounts.schoolStaff")}
                  </label>
                </>
              )}
              <select
                name="school"
                value={selectedSchool || ""}
                onChange={(e) =>
                  setSelectedSchool(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">{t("manageAccounts.selectSchool")}</option>
                {schools.map((s) => (
                  <option key={s.schoolId} value={s.schoolId}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
              <input
                name="fullName"
                type="text"
                placeholder={t("manageAccounts.placeholders.fullName")}
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <input
                name="email"
                type="email"
                placeholder={t("manageAccounts.placeholders.email")}
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <input
                name="numberPhone"
                type="text"
                placeholder={t("manageAccounts.placeholders.phone")}
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                name="dob"
                type="date"
                placeholder={t("manageAccounts.placeholders.dob")}
                className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <div className="flex justify-end gap-2 mt-4">
                {/* <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {t("common.cancel")}
                </button> */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>

            {excelUsers.length > 0 && (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitExcelUsers}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {t("common.save")}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {modalType === "view" && selectedUser && (
        <Modal
          title={t("manageAccounts.viewUserModal.title")}
          onClose={closeModal}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("manageAccounts.viewUserModal.fullName")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.fullName}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("manageAccounts.viewUserModal.email")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.email}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("manageAccounts.viewUserModal.role")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {roleLabels[selectedUser.role] || selectedUser.role}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("manageAccounts.viewUserModal.phone")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.numberPhone}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("manageAccounts.viewUserModal.dob")}
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.dob}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "delete" && selectedUser && (
        <Modal
          title={t("manageAccounts.deleteUserModal.title")}
          onClose={closeModal}
        >
          <p className="text-gray-800 dark:text-gray-200">
            {t("manageAccounts.deleteUserModal.confirm", {
              name: selectedUser.fullName,
            })}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => deleteUser(selectedUser.userId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {t("common.delete")}
            </button>
          </div>
        </Modal>
      )}

      {modalType === "password" && (
        <Modal
          title={t("manageAccounts.passwordModal.title")}
          onClose={closeModal}
        >
          <p className="text-gray-800 dark:text-gray-200 mb-2">
            {t("manageAccounts.passwordModal.description")}
          </p>
          <div className="text-center text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {generatedPassword}
          </div>
          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {t("common.close")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageAccounts;
