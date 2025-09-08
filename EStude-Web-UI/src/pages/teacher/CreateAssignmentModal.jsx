import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  X,
  FilePlus2,
  BookOpen,
  ListChecks,
  UploadCloud,
  Clock,
  CalendarClock,
  Settings2,
  Plus,
  Trash2,
  LayoutGrid,
  Eye,
  FileText,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import questionService from "../../services/questionService";

import { useToast } from "../../contexts/ToastContext";

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  defaultType = "QUIZ",
  classContext,
  onCreated,
}) {
  const { showToast } = useToast();

  const [tab, setTab] = useState("build");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherId = user.userId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(45);
  const [type, setType] = useState(defaultType);
  const [maxScore, setMaxScore] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenalty, setLatePenalty] = useState(0);

  const [questions, setQuestions] = useState([]);

  // --- Upload state ---
  const [file, setFile] = useState(null);

  // Tính tổng điểm
  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
    [questions]
  );

  React.useEffect(() => {
    if (!maxScore || maxScore === 0) {
      setMaxScore(totalPoints);
    }
  }, [totalPoints]);

  if (!isOpen) return null;

  function close() {
    onClose?.();
  }

  function addQuestion(kind = "MULTIPLE_CHOICE") {
    if (kind === "MULTIPLE_CHOICE") {
      setQuestions((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          questionText: "",
          points: 1,
          questionType: "MULTIPLE_CHOICE",
          questionOrder: prev.length + 1,
          options: [
            {
              tempId: crypto.randomUUID(),
              optionText: "",
              isCorrect: false,
              optionOrder: 1,
            },
            {
              tempId: crypto.randomUUID(),
              optionText: "",
              isCorrect: false,
              optionOrder: 2,
            },
          ],
        },
      ]);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          questionText: "",
          points: 1,
          questionType: "ESSAY",
          questionOrder: prev.length + 1,
          options: [],
        },
      ]);
    }
  }

  function removeQuestion(tempId) {
    setQuestions((prev) =>
      prev
        .filter((q) => q.tempId !== tempId)
        .map((q, idx) => ({ ...q, questionOrder: idx + 1 }))
    );
  }

  function updateQuestion(tempId, patch) {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, ...patch } : q))
    );
  }

  function addOption(qid) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === qid
          ? {
              ...q,
              options: [
                ...q.options,
                {
                  tempId: crypto.randomUUID(),
                  optionText: "",
                  isCorrect: false,
                  optionOrder: q.options.length + 1,
                },
              ],
            }
          : q
      )
    );
  }

  function removeOption(qid, oid) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === qid
          ? {
              ...q,
              options: q.options
                .filter((o) => o.tempId !== oid)
                .map((o, idx) => ({ ...o, optionOrder: idx + 1 })),
            }
          : q
      )
    );
  }

  function buildAssignmentPayload() {
    return {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      timeLimit: Number(timeLimit) || 0,
      type: type === "MIXED" ? "QUIZ" : type,
      attachmentUrl: file ? file.name : null,
      maxScore: Number(maxScore) || totalPoints || 0,
      isPublished,
      allowLateSubmission,
      latePenalty: Number(latePenalty) || 0,
    };
  }

  function buildQuestionsPayload() {
    return questions.map((q, idx) => ({
      questionText: q.questionText,
      points: Number(q.points) || 0,
      questionType: q.questionType,
      questionOrder: idx + 1,
      options:
        q.questionType === "MULTIPLE_CHOICE"
          ? q.options.map((o, jdx) => ({
              optionText: o.optionText,
              isCorrect: !!o.isCorrect,
              optionOrder: jdx + 1,
              explanation: o.explanation || "",
            }))
          : [],
    }));
  }

  async function handleSubmit(e) {
    e?.preventDefault();

    if (!title.trim()) {
      showToast("Vui lòng nhập tiêu đề bài thi", "warn");
      return;
    }

    // console.log("classContext:", classContext);
    // console.log("buildAssignmentPayload:", buildAssignmentPayload());

    try {
      // Nếu chưa điền câu hỏi không cho add
      if (questions.length === 0) {
        showToast("Vui lòng thêm ít nhất 1 câu hỏi", "warn");
        return;
      }
      const assignment = await assignmentService.addAssignment({
        ...buildAssignmentPayload(),
        classSubject: { classSubjectId: classContext.classSubjectId },
        teacher: { userId: teacherId },
      });
      if (questions.length > 0) {
        for (const q of buildQuestionsPayload()) {
          await questionService.addQuestion(assignment.assignmentId, q);
        }
      }
      onCreated?.(assignment);
      showToast("Tạo bài tập/bài thi thành công!", "success");
      setTitle("");
      setDescription("");
      setDueDate("");
      setTimeLimit(45);
      setType("QUIZ");
      setMaxScore(0);
      setIsPublished(false);
      setAllowLateSubmission(false);
      setLatePenalty(0);
      setFile(null);
      setTab("build");
      setQuestions([]);
      close();
    } catch (e) {
      console.error(e);
      showToast(
        "Không thể tạo bài thi bây giờ. Vui lòng thử lại sau!",
        "error"
      );
    }
  }

  return (
    <div className="fixed -top-6 left-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 w-full max-w-7xl rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <FilePlus2 className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold">Tạo bài tập/bài thi</h2>
            {classContext?.className && (
              <span className="ml-2 text-sm text-gray-500 flex items-center gap-1">
                <BookOpen size={16} /> {classContext.className}
                {classContext.subjectName ? (
                  <>
                    <span className="mx-1">·</span>
                    {classContext.subjectName}
                  </>
                ) : null}
              </span>
            )}
          </div>
          <button onClick={close} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 flex items-center gap-2">
          <button
            onClick={() => setTab("build")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              tab === "build"
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid size={16} /> Tạo trực tiếp
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              tab === "upload"
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <UploadCloud size={16} /> Tải từ file
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Meta info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Tiêu đề</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra giữa kỳ – Phần 1"
                />
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <CalendarClock size={14} /> Hạn nộp
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="w-40">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock size={14} /> Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Settings2 size={14} /> Loại bài
                </label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="QUIZ">Trắc nghiệm</option>
                  <option value="ESSAY">Tự luận</option>
                  <option value="MIXED">Kết hợp</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Điểm tối đa của bài tập/bài thi
                </label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tổng điểm câu hỏi hiện tại: {totalPoints}
                </p>
              </div>

              <div className="flex items-center justify-end gap-4">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  Công khai
                </label>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                  />
                  Cho nộp trễ
                </label>
              </div>
            </div>

            {/* Right column: Question builder */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                  <ListChecks size={18} /> Câu hỏi
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addQuestion("MULTIPLE_CHOICE")}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={16} /> Trắc nghiệm
                  </button>
                  <button
                    onClick={() => addQuestion("ESSAY")}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={16} /> Tự luận
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
                {questions.length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-gray-400">
                    Chưa có câu hỏi nào.
                  </div>
                )}

                {questions.map((q) => (
                  <div
                    key={q.tempId}
                    className="rounded-xl border bg-white shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <select
                            className="rounded-lg border px-2 py-1 text-sm"
                            value={q.questionType}
                            onChange={(e) =>
                              updateQuestion(q.tempId, {
                                questionType: e.target.value,
                              })
                            }
                          >
                            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                            <option value="ESSAY">Tự luận</option>
                          </select>
                          <input
                            className="flex-1 rounded-lg border px-3 py-2"
                            placeholder="Nhập nội dung câu hỏi"
                            value={q.questionText}
                            onChange={(e) =>
                              updateQuestion(q.tempId, {
                                questionText: e.target.value,
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            className="w-24 rounded-lg border px-3 py-2 text-sm"
                            value={q.points}
                            onChange={(e) =>
                              updateQuestion(q.tempId, {
                                points: Number(e.target.value),
                              })
                            }
                          />
                        </div>

                        {q.questionType === "MULTIPLE_CHOICE" && (
                          <div className="mt-2 space-y-2">
                            {q.options.map((o) => (
                              <div
                                key={o.tempId}
                                className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg"
                              >
                                <input
                                  type="checkbox"
                                  className="accent-blue-600"
                                  checked={!!o.isCorrect}
                                  onChange={(e) =>
                                    updateQuestion(q.tempId, {
                                      options: q.options.map((x) =>
                                        x.tempId === o.tempId
                                          ? {
                                              ...x,
                                              isCorrect: e.target.checked,
                                            }
                                          : x
                                      ),
                                    })
                                  }
                                />
                                <input
                                  className="flex-1 rounded-lg border px-3 py-2"
                                  placeholder="Nội dung phương án"
                                  value={o.optionText}
                                  onChange={(e) =>
                                    updateQuestion(q.tempId, {
                                      options: q.options.map((x) =>
                                        x.tempId === o.tempId
                                          ? { ...x, optionText: e.target.value }
                                          : x
                                      ),
                                    })
                                  }
                                />
                                <button
                                  className="p-2 rounded-lg hover:bg-gray-200"
                                  onClick={() =>
                                    removeOption(q.tempId, o.tempId)
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addOption(q.tempId)}
                              className="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            >
                              <Plus size={16} /> Thêm phương án
                            </button>
                          </div>
                        )}

                        {q.questionType === "ESSAY" && (
                          <div className="text-sm text-gray-500 flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                            <FileText size={16} /> Câu hỏi tự luận — học sinh sẽ
                            nhập câu trả lời dạng văn bản.
                          </div>
                        )}
                      </div>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-200"
                        onClick={() => removeQuestion(q.tempId)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ListChecks size={16} /> {questions.length} câu hỏi
            </span>
            <span className="flex items-center gap-1">
              <Eye size={16} /> Tổng điểm: {totalPoints}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              onClick={close}
            >
              Huỷ
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Lưu bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
