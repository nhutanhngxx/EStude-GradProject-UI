import React, { useState, useEffect } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import adminService from "../../services/adminService";
import schoolService from "../../services/schoolService";

const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
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
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
      {initials}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-5xl w-full p-6">
      <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
        >
          ✖
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [excelUsers, setExcelUsers] = useState([]);
  const [modalType, setModalType] = useState(null); // 'add' | 'view' | 'delete' | 'password'
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const result = await schoolService.getAllSchools();
        if (result) {
          setSchools(result);
          setSelectedSchool(result[0]?.id || null);
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách trường:", error);
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
        },
      ]);
      setGeneratedPassword(password);
      setModalType("password");
    } else {
      alert("Thêm người dùng thất bại. Vui lòng thử lại.");
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
      const rows = jsonData.slice(1); // bỏ header
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
          isHomeroomTeacher: false,
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
    alert(`Import thành công ${count} người dùng`);
  };

  const filteredUsers = users.filter(
    (u) =>
      (filterRole === "ALL" || u.role === filterRole) &&
      (u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const roleLabels = {
    STUDENT: "Học sinh",
    TEACHER: "Giáo viên",
    ADMIN: "Quản trị",
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <div className="w-4/6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý Người dùng/Tài khoản
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Quản lý tài khoản/người dùng: xem, thêm, xóa, import Excel và quản
            lý quyền.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Thêm mới người dùng
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm người dùng.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="ALL">Tất cả</option>
          <option value="STUDENT">Học sinh</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="ADMIN">Quản trị</option>
        </select>

        <button onClick={exportToExcel} className="px-4 py-2 border rounded-lg">
          Xuất Excel
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-4 py-3 text-left">Người dùng</th>
              <th className="px-4 py-3 text-left">Vai trò</th>
              <th className="px-4 py-3 text-left">SĐT</th>
              <th className="px-4 py-3 text-left">Ngày sinh</th>
              <th className="px-4 py-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.userId}
                className="border-t hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td className="px-4 py-2 flex items-center gap-3">
                  <Avatar name={u.fullName} />
                  <div>
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Badge
                    text={roleLabels[u.role] || u.role}
                    color={
                      u.role === "STUDENT"
                        ? "bg-green-100 text-green-700"
                        : u.role === "TEACHER"
                        ? "bg-purple-100 text-purple-700"
                        : u.role === "ADMIN"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  />
                </td>

                <td className="px-4 py-2">{u.numberPhone}</td>
                <td className="px-4 py-2">
                  {u.dob ? new Date(u.dob).toLocaleDateString("vi-VN") : ""}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => openModal("view", u)}
                    className="text-blue-600 hover:underline"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openModal("delete", u)}
                    className="text-red-600 hover:underline"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalType === "add" && (
        <Modal title="Thêm người dùng mới" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleAddUser}>
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="STUDENT">Học sinh</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Quản trị</option>
            </select>
            {selectedRole === "TEACHER" && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isHomeroomTeacher}
                    onChange={(e) => setIsHomeroomTeacher(e.target.checked)}
                  />
                  Giáo viên chủ nhiệm
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                  Giáo vụ
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
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Chọn trường</option>
              {schools.map((s) => (
                <option key={s.schoolId} value={s.schoolId}>
                  {s.schoolName}
                </option>
              ))}
            </select>

            <input
              name="fullName"
              type="text"
              placeholder="Họ và tên"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <input
              name="numberPhone"
              type="text"
              placeholder="Số điện thoại"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              name="dob"
              type="date"
              placeholder="Ngày sinh"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === "view" && selectedUser && (
        <Modal title="Thông tin người dùng" onClose={closeModal}>
          <div className="space-y-2">
            <div>
              <b>Họ và tên:</b> {selectedUser.fullName}
            </div>
            <div>
              <b>Email:</b> {selectedUser.email}
            </div>
            <div>
              <b>Vai trò:</b>{" "}
              {roleLabels[selectedUser.role] || selectedUser.role}
            </div>
            <div>
              <b>SĐT:</b> {selectedUser.numberPhone}
            </div>
            <div>
              <b>Ngày sinh:</b> {selectedUser.dob}
            </div>
          </div>
        </Modal>
      )}

      {modalType === "delete" && selectedUser && (
        <Modal title="Xóa người dùng" onClose={closeModal}>
          <p>Bạn có chắc muốn xóa người dùng {selectedUser.fullName} không?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={() => deleteUser(selectedUser.userId)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}

      {modalType === "password" && (
        <Modal title="Mật khẩu đã tạo" onClose={closeModal}>
          <p className="mb-2">Mật khẩu mặc định người dùng là:</p>
          <div className="text-center text-xl font-bold mb-4">
            {generatedPassword}
          </div>
          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageAccounts;
