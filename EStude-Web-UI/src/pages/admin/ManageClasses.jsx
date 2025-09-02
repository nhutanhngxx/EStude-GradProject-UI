import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FaEye, FaTrash } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
    {text}
  </span>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
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

const ManageClasses = () => {
  const [classes, setClasses] = useState([
    {
      id: 1,
      name: "Math 101",
      teacher: "Mr. John",
      students: 30,
      status: "Hoạt động",
    },
    {
      id: 2,
      name: "Physics 201",
      teacher: "Mrs. Smith",
      students: 25,
      status: "Hoạt động",
    },
    {
      id: 3,
      name: "History 101",
      teacher: "Dr. Brown",
      students: 18,
      status: "Không hoạt động",
    },
  ]);

  const [modalType, setModalType] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const openModal = (type, cls = null) => {
    setSelectedClass(cls);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedClass(null);
    setModalType(null);
  };

  const handleDelete = (id) => {
    setClasses(classes.filter((c) => c.id !== id));
    closeModal();
  };

  const chartData = {
    labels: classes.map((c) => c.name),
    datasets: [
      {
        label: "Students",
        data: classes.map((c) => c.students),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="w-4/6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý Lớp học
          </h1>
          <p className="text-gray-600">
            Quản lý lớp học là một công cụ giúp giáo viên tổ chức và quản lý tất
            cả các khía cạnh của một lớp học, từ điểm danh, giao bài tập đến
            đánh giá học sinh.
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Thêm lớp mới
        </button>
      </div>

      {/* Chart */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow w-1/3">
          <h2 className="text-lg font-semibold mb-4">
            Số lượng học sinh mỗi lớp
          </h2>
          <Bar data={chartData} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Tên lớp học</th>
              <th className="px-4 py-2">Giáo viên</th>
              <th className="px-4 py-2">Học sinh</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">{c.teacher}</td>
                <td className="px-4 py-2">{c.students}</td>
                <td className="px-4 py-2">
                  <Badge
                    text={c.status}
                    color={
                      c.status === "Hoạt động"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  />
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => openModal("edit", c)}
                    className="text-blue-600 hover:underline"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openModal("delete", c)}
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

      {/* Modal Add/Edit */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={modalType === "add" ? "Add New Class" : "Edit Class"}
          onClose={closeModal}
        >
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Class Name"
              defaultValue={selectedClass?.name || ""}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Teacher"
              defaultValue={selectedClass?.teacher || ""}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Number of Students"
              defaultValue={selectedClass?.students || ""}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <select
              defaultValue={selectedClass?.status || "Active"}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Delete */}
      {modalType === "delete" && selectedClass && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>
            Are you sure you want to delete{" "}
            <strong>{selectedClass.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(selectedClass.id)}
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

export default ManageClasses;
