import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import studentStudyService from "../../services/studentStudyService";
import { useToast } from "../../contexts/ToastContext";

const DetailStudy = () => {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const tabs = ["Tổng quan", "Tổng kết"];
  const [activeTab, setActiveTab] = useState("Tổng quan");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");
  const [subjects, setSubjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const gradesData =
          await studentStudyService.getAllSubjectGradesOfStudent(user.userId);

        const flattenedSubjects =
          gradesData?.flatMap((term) =>
            term.subjects.map((subject) => ({
              ...subject,
              termName: term.termName,
              termId: term.termId,
              beginDate: term.beginDate,
              completed: subject.actualAverage ? 1 : 0,
              total: 1,
              atRisk: subject.actualAverage && subject.actualAverage < 5,
              gpa: subject.actualAverage || 0,
              name: subject.subjectName,
              clazz: {
                name: subject.className,
                terms: [{ name: term.termName }],
                homeroomTeacher: subject.teacherName,
              },
              grade: subject,
            }))
          ) || [];

        setSubjects(flattenedSubjects);

        const overviewData = await studentStudyService.getAcademicRecords(
          user.userId
        );
        if (overviewData) {
          setOverview({
            gpa: overviewData.averageScore ?? 0,
            rank: overviewData.rank ?? "-",
            totalStudents: overviewData.totalStudents ?? "-",
            passedCredits: overviewData.completedSubjects ?? 0,
            requiredCredits: overviewData.totalSubjects ?? 0,
            submissionRate: overviewData.submissionRate ?? 0,
            attendanceRate: overviewData.attendanceRate ?? 0,
          });
        }
      } catch (err) {
        console.error("Load student data failed:", err);
        showToast("Lỗi khi tải dữ liệu học tập!", "error");
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const filteredSubjects = subjects
    .filter((sub) => {
      if (filter === "all") return true;
      if (filter === "atRisk") return sub.atRisk;
      if (filter === "completed") return sub.completed === sub.total;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "gpa":
          return (b.gpa ?? 0) - (a.gpa ?? 0);
        case "progress":
          return b.completed / (b.total || 1) - a.completed / (a.total || 1);
        case "atRisk":
          return (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0);
        default:
          return 0;
      }
    });

  const groupedSubjects = filteredSubjects.reduce((acc, s) => {
    const term = s.termName;
    if (!acc[term]) {
      acc[term] = { subjects: [], beginDate: s.beginDate };
    }
    acc[term].subjects.push(s);
    return acc;
  }, {});

  const termKeys = Object.keys(groupedSubjects).sort(
    (a, b) =>
      new Date(groupedSubjects[a].beginDate) -
      new Date(groupedSubjects[b].beginDate)
  );

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSummary = (termSubjects) => {
    if (termSubjects.length === 0) {
      return {
        average: 0,
        rank: "Không có dữ liệu",
        status: "Không xác định",
        conduct: "Tốt",
      };
    }
    const averages = termSubjects
      .map((s) => s.grade?.actualAverage)
      .filter((avg) => avg !== undefined && avg !== null);
    const avg =
      averages.length > 0
        ? averages.reduce((sum, a) => sum + a, 0) / averages.length
        : 0;
    let rank = "Yếu";
    if (avg >= 8) rank = "Giỏi";
    else if (avg >= 6.5) rank = "Khá";
    else if (avg >= 5) rank = "Trung bình";
    const allPassed = termSubjects.every(
      (s) => (s.grade?.actualAverage ?? 0) >= 5
    );
    const status = allPassed ? "Hoàn thành" : "Cảnh báo";
    return { average: avg.toFixed(2), rank, status, conduct: "Tốt" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Chi tiết học tập
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Xem chi tiết điểm số và kết quả học tập
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg transition ${
              activeTab === tab
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "Tổng quan" && (
        <div className="space-y-6">
          {/* Overview Card */}
          {overview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tổng quan học tập
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    GPA
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {overview.gpa.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Xếp hạng
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {overview.rank}/{overview.totalStudents}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Môn hoàn thành
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {overview.passedCredits}/{overview.requiredCredits}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Tỷ lệ nộp bài
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {overview.submissionRate}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lọc theo
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">Tất cả</option>
                  <option value="atRisk">Môn rủi ro</option>
                  <option value="completed">Môn hoàn thành</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sắp xếp theo
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="default">Mặc định</option>
                  <option value="gpa">GPA giảm dần</option>
                  <option value="progress">Tiến độ giảm dần</option>
                  <option value="atRisk">Môn rủi ro trước</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject, index) => {
              const subjectPercent = Math.round(
                ((subject.completed ?? 0) / (subject.total || 1)) * 100
              );
              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                    subject.atRisk ? "border-l-4 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          subject.atRisk
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.termName}
                      </p>
                    </div>
                    {subject.atRisk && (
                      <span className="text-red-600 text-xl">⚠</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Điểm TB:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {subject.gpa ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Điểm danh:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {subject.completed ?? 0}/{subject.total ?? 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${subjectPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-right">
                      {subjectPercent}% hoàn thành
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                Không có môn học phù hợp
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Tổng kết" && (
        <div className="space-y-6">
          {termKeys.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                Không có dữ liệu tổng kết
              </p>
            </div>
          ) : (
            termKeys.map((term) => {
              const termSubjects = groupedSubjects[term].subjects;
              const summary = calculateSummary(termSubjects);

              return (
                <div
                  key={term}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {term}
                    </h3>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Tên môn học
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Điểm TB
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {termSubjects.map((s, idx) => {
                            const key = `${term}-${s.subjectGradeId}`;
                            const isExpanded = expanded[key];

                            return (
                              <React.Fragment key={idx}>
                                <tr
                                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                  onClick={() => toggleExpand(key)}
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {s.name}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                    {s.grade?.actualAverage ?? "-"}
                                  </td>
                                </tr>

                                {/* Expanded Details */}
                                {isExpanded && (
                                  <tr>
                                    <td
                                      colSpan="2"
                                      className="px-4 py-4 bg-gray-50 dark:bg-gray-700"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Giữa kỳ (30%)
                                          </span>
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {s.grade?.midtermScore ?? "-"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Thường kỳ (20%)
                                          </span>
                                          <div className="flex gap-2">
                                            {(() => {
                                              const scores =
                                                s.grade?.regularScores ?? [];
                                              const display = [...scores];
                                              while (display.length < 5)
                                                display.push("-");
                                              return display
                                                .slice(0, 5)
                                                .map((sc, i) => (
                                                  <span
                                                    key={i}
                                                    className="px-2 py-1 bg-white dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100"
                                                  >
                                                    {sc}
                                                  </span>
                                                ));
                                            })()}
                                          </div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Cuối kỳ (50%)
                                          </span>
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {s.grade?.finalScore ?? "-"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Tổng kết
                                          </span>
                                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {s.grade?.actualAverage ?? "-"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Xếp loại
                                          </span>
                                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {s.grade?.rank ?? "-"}
                                          </span>
                                        </div>
                                        {s.grade?.practiceScores?.length >
                                          0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                              Thực hành
                                            </span>
                                            <div className="flex gap-2">
                                              {s.grade.practiceScores.map(
                                                (sc, i) => (
                                                  <span
                                                    key={i}
                                                    className="px-2 py-1 bg-white dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100"
                                                  >
                                                    {sc}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Điểm TB cộng
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {summary.average}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Xếp loại học lực
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {summary.rank}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Trạng thái học vụ
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {summary.status}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Xếp loại hạnh kiểm
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {summary.conduct}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default DetailStudy;
