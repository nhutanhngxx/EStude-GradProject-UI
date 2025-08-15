import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    { name: "Học sinh", value: "student" },
    { name: "Giáo viên", value: "teacher" },
    { name: "Admin", value: "admin" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <h1 className="text-3xl font-bold mb-6">Chọn vai trò đăng nhập</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => navigate(`/login?role=${role.value}`)}
            className="bg-white text-blue-600 px-6 py-4 rounded-lg shadow hover:bg-gray-100 transition"
          >
            {role.name}
          </button>
        ))}
      </div>
    </div>
  );
}
