import React, { useState, useEffect } from "react";
import analyticsService from "../../services/analyticsService";
import { useToast } from "../../contexts/ToastContext";
import DifficultyChart from "../../components/analytics/DifficultyChart";
import SubjectDistributionChart from "../../components/analytics/SubjectDistributionChart";
import { FileQuestion, TrendingUp, AlertTriangle } from "lucide-react";

/**
 * Admin Analytics Component - Hiển thị thống kê ngân hàng câu hỏi
 */
const AdminAnalytics = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [usageRanking, setUsageRanking] = useState([]);
  const [needsImprovement, setNeedsImprovement] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log("🔍 [AdminAnalytics] Starting fetch...");
        console.log(
          "🔑 [AdminAnalytics] Token:",
          localStorage.getItem("accessToken") ? "EXISTS" : "MISSING"
        );

        const [overviewData, rankingData, improvementData] = await Promise.all([
          analyticsService.getQuestionBankOverview(),
          analyticsService.getQuestionUsageRanking(10),
          analyticsService.getQuestionsNeedingImprovement(),
        ]);

        console.log("✅ [AdminAnalytics] Overview data:", overviewData);
        console.log("✅ [AdminAnalytics] Ranking data:", rankingData);
        console.log("✅ [AdminAnalytics] Improvement data:", improvementData);

        setOverview(overviewData);
        setUsageRanking(rankingData);
        setNeedsImprovement(improvementData);

        console.log("✅ [AdminAnalytics] Data loaded successfully");
      } catch (error) {
        console.error(
          "❌ [AdminAnalytics] Error fetching admin analytics:",
          error
        );
        console.error("❌ [AdminAnalytics] Error response:", error.response);
        showToast("Không thể tải dữ liệu thống kê", "error");
      } finally {
        setLoading(false);
        console.log("🏁 [AdminAnalytics] Fetch completed");
      }
    };

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FileQuestion className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng câu hỏi
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {overview.totalQuestions || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden: activeQuestions and inactiveQuestions */}

        {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cần cải thiện
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {needsImprovement.length || 0}
              </p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Phân bố theo độ khó
          </h3>
          {overview.byDifficulty && (
            <DifficultyChart data={overview.byDifficulty} />
          )}
        </div>

        {/* Subject Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Phân bố theo môn học
          </h3>
          {overview.bySubject && (
            <SubjectDistributionChart data={overview.bySubject} />
          )}
        </div>
      </div>

      {/* Usage Ranking Table */}
      {usageRanking && usageRanking.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top 10 câu hỏi được sử dụng nhiều nhất
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Nội dung
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Chủ đề
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Độ khó
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Lượt sử dụng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Độ chính xác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usageRanking.map((q, idx) => (
                  <tr
                    key={q.question_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-md truncate">
                      {q.question_text}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {q.topic}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          q.difficulty === "EASY"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : q.difficulty === "MEDIUM"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : q.difficulty === "HARD"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {q.usage_stats?.times_used || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${
                          q.usage_stats?.average_accuracy >= 70
                            ? "text-green-600 dark:text-green-400"
                            : q.usage_stats?.average_accuracy >= 40
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {q.usage_stats?.average_accuracy?.toFixed(1) || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Questions Needing Improvement */}
      {needsImprovement && needsImprovement.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Câu hỏi cần cải thiện (độ chính xác &lt; 40%)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Nội dung
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Chủ đề
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Độ chính xác
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Lượt thử
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {needsImprovement.map((q) => (
                  <tr
                    key={q.question_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-md truncate">
                      {q.question_text}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {q.topic}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {q.usage_stats?.average_accuracy?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {q.usage_stats?.total_attempts || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
