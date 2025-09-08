import { useEffect, useState } from "react";
import teacherService from "../../services/teacherService";
import ClassStudentModal from "./ClassStudentModal";
import CreateAssignmentModal from "./CreateAssignmentModal";

import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  CheckSquare,
  FlaskConical,
} from "lucide-react";
import AttendanceModal from "./AttendanceModal";
import AssignmentListModal from "./AssignmentListModal";

export default function MyClasses() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tạo bài thi
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ctx, setCtx] = useState(null);

  // Điểm danh
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  // Quản lý bài tập
  const [isAssignmentListOpen, setIsAssignmentListOpen] = useState(false);

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Lớp giảng dạy</h1>
        <p className="text-gray-600">Danh sách lớp đang giảng dạy của bạn.</p>
      </div>

      {classes.length === 0 ? (
        <p className="text-gray-500">
          Bạn chưa được phân công giảng dạy lớp nào.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.classSubjectId}
              className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <BookOpen className="text-blue-600" size={22} />
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    {cls.clazz?.name}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span className="font-medium">{cls.subject?.name}</span>
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2 text-sm text-gray-600 flex-1">
                <p className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  Sĩ số:{" "}
                  <span className="font-medium">
                    {cls.clazz?.classSize || 0}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  Học kỳ: {cls.clazz?.term || "-"}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedClass({
                      classId: cls.clazz?.classId,
                      classSubjectId: cls.classSubjectId,
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 
                     text-gray-700 hover:bg-gray-100 transition"
                >
                  <Users size={16} />
                  <span>Xem học sinh</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => {
                    setSelectedClass({
                      classSubjectId: cls.classSubjectId,
                      classId: cls.clazz?.classId,
                    });
                    setIsAttendanceOpen(true);
                  }}
                >
                  <CheckSquare size={16} />
                  <span>Quản lý điểm danh</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => {
                    setSelectedClass({
                      classId: cls.clazz?.classId,
                      classSubjectId: cls.classSubjectId,
                    });
                    setIsAssignmentListOpen(true);
                  }}
                >
                  <FileText size={16} />
                  <span>Quản lý bài tập</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => {
                    setCtx({
                      classSubjectId: cls.classSubjectId,
                      classId: cls.clazz?.classId,
                      className: cls.clazz?.name,
                      subjectId: cls.subject?.subjectId,
                      subjectName: cls.subject?.name,
                    });
                    setIsCreateOpen(true);
                  }}
                >
                  <FileText size={16} />
                  <span>Tạo bài tập/bài thi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ClassStudentModal
        classId={selectedClass?.classId}
        classSubjectId={selectedClass?.classSubjectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType="QUIZ"
        classContext={ctx}
        onCreated={(assignment) => {
          console.log("Assignment đã được tạo:", assignment);
        }}
      />

      <AttendanceModal
        classSubjectId={selectedClass?.classSubjectId}
        classId={selectedClass?.classId}
        teacherId={user.userId}
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
      />

      <AssignmentListModal
        classId={selectedClass?.classId}
        classSubjectId={selectedClass?.classSubjectId}
        isOpen={isAssignmentListOpen}
        onClose={() => setIsAssignmentListOpen(false)}
      />
    </div>
  );
}
