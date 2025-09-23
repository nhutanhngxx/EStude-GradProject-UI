import { useEffect, useState } from "react";
import { X, ListChecks, Save } from "lucide-react";
import studentService from "../../services/studentService";
import subjectGradeService from "../../services/subjectGradeService";
import { useToast } from "../../contexts/ToastContext";
import aiService from "../../services/aiService";

export default function ClassStudentModal({
  classId,
  classSubjectId,
  isOpen,
  onClose,
}) {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    studentId: null,
    value: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user?.admin === true);
      } catch (err) {
        console.error("Parse user error:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      const studentsRes = await studentService.getStudentsByClass(classId);
      if (!studentsRes) return;

      setStudents(studentsRes);

      console.log("classId, classSubjectId:", classId, classSubjectId);

      // Lấy điểm của từng học sinh
      const gradesRes = await Promise.all(
        studentsRes.map((s) =>
          subjectGradeService.getGradesOfStudentByClassSubject(
            s.userId,
            classSubjectId
          )
        )
      );

      const initGrades = {};
      studentsRes.forEach((s, idx) => {
        const g = gradesRes[idx];
        if (g) {
          initGrades[s.userId] = {
            regularScores: g.regularScores || ["", "", "", "", ""],
            midtermScore: g.midtermScore ?? "",
            finalScore: g.finalScore ?? "",
            actualAverage: g.actualAverage ?? "",
            comment: g.comment ?? "",
            lockedRegular: (g.regularScores || ["", "", "", "", ""]).map(
              (x) => !!x // chỉ lock khi có giá trị truthy (số điểm hoặc text), còn null/"" thì không lock
            ),
            lockedMidterm: g.midtermScore ? true : false,
            lockedFinal: g.finalScore ? true : false,
            lockedComment: g.comment ? true : false,
          };
        } else {
          initGrades[s.userId] = {
            regularScores: ["", "", "", "", "", ""],
            midtermScore: "",
            finalScore: "",
            actualAverage: "",
            comment: "",
            lockedRegular: [false, false, false, false, false],
            lockedMidterm: false,
            lockedFinal: false,
            lockedComment: false,
          };
        }
      });

      setGrades(initGrades);
    };

    fetchData();
  }, [classId, classSubjectId, isOpen]);

  const handleChange = (userId, field, value, index = null) => {
    setGrades((prev) => {
      const studentGrade = { ...prev[userId] };

      if (field === "regularScores" && index !== null) {
        const scores = [...(studentGrade[field] || [])];
        scores[index] = value === "" ? "" : Number(value);
        studentGrade[field] = scores;
      } else if (field === "midtermScore") {
        studentGrade.midtermScore = value === "" ? "" : Number(value);
      } else if (field === "finalScore") {
        studentGrade.finalScore = value === "" ? "" : Number(value);
      } else if (field === "comment") {
        studentGrade.comment = value;
      }

      return {
        ...prev,
        [userId]: studentGrade,
      };
    });
  };

  const handleSaveOne = async (student) => {
    const g = grades[student.userId];
    if (!g) return;

    const payload = {
      studentId: student.userId,
      classSubjectId,
      regularScores: g.regularScores.filter((v) => v !== "" && v != null),
      midtermScore: g.midtermScore === "" ? null : g.midtermScore,
      finalScore: g.finalScore === "" ? null : g.finalScore,
      comment: g.comment || null,
    };

    try {
      const res = await subjectGradeService.saveGrade(payload);
      // Sau khi lưu thì khóa toàn bộ ô đã có dữ liệu (chỉ nếu không phải admin)
      setGrades((prev) => {
        const studentGrade = { ...prev[student.userId] };
        if (!isAdmin) {
          studentGrade.lockedRegular = studentGrade.regularScores.map(
            (v) => v !== ""
          );
          studentGrade.lockedMidterm = studentGrade.midtermScore !== "";
          studentGrade.lockedFinal = studentGrade.finalScore !== "";
          studentGrade.lockedComment = studentGrade.comment !== "";
        }
        studentGrade.actualAverage = res?.actualAverage ?? g.actualAverage;
        return {
          ...prev,
          [student.userId]: studentGrade,
        };
      });

      if (res) showToast(`Đã lưu điểm cho ${student.fullName}`, "success");

      await aiService.predictSubjectsForStudent(student.userId);
      await aiService.predictStudentGPA(student.userId);
    } catch (err) {
      console.error(err);
      alert("Lưu điểm thất bại!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed -top-6 left-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-400 w-5/6 max-w-7xl h-3/5 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <ListChecks className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Danh sách học sinh
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
            <table
              className="w-full text-sm text-left table-auto border-separate"
              style={{ borderSpacing: 0 }}
            >
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-3 py-2 rounded-tl-lg">Tên học sinh</th>
                  <th className="px-3 py-2">Điểm thường xuyên</th>
                  <th className="px-3 py-2">Giữa kỳ</th>
                  <th className="px-3 py-2">Cuối kỳ</th>
                  <th className="px-3 py-2">Trung bình</th>
                  <th className="px-3 py-2">Nhận xét</th>
                  <th className="px-3 py-2 rounded-tr-lg">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const g = grades[s.userId] || {};
                  return (
                    <tr
                      key={s.userId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        {s.fullName}
                      </td>
                      <td className="px-3 py-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <input
                            key={i}
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={g.regularScores?.[i] ?? ""}
                            disabled={!isAdmin && g.lockedRegular?.[i]}
                            onChange={(e) =>
                              handleChange(
                                s.userId,
                                "regularScores",
                                e.target.value,
                                i
                              )
                            }
                            className="w-16 mx-1 px-1 py-0.5 border rounded text-center
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    border-gray-300 dark:border-gray-600
                    focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400
                    disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                          />
                        ))}
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={g.midtermScore ?? ""}
                          disabled={!isAdmin && g.lockedMidterm}
                          onChange={(e) =>
                            handleChange(
                              s.userId,
                              "midtermScore",
                              e.target.value
                            )
                          }
                          className="w-16 px-1 py-0.5 border rounded text-center
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  border-gray-300 dark:border-gray-600
                  focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400
                  disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Final */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={g.finalScore ?? ""}
                          disabled={!isAdmin && g.lockedFinal}
                          onChange={(e) =>
                            handleChange(s.userId, "finalScore", e.target.value)
                          }
                          className="w-16 px-1 py-0.5 border rounded text-center
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  border-gray-300 dark:border-gray-600
                  focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400
                  disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Trung bình */}
                      <td className="px-3 py-2">
                        <div
                          className="w-16 min-h-[28px] px-1 py-0.5 border rounded text-center
      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
      border-gray-300 dark:border-gray-600
      focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400
      disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {
                            g.actualAverage ??
                              "\u00A0" /* nếu null thì hiển thị khoảng trắng */
                          }
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div
                          onClick={() =>
                            setCommentModal({
                              isOpen: true,
                              studentId: s.userId,
                              value: g.comment ?? "",
                            })
                          }
                          className="cursor-pointer w-full rounded text-gray-900 dark:text-gray-100
               overflow-hidden whitespace-nowrap text-ellipsis"
                          style={{ maxWidth: "200px" }}
                        >
                          {g.comment ? g.comment : "Thêm nhận xét"}
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSaveOne(s)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          <Save size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {commentModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-1/3 p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">
              Nhận xét cho học sinh
            </h3>
            <textarea
              value={commentModal.value}
              onChange={(e) =>
                setCommentModal((prev) => ({
                  ...prev,
                  value: e.target.value,
                }))
              }
              className="w-full h-32 p-3 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() =>
                  setCommentModal({
                    isOpen: false,
                    studentId: null,
                    value: "",
                  })
                }
                className="px-4 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleChange(
                    commentModal.studentId,
                    "comment",
                    commentModal.value
                  );
                  setCommentModal({
                    isOpen: false,
                    studentId: null,
                    value: "",
                  });
                }}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
