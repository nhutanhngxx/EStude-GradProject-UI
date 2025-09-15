import { useEffect, useState } from "react";
import teacherService from "../../services/teacherService";
import ClassStudentModal from "./ClassStudentModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import { BookOpen, Users, Calendar, FileText, CheckSquare } from "lucide-react";
import AttendanceModal from "./AttendanceModal";
import AssignmentListModal from "./AssignmentListModal";

const formatDateVN = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export default function MyClasses() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTermIdMap, setSelectedTermIdMap] = useState({}); // lưu học kỳ chọn theo mỗi lớp + môn

  // Bộ lọc
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAssignmentListOpen, setIsAssignmentListOpen] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const fetchMyClasses = async () => {
      const result = await teacherService.getClassSubjectByTeacherId(
        user.userId
      );
      if (result) {
        // console.log("classes:", result);
        setClasses(result);
      }
    };

    fetchMyClasses();
  }, [user.userId]);

  const today = new Date();

  const groupedClasses = Object.values(
    classes.reduce((acc, cls) => {
      const key = `${cls.className}-${cls.subjectName}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          classId: cls.classId,
          className: cls.className ?? "-",
          subjectName: cls.subjectName,
          termList: [],
        };
      }

      acc[key].termList.push({
        classId: cls.classId,
        classSubjectId: cls.classSubjectId,
        termId: cls.termId,
        termName: cls.termName,
        beginDate: cls.beginDate,
        endDate: cls.endDate,
      });

      return acc;
    }, {})
  );

  const filteredClasses = groupedClasses.filter((cls) => {
    if (filterStatus === "all") return true;

    const termMatch = cls.termList.some((t) => {
      const begin = new Date(t.beginDate);
      const end = new Date(t.endDate);
      if (filterStatus === "current") return begin <= today && today <= end;
      if (filterStatus === "upcoming") return today < begin;
      if (filterStatus === "ended") return today > end;
      return true;
    });

    return termMatch;
  });

  const handleTermChange = (classKey, termId) => {
    setSelectedTermIdMap((prev) => ({ ...prev, [classKey]: Number(termId) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Lớp giảng dạy</h1>
        <p className="text-gray-600">Danh sách lớp đang giảng dạy của bạn.</p>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Trạng thái:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="current">Đang diễn ra</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="ended">Đã xong</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <p className="text-gray-500 mt-4">Không có lớp nào phù hợp.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredClasses.map((cls) => {
            const classKey = cls.key;
            const selectedTermId =
              selectedTermIdMap[classKey] || cls.termList[0]?.termId;

            const selectedTerm = cls.termList.find(
              (t) => t.termId === selectedTermId
            );

            return (
              <div
                key={classKey}
                className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
              >
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen className="text-blue-600" size={22} />
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">
                      {cls.className}
                    </h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span className="font-medium">{cls.subjectName}</span>
                    </p>
                  </div>
                </div>

                {/* Học kỳ chọn */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Học kỳ:{" "}
                  </label>
                  <select
                    value={selectedTermId}
                    onChange={(e) => handleTermChange(classKey, e.target.value)}
                    className="px-2 py-1 border rounded-lg w-auto mt-1"
                  >
                    {cls.termList.map((t) => (
                      <option key={t.termId} value={t.termId}>
                        {t.termName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Body */}
                <div className="space-y-2 text-sm text-gray-600 flex-1">
                  <p className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    Sĩ số: <span className="font-medium">0</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    Thời gian:{" "}
                    {selectedTerm
                      ? `${formatDateVN(
                          selectedTerm.beginDate
                        )} - ${formatDateVN(selectedTerm.endDate)}`
                      : "-"}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass({
                        classId: cls.classId,
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: selectedTerm?.termId,
                        termName: selectedTerm?.termName,
                        classSubjectId: selectedTerm?.classSubjectId,
                      });
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 
                       text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Users size={16} />
                    <span>Nhập điểm</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => {
                      setSelectedClass({
                        classId: cls.classId,
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: selectedTerm?.termId,
                        classSubjectId: selectedTerm?.classSubjectId,
                      });
                      setIsAttendanceOpen(true);
                    }}
                  >
                    <CheckSquare size={16} />
                    <span>Điểm danh</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => {
                      setSelectedClass({
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: selectedTerm?.termId,
                        classSubjectId: selectedTerm?.classSubjectId,
                      });
                      setIsAssignmentListOpen(true);
                    }}
                  >
                    <FileText size={16} />
                    <span>Bài tập</span>
                  </button>

                  {/* <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => {
                      setCtx({
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: selectedTerm?.termId,
                        classSubjectId: selectedTerm?.classSubjectId,
                      });
                      setIsCreateOpen(true);
                    }}
                  >
                    <FileText size={16} />
                    <span>Tạo bài tập/bài thi</span>
                  </button> */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
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
        teacherId={user.userId}
        classSubjectId={selectedClass?.classSubjectId}
        classId={selectedClass?.classId}
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
      />

      <AssignmentListModal
        classSubjectId={selectedClass?.classSubjectId}
        isOpen={isAssignmentListOpen}
        onClose={() => setIsAssignmentListOpen(false)}
      />
    </div>
  );
}
