import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  User,
  FileText,
  CheckSquare,
  Paperclip,
  X,
  Plus,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import submissionService from "../../services/submissionService";
import CreateAssignmentModal from "./CreateAssignmentModal";
import { useToast } from "../../contexts/ToastContext";

export default function AssignmentListModal({
  classSubjectId,
  isOpen,
  onClose,
}) {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState("ASSIGNMENTS");
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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
      await submissionService.gradeSubmission(selectedSubmission.submissionId, {
        score: gradeInput ? Number(gradeInput) : null,
        gradeComment: commentInput || null,
      });
      showToast("Đã lưu điểm!", "success");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submissionId === selectedSubmission.submissionId
            ? {
                ...s,
                score: gradeInput ? Number(gradeInput) : null,
                gradeComment: commentInput,
                status: "GRADED",
              }
            : s
        )
      );
      setSelectedSubmission((prev) => ({
        ...prev,
        score: gradeInput ? Number(gradeInput) : null,
        gradeComment: commentInput,
        status: "GRADED",
      }));
    } catch (error) {
      console.error("Lỗi khi lưu điểm:", error);
      showToast("Lỗi khi lưu điểm!", "error");
    }
  };

  useEffect(() => {
    if (!isOpen || !classSubjectId) return;

    const fetchAssignments = async () => {
      try {
        const result = await assignmentService.getAssignmentsByClassSubjectId(
          classSubjectId
        );
        setAssignments(result || []);
        setViewMode("ASSIGNMENTS");
        setSelectedAssignment(null);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài tập:", error);
        showToast("Lỗi khi lấy danh sách bài tập!", "error");
      }
    };

    fetchAssignments();
  }, [isOpen, classSubjectId, showToast]);

  const openSubmissionList = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      setViewMode("SUBMISSIONS");
      const result = await submissionService.getSubmissionByClassSubject(
        classSubjectId
      );
      const filtered = (result || []).filter(
        (s) => s.assignmentId === assignment.assignmentId
      );
      setSubmissions(filtered);
    } catch (error) {
      console.error("Lỗi khi lấy submissions:", error);
      showToast("Lỗi khi lấy danh sách bài nộp!", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-600 w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 max-w-6xl h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {viewMode === "ASSIGNMENTS"
                ? "Danh sách bài tập/bài thi"
                : viewMode === "SUBMISSIONS"
                ? `Bài nộp - ${selectedAssignment?.title}`
                : `Chi tiết bài nộp – ${selectedSubmission?.studentName}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {viewMode === "ASSIGNMENTS" ? (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <Plus size={18} /> Tạo bài tập/bài thi
                </button>
              </div>

              {assignments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có bài tập/bài thi nào.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map((a) => (
                    <li
                      key={a.assignmentId}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {a.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {a.type === "QUIZ"
                            ? "TRẮC NGHIỆM"
                            : a.type === "ASSIGNMENT"
                            ? "BÀI TẬP"
                            : a.type === "EXAM"
                            ? "BÀI THI"
                            : a.type}{" "}
                          | Hạn nộp:{" "}
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
                        className="text-green-600 dark:text-green-200 hover:underline mt-2 sm:mt-0"
                        onClick={() => openSubmissionList(a)}
                      >
                        Quản lý bài nộp
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : viewMode === "SUBMISSIONS" ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setViewMode("ASSIGNMENTS")}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ArrowLeft size={18} /> Quay lại
                </button>
              </div>

              {submissions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có bài nộp nào.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
                  <table
                    className="w-full text-sm text-left table-auto border-separate"
                    style={{ borderSpacing: 0 }}
                  >
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="p-3 rounded-tl-lg text-center">#</th>
                        <th className="p-3">Mã SV</th>
                        <th className="p-3">Tên sinh viên</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3">Nộp lúc</th>
                        <th className="p-3 rounded-tr-lg text-center">
                          Xem chi tiết
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, index) => (
                        <tr
                          key={s.submissionId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-center text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-center text-gray-900 dark:text-gray-100">
                            {s.studentCode || "?"}
                          </td>
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            {s.studentName || "-"}
                          </td>
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-center">
                            <span
                              className={`px-2 py-1 rounded font-medium
                              ${
                                s.status === "SUBMITTED"
                                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                  : s.status === "LATE"
                                  ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                  : s.status === "GRADED"
                                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {s.status === "SUBMITTED"
                                ? "ĐÃ NỘP"
                                : s.status === "LATE"
                                ? "NỘP TRỄ"
                                : s.status === "GRADED"
                                ? "ĐÃ CHẤM"
                                : s.status}
                            </span>
                          </td>
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            {s.submittedAt
                              ? new Date(s.submittedAt).toLocaleString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="p-3 border border-gray-300 dark:border-gray-600 text-center">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:underline"
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
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setViewMode("SUBMISSIONS")}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ArrowLeft size={18} /> Quay lại danh sách nộp
                </button>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="flex items-center gap-2 font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    <FileText size={18} /> Bài nộp
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex gap-2">
                      <span className="font-medium w-28">Lần nộp:</span>
                      <span>{selectedSubmission.attemptNumber}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-28">Nộp lúc:</span>
                      <span>
                        {new Date(
                          selectedSubmission.submittedAt
                        ).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-28">Trạng thái:</span>
                      <span>
                        {selectedSubmission.status === "SUBMITTED"
                          ? "ĐÃ NỘP"
                          : selectedSubmission.status === "LATE"
                          ? "NỘP TRỄ"
                          : selectedSubmission.status === "GRADED"
                          ? "ĐÃ CHẤM"
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
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        <Paperclip size={16} /> Xem file đính kèm
                      </a>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    <CheckSquare size={18} /> Kết quả
                  </h3>
                  {selectedSubmission.score == null ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium w-28 text-gray-900 dark:text-gray-100">
                          Điểm số:
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                          value={gradeInput}
                          onChange={(e) => setGradeInput(e.target.value)}
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium w-28 text-gray-900 dark:text-gray-100">
                          Nhận xét:
                        </span>
                        <textarea
                          rows={3}
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleSaveGrade}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition"
                      >
                        <CheckSquare size={18} /> Lưu điểm
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
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

        <CreateAssignmentModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          defaultType="QUIZ"
          classContext={{ classSubjectId }}
          onCreated={(assignment) => {
            setAssignments((prev) => [...prev, assignment]);
            // showToast("Tạo bài tập/bài thi thành công!", "success");
          }}
        />
      </div>
    </div>
  );
}
