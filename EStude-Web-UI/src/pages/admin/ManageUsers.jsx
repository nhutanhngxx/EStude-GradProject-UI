import React, { useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";

// Badge component
const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
    {text}
  </span>
);

// Avatar initials
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

// Modal
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          ✖
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ManageAccounts = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@school.edu",
      role: "Học sinh",
      status: "Hoạt động",
      lastActive: "2 giờ trước",
    },
    {
      id: 2,
      name: "Prof. Michael Smith",
      email: "m.smith@school.edu",
      role: "Giáo viên",
      status: "Hoạt động",
      lastActive: "1 giờ trước",
    },
    {
      id: 3,
      name: "Emily Davis",
      email: "e.davis@school.edu",
      role: "Học sinh",
      status: "Không hoạt động",
      lastActive: "2 ngày trước",
    },
    {
      id: 4,
      name: "Dr. Robert Wilson",
      email: "r.wilson@school.edu",
      role: "Quản trị viên",
      status: "Hoạt động",
      lastActive: "30 phút trước",
    },
  ]);

  const [modalType, setModalType] = useState(null); // 'add' | 'view' | 'delete'
  const [selectedUser, setSelectedUser] = useState(null);

  const openModal = (type, user = null) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
    closeModal();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div className="w-4/6">
          <h1 className="text-2xl font-bold">Quản lý Người dùng/Tài khoản</h1>
          <p className="text-gray-600">
            Quản lý tài khoản/người dùng là nơi bạn có thể xem, chỉnh sửa thông
            tin cá nhân và quản lý quyền truy cập của người dùng trong hệ thống.
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
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
        />
        <button className="px-4 py-2 border rounded-lg">Bộ lọc</button>
        <button className="px-4 py-2 border rounded-lg">Xuất excel</button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Người dùng</th>
              <th className="px-4 py-2">Vai trò</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Hoạt động gần nhất</th>
              <th className="px-4 py-2">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2 flex items-center gap-3">
                  <Avatar name={u.name} />
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Badge
                    text={u.role}
                    color={
                      u.role === "Học sinh"
                        ? "bg-green-100 text-green-700"
                        : u.role === "Giáo viên"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <Badge
                    text={u.status}
                    color={
                      u.status === "Hoạt động"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  />
                </td>
                <td className="px-4 py-2">{u.lastActive}</td>
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

      {/* Modal Add */}
      {modalType === "add" && (
        <Modal title="Thêm người dùng mới" onClose={closeModal}>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Họ và tên"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <select className="w-full px-4 py-2 border rounded-lg">
              <option>Học sinh</option>
              <option>Giáo viên</option>
              <option>Quản trị viên</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Thêm mới
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal View */}
      {modalType === "view" && selectedUser && (
        <Modal title="User Details" onClose={closeModal}>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {selectedUser.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>Role:</strong> {selectedUser.role}
            </p>
            <p>
              <strong>Status:</strong> {selectedUser.status}
            </p>
            <p>
              <strong>Last Active:</strong> {selectedUser.lastActive}
            </p>
          </div>
        </Modal>
      )}

      {/* Modal Delete */}
      {modalType === "delete" && selectedUser && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>
            Are you sure you want to delete <strong>{selectedUser.name}</strong>
            ?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteUser(selectedUser.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageAccounts;
