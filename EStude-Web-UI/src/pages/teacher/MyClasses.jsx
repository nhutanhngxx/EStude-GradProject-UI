import { useEffect, useState } from "react";
import teacherService from "../../services/teacherService";
import ClassStudentModal from "./ClassStudentModal";

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchMyClasses = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const result = await teacherService.getClassSubjectByTeacherId(
        user.userId
      );
      if (result) setClasses(result);
    };
    fetchMyClasses();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Lớp giảng dạy của tôi
      </h1>

      {classes.length === 0 ? (
        <p className="text-gray-500">
          Bạn chưa được phân công giảng dạy lớp nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.classSubjectId}
              className="bg-white border rounded-xl shadow-md hover:shadow-lg transition p-5 flex flex-col"
            >
              {/* Header */}
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-blue-700">
                  {cls.clazz?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Môn: <span className="font-medium">{cls.subject?.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Học kỳ: {cls.clazz?.term || "-"}
                </p>
              </div>

              {/* Body */}
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Sĩ số:{" "}
                  <span className="font-medium">
                    {cls.clazz?.classSize || 0}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  onClick={() => {
                    setSelectedClass(cls.clazz?.classId);
                    setIsModalOpen(true);
                  }}
                >
                  👥 Xem học sinh
                </button>
                <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  ✅ Điểm danh
                </button>
                <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                  📝 Giao bài tập
                </button>
                <button className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                  🧪 Tạo bài thi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ClassStudentModal
        classId={selectedClass}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
