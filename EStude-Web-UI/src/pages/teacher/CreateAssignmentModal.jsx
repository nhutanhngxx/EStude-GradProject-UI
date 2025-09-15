import React, { useMemo, useState } from "react";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const genId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};

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

  // meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(45);
  const [type, setType] = useState(defaultType);
  const [maxScore, setMaxScore] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenalty, setLatePenalty] = useState(0);
  const [submissionLimit, setSubmissionLimit] = useState(0);
  const [isAutoGraded, setIsAutoGraded] = useState(false);
  const [isExam, setIsExam] = useState(false);

  // question builder
  const [questions, setQuestions] = useState([]);
  const [excelQuestions, setExcelQuestions] = useState([]);

  // uploads (client-side placeholder)
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [importFile, setImportFile] = useState(null);

  // --- computed ---
  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
    [questions]
  );

  // keep maxScore in sync with totalPoints if user hasn't manually changed it
  React.useEffect(() => {
    if (!maxScore || maxScore === 0) {
      setMaxScore(totalPoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPoints]);

  if (!isOpen) return null;

  function close() {
    onClose?.();
  }

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "STT",
        "Nội dung câu hỏi",
        "Loại câu hỏi",
        "Đáp án A",
        "Đáp án B",
        "Đáp án C",
        "Đáp án D",
        "Đáp án đúng",
        "Điểm",
        "Ghi chú",
      ],
      [
        1,
        "Trong tam giác vuông, định lý Pythagore phát biểu như thế nào?",
        "Trắc nghiệm",
        "a² + b² = c²",
        "a² + c² = b²",
        "b² + c² = a²",
        "a² = b² + c²",
        "A",
        1,
        "Ví dụ",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "questions-template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Bỏ dòng tiêu đề
      const rows = jsonData.slice(1);
      const newQuestions = rows.map((row, i) => ({
        stt: row[0] || i + 1,
        content: row[1] || "",
        type: row[2] || "Trắc nghiệm",
        optionA: row[3] || "",
        optionB: row[4] || "",
        optionC: row[5] || "",
        optionD: row[6] || "",
        correct: row[7] || "",
        score: row[8] || 1,
        note: row[9] || "",
      }));

      setExcelQuestions(newQuestions);
      console.log("Câu hỏi import:", newQuestions);
    };
    reader.readAsArrayBuffer(file);
  };

  function addQuestion(kind = "MULTIPLE_CHOICE") {
    if (kind === "MULTIPLE_CHOICE") {
      setQuestions((prev) => [
        ...prev,
        {
          tempId: genId(),
          questionText: "",
          points: 1,
          questionType: "MULTIPLE_CHOICE",
          questionOrder: prev.length + 1,
          options: [
            {
              tempId: genId(),
              optionText: "",
              isCorrect: false,
              optionOrder: 1,
            },
            {
              tempId: genId(),
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
          tempId: genId(),
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
                  tempId: genId(),
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
                .map((o, i) => ({ ...o, optionOrder: i + 1 })),
            }
          : q
      )
    );
  }

  function buildAssignmentPayload() {
    return {
      title,
      description,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      timeLimit: Number(timeLimit) || 0,
      type: type === "MIXED" ? "QUIZ" : type,
      attachmentUrl: attachmentFile ? attachmentFile.name : null, // placeholder — implement real upload if needed
      answerKeyFileUrl: answerKeyFile ? answerKeyFile.name : null, // placeholder
      maxScore: Number(maxScore) || totalPoints || 0,
      isPublished,
      allowLateSubmission,
      latePenalty: Number(latePenalty) || 0,
      submissionLimit: Number(submissionLimit) || 0,
      isAutoGraded,
      isExam,
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

    if (!classContext?.classSubjectId) {
      showToast("Không có ngữ cảnh lớp/môn (classSubjectId).", "error");
      return;
    }

    try {
      if (questions.length === 0) {
        showToast("Vui lòng thêm ít nhất 1 câu hỏi", "warn");
        return;
      }

      const payload = {
        ...buildAssignmentPayload(),
        classSubject: { classSubjectId: classContext.classSubjectId },
        teacher: { userId: teacherId },
      };

      const assignment = await assignmentService.addAssignment(payload);

      const assignmentId = assignment?.data?.assignmentId;

      if (!assignmentId) {
        throw new Error(
          "Server trả về lỗi khi tạo bài tập (assignmentId missing)"
        );
      }

      for (const q of buildQuestionsPayload()) {
        // console.log("Sending question payload:", q);
        await questionService.addQuestion(assignmentId, q);
      }

      setTitle("");
      setDescription("");
      setStartDate("");
      setDueDate("");
      setTimeLimit(45);
      setType("QUIZ");
      setMaxScore(0);
      setIsPublished(false);
      setAllowLateSubmission(false);
      setLatePenalty(0);
      setSubmissionLimit(0);
      setIsAutoGraded(false);
      setIsExam(false);
      setAttachmentFile(null);
      setAnswerKeyFile(null);
      setQuestions([]);
      setTab("build");

      showToast("Tạo bài tập/bài thi thành công!", "success");

      close();
    } catch (err) {
      console.error("Tạo bài thất bại:", err);
      showToast(
        "Không thể tạo bài thi bây giờ. Vui lòng thử lại sau!",
        "error"
      );
    }
  }

  // import questions from a JSON file (expected array of question-like objects)
  const handleImportQuestions = () => {
    if (!importFile) {
      showToast("Vui lòng chọn file JSON chứa câu hỏi", "warn");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed))
          throw new Error("File phải là mảng câu hỏi JSON");

        const parsedQuestions = parsed.map((q, idx) => ({
          tempId: genId(),
          questionText: q.questionText || q.text || "",
          points: Number(q.points) || 1,
          questionType:
            q.questionType || (q.options ? "MULTIPLE_CHOICE" : "ESSAY"),
          questionOrder: idx + 1,
          options: (q.options || []).map((o, jdx) => ({
            tempId: genId(),
            optionText: o.optionText || o.text || "",
            isCorrect: !!o.isCorrect,
            optionOrder: jdx + 1,
          })),
        }));

        setQuestions(parsedQuestions);
        setTab("build");
        showToast(`Đã import ${parsedQuestions.length} câu hỏi`, "success");
      } catch (err) {
        console.error(err);
        showToast("Đọc file thất bại: file không hợp lệ", "error");
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex justify-center items-center">
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

              <div>
                <label className="text-sm text-gray-600">Mô tả</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <CalendarClock size={14} /> Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

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
              </div>

              <div className="flex items-center gap-3">
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

                <div className="flex-1">
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
                    checked={isExam}
                    onChange={(e) => setIsExam(e.target.checked)}
                  />{" "}
                  Đây là bài thi
                </label>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />{" "}
                  Công khai
                </label>

                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                  />{" "}
                  Cho nộp trễ
                </label>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Giới hạn lần nộp:{" "}
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-16 rounded-xl border px-3 py-2"
                    value={submissionLimit}
                    onChange={(e) => setSubmissionLimit(Number(e.target.value))}
                  />
                </label>
              </div>

              {/* 
              {allowLateSubmission && (
                <div>
                  <label className="text-sm text-gray-600">
                    Phạt trễ (số điểm hoặc % do backend xử lý)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(Number(e.target.value))}
                  />
                </div>
              )} */}
            </div>

            {/* Right column: Question builder / Upload */}
            <div className="flex flex-col gap-4">
              {/* If upload tab: show importer */}
              {tab === "upload" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      Chọn file Excel chứa danh sách câu hỏi
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      onChange={handleExcelUpload}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Tải file mẫu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (excelQuestions.length === 0) {
                          showToast("Chưa có dữ liệu từ file Excel", "warn");
                          return;
                        }

                        // Convert excelQuestions -> questions state
                        const parsedQuestions = excelQuestions.map(
                          (q, idx) => ({
                            tempId: genId(),
                            questionText: q.content,
                            points: Number(q.score) || 1,
                            questionType: "MULTIPLE_CHOICE",
                            questionOrder: idx + 1,
                            options: [
                              {
                                tempId: genId(),
                                optionText: q.optionA,
                                isCorrect: q.correct === "A",
                                optionOrder: 1,
                              },
                              {
                                tempId: genId(),
                                optionText: q.optionB,
                                isCorrect: q.correct === "B",
                                optionOrder: 2,
                              },
                              {
                                tempId: genId(),
                                optionText: q.optionC,
                                isCorrect: q.correct === "C",
                                optionOrder: 3,
                              },
                              {
                                tempId: genId(),
                                optionText: q.optionD,
                                isCorrect: q.correct === "D",
                                optionOrder: 4,
                              },
                            ],
                          })
                        );

                        setQuestions(parsedQuestions);
                        setTab("build");
                        showToast(
                          `Đã import ${parsedQuestions.length} câu hỏi từ Excel`,
                          "success"
                        );
                      }}
                      className="items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Import từ Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFile(null);
                        setExcelQuestions([]);
                        setTab("build");
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
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
                                <option value="MULTIPLE_CHOICE">
                                  Trắc nghiệm
                                </option>
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
                                              ? {
                                                  ...x,
                                                  optionText: e.target.value,
                                                }
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
                                <FileText size={16} /> Câu hỏi tự luận — học
                                sinh sẽ nhập câu trả lời dạng văn bản.
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
                </>
              )}

              {/* FILE ĐÍNH KÈM */}
              {/* <div>
                <label className="text-sm text-gray-600">
                  File đính kèm (tài liệu/đề)
                </label>
                <input
                  type="file"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  onChange={(e) =>
                    setAttachmentFile(e.target.files?.[0] ?? null)
                  }
                />
                {attachmentFile && (
                  <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                    <FileText size={14} /> {attachmentFile.name}
                  </div>
                )}
              </div> */}

              {/* ĐÁP ÁN CHUẨN */}
              {/* <div>
                <label className="text-sm text-gray-600">
                  File đáp án chuẩn (nếu có)
                </label>
                <input
                  type="file"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  onChange={(e) =>
                    setAnswerKeyFile(e.target.files?.[0] ?? null)
                  }
                />
                {answerKeyFile && (
                  <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                    <FileText size={14} /> {answerKeyFile.name}
                  </div>
                )}
              </div> */}

              {/* TỰ ĐỘNG CHẤM */}
              {/* <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={isAutoGraded}
                    onChange={(e) => setIsAutoGraded(e.target.checked)}
                  />{" "}
                  Tự động chấm
                </label>
              </div> */}
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
