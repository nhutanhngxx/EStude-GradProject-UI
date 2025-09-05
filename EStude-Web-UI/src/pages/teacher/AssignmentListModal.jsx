import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  User,
  FileText,
  CheckSquare,
  Paperclip,
  X,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import submissionService from "../../services/submissionService";
import CreateAssignmentModal from "./CreateAssignmentModal";

export default function AssignmentListModal({
  classId,
  classSubjectId,
  isOpen,
  onClose,
}) {
  const [assignments, setAssignments] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [viewMode, setViewMode] = useState("ASSIGNMENTS");
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Chấm điểm thủ công
  const [gradeInput, setGradeInput] = useState("");
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    if (selectedSubmission) {
      setGradeInput(selectedSubmission.score ?? "");
      setCommentInput(selectedSubmission.gradeComment ?? "");
    }
  }, [selectedSubmission]);

  const handleSaveGrade = async () => {
    try {
      //     await teacherService.gradeSubmission(selectedSubmission.submissionId, {
      //       score: gradeInput,
      //       gradeComment: commentInput,
      //     });
      alert("Đã lưu điểm!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu điểm!");
    }
  };

  useEffect(() => {
    if (!isOpen || !classId || !classSubjectId) return;

    const fetchAssignments = async () => {
      try {
        const result = await assignmentService.getAssignmentsByClassId(classId);

        const filtered = (result || []).filter(
          (a) => a.classSubject?.classSubjectId === Number(classSubjectId)
        );

        setAssignments(filtered);
        setViewMode("ASSIGNMENTS");
        setSelectedAssignment(null);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài tập:", error);
      }
    };

    fetchAssignments();
  }, [isOpen, classId, classSubjectId]);

  // Lấy submissions của classSubject khi chọn 1 assignment
  const openSubmissionList = async (assignment) => {
    console.log("assignment:", assignment);

    try {
      setSelectedAssignment(assignment);
      setViewMode("SUBMISSIONS");

      const result = await submissionService.getSubmissionByClassSubject(
        classSubjectId
      );

      console.log("submissions:", result);

      // 🔹 Lọc submissions theo assignmentId
      const filtered = (result || []).filter(
        (s) => s.assignmentId === assignment.assignmentId
      );

      setSubmissions(filtered);
    } catch (error) {
      console.error("Lỗi khi lấy submissions:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-11/12 max-w-6xl h-4/6 p-6 relative shadow-lg overflow-y-auto">
        {/* Nút đóng */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {viewMode === "ASSIGNMENTS" ? (
          <>
            {/* Tiêu đề */}
            <h2 className="text-xl font-semibold mb-4">
              Danh sách bài tập/bài thi
            </h2>

            {/* Nút tạo */}
            <div className="mb-4 flex justify-start">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                + Tạo bài tập/bài thi
              </button>
            </div>

            {/* Danh sách assignments */}
            {assignments.length === 0 ? (
              <p className="text-gray-500">Chưa có bài tập/bài thi nào.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((a) => (
                  <li
                    key={a.assignmentId}
                    className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-gray-500">
                        Loại: {a.type} | Hạn nộp:{" "}
                        {a.dueDate
                          ? new Date(a.dueDate).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </p>
                    </div>

                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => openSubmissionList(a)}
                    >
                      Quản lý
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : viewMode === "SUBMISSIONS" ? (
          <>
            {/* Quay lại */}
            <div className="flex items-center gap-2 mb-4">
              <button
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                onClick={() => setViewMode("ASSIGNMENTS")}
              >
                <ArrowLeft size={18} /> Quay lại
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-3">
              Bài nộp - {selectedAssignment?.title}
            </h2>

            {/* Danh sách submissions */}
            {submissions.length === 0 ? (
              <p className="text-gray-500">Chưa có bài nộp nào.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border text-center">#</th>
                    <th className="p-2 border">Mã SV</th>
                    <th className="p-2 border">Tên sinh viên</th>
                    <th className="p-2 border">Nội dung</th>
                    <th className="p-2 border">Trạng thái</th>
                    <th className="p-2 border">Nộp lúc</th>
                    <th className="p-2 border text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, index) => (
                    <tr key={s.submissionId} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border text-center">
                        {s.studentCode || "?"}
                      </td>
                      <td className="p-2 border">{s.studentName || "-"}</td>
                      <td className="p-2 border">{s.content}</td>
                      <td className="p-2 border text-center">
                        {s.status === "SUBMITTED" ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            ĐÃ NỘP
                          </span>
                        ) : s.status === "LATE" ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                            NỘP TRỄ
                          </span>
                        ) : s.status === "GRADED" ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                            ĐÃ CHẤM
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {s.status}
                          </span>
                        )}
                      </td>

                      <td className="p-2 border">
                        {s.submittedAt
                          ? new Date(s.submittedAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })
                          : "-"}
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            setSelectedSubmission(s);
                            setViewMode("DETAIL");
                          }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <>
            {/* Quay lại submissions */}
            <div className="flex items-center gap-2 mb-6">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
                onClick={() => setViewMode("SUBMISSIONS")}
              >
                <ArrowLeft size={18} /> Quay lại danh sách nộp
              </button>
            </div>

            {/* Tiêu đề */}
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Chi tiết bài nộp –{" "}
              <span className="text-blue-600">
                {selectedSubmission.studentName}
              </span>
            </h2>

            {/* Button nhập điểm khi chưa có điểm */}
            {/* {!selectedSubmission.score && (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 
                   text-gray-700 hover:bg-gray-100 transition mb-5"
              >
                <CheckSquare size={16} /> Nhập điểm
              </button>
            )} */}

            {/* Nội dung chi tiết */}
            <div className="space-y-8 text-sm text-gray-700">
              {/* Thông tin bài nộp */}
              <section>
                <h2 className="flex items-center gap-2 font-semibold mb-3 text-gray-700">
                  <FileText size={18} /> Bài nộp
                </h2>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-medium w-28">Lần nộp:</span>
                    <span>{selectedSubmission.attemptNumber}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium w-28">Nộp lúc:</span>
                    <span>
                      {new Date(selectedSubmission.submittedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium w-28">Trạng thái:</span>
                    <span>
                      {selectedSubmission.status === "SUBMITTED"
                        ? "ĐÃ NỘP"
                        : selectedSubmission.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium w-28">Nội dung:</span>
                    <span>{selectedSubmission.content}</span>
                  </div>
                  {selectedSubmission.fileUrl && (
                    <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline mt-2"
                    >
                      <Paperclip size={16} /> Xem file đính kèm
                    </a>
                  )}
                </div>
              </section>

              {/* Kết quả */}
              <section>
                <h3 className="flex items-center gap-2 font-semibold mb-3 text-gray-700">
                  <CheckSquare size={18} /> Kết quả
                </h3>

                {selectedSubmission.score == null ? (
                  // Form chấm điểm thủ công
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-28">Điểm số:</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        className="w-24 border rounded px-2 py-1 focus:ring focus:ring-blue-300"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="font-medium w-28">Nhận xét:</span>
                      <textarea
                        rows={3}
                        className="flex-1 border rounded px-2 py-1 focus:ring focus:ring-blue-300"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleSaveGrade}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                      <CheckSquare size={18} /> Lưu điểm
                    </button>
                  </div>
                ) : (
                  // Chỉ hiển thị kết quả đã chấm
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="font-medium w-28">Điểm số:</span>
                      <span>{selectedSubmission.score ?? "-"}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-28">Nhận xét:</span>
                      <span>{selectedSubmission.gradeComment ?? "-"}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* Modal tạo bài tập */}
      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType="QUIZ"
        classContext={{ classId }}
        onCreated={(assignment) => {
          setAssignments((prev) => [...prev, assignment]);
        }}
      />
    </div>
  );
}
