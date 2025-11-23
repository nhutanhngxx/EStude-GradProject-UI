import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentCompetencyMap = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [improvements, setImprovements] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);

  useEffect(() => {
    fetchImprovements();
  }, []);

  const fetchImprovements = async () => {
    try {
      setLoading(true);
      const data = await aiService.getAllUserImprovements(token);

      if (Array.isArray(data) && data.length > 0) {
        setImprovements(data);
        processSubjectStats(data);
      } else {
        setImprovements([]);
        setSubjectStats([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu năng lực:", error);
      showToast("Không thể tải dữ liệu năng lực", "error");
    } finally {
      setLoading(false);
    }
  };

  const processSubjectStats = (data) => {
    const subjectMap = {};

    data.forEach((item) => {
      const subject = item.detailedAnalysis?.subject || "Không rõ";

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          evaluations: [],
          topics: {},
          totalEvaluations: 0,
        };
      }

      subjectMap[subject].evaluations.push(item);
      subjectMap[subject].totalEvaluations++;

      const topics = item.detailedAnalysis?.topics || [];
      topics.forEach((topic) => {
        const topicName = topic.topic;
        const normalizedTopicName = topicName.trim().toLowerCase();

        if (!subjectMap[subject].topics[normalizedTopicName]) {
          subjectMap[subject].topics[normalizedTopicName] = {
            topic: topicName,
            accuracyHistory: [],
            improvementHistory: [],
            count: 0,
          };
        }

        subjectMap[subject].topics[normalizedTopicName].accuracyHistory.push(
          topic.new_accuracy
        );
        subjectMap[subject].topics[normalizedTopicName].improvementHistory.push(
          topic.improvement
        );
        subjectMap[subject].topics[normalizedTopicName].count++;
      });
    });

    const stats = Object.values(subjectMap).map((subjectData) => {
      const topicsList = Object.values(subjectData.topics).map((topic) => {
        const avgAccuracy =
          topic.accuracyHistory.reduce((sum, val) => sum + val, 0) /
          topic.count;
        const avgImprovement =
          topic.improvementHistory.reduce((sum, val) => sum + val, 0) /
          topic.count;

        return {
          topic: topic.topic,
          avgAccuracy: Math.round(avgAccuracy * 10) / 10,
          avgImprovement: Math.round(avgImprovement * 10) / 10,
          accuracyHistory: topic.accuracyHistory,
          improvementHistory: topic.improvementHistory,
        };
      });

      const totalAvgAccuracy = topicsList.reduce(
        (sum, t) => sum + t.avgAccuracy,
        0
      );
      const avgAccuracy =
        topicsList.length > 0 ? totalAvgAccuracy / topicsList.length : 0;

      const totalAvgImprovement = topicsList.reduce(
        (sum, t) => sum + t.avgImprovement,
        0
      );
      const overallImprovement =
        topicsList.length > 0 ? totalAvgImprovement / topicsList.length : 0;

      const mastered = topicsList.filter((t) => t.avgAccuracy >= 80).length;
      const progressing = topicsList.filter(
        (t) => t.avgAccuracy >= 50 && t.avgAccuracy < 80
      ).length;
      const needsWork = topicsList.filter((t) => t.avgAccuracy < 50).length;

      const latestEval = subjectData.evaluations.reduce((latest, current) => {
        if (!latest) return current;
        const latestDate = new Date(latest.generatedAt);
        const currentDate = new Date(current.generatedAt);
        return currentDate > latestDate ? current : latest;
      }, null);

      return {
        subject: subjectData.subject,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        overallImprovement: Math.round(overallImprovement * 10) / 10,
        totalTopics: topicsList.length,
        mastered,
        progressing,
        needsWork,
        topics: topicsList,
        evaluations: subjectData.evaluations,
        lastEvaluated: latestEval?.generatedAt,
      };
    });

    stats.sort((a, b) => b.avgAccuracy - a.avgAccuracy);
    setSubjectStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchImprovements();
    setRefreshing(false);
  };

  const getCompetencyLevel = (accuracy) => {
    if (accuracy >= 80)
      return { level: "Vững vàng", color: "green", icon: "trophy" };
    if (accuracy >= 60)
      return { level: "Nâng cao", color: "blue", icon: "trending-up" };
    if (accuracy >= 40)
      return { level: "Trung bình", color: "yellow", icon: "school" };
    return { level: "Cơ bản", color: "red", icon: "book-outline" };
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 20)
      return {
        icon: "trending-up",
        color: "text-green-600 dark:text-green-400",
      };
    if (improvement > 0)
      return { icon: "arrow-up", color: "text-green-500 dark:text-green-400" };
    if (improvement === 0)
      return { icon: "minus", color: "text-gray-500 dark:text-gray-400" };
    if (improvement > -20)
      return {
        icon: "arrow-down",
        color: "text-orange-500 dark:text-orange-400",
      };
    return { icon: "trending-down", color: "text-red-600 dark:text-red-400" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải dữ liệu năng lực...
          </p>
        </div>
      </div>
    );
  }

  if (subjectStats.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-green-600 dark:text-green-400" />
            Bản đồ Năng lực
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Brain className="w-20 h-20 text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Chưa có dữ liệu đánh giá năng lực
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
            Hãy hoàn thành bài tập và luyện tập để xây dựng bản đồ năng lực của
            bạn
          </p>
          <button
            onClick={() => navigate("/student/assessment")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Làm bài đánh giá ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-green-600 dark:text-green-400" />
            Bản đồ Năng lực
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Phân tích AI về năng lực học tập của bạn
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition disabled:opacity-50"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
        <h2 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
          Tổng quan Năng lực
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {subjectStats.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Môn học
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {subjectStats.reduce((sum, s) => sum + s.totalTopics, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Chủ đề
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {subjectStats.reduce((sum, s) => sum + s.mastered, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Đã vững
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {subjectStats.reduce((sum, s) => sum + s.needsWork, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cần luyện
            </p>
          </div>
        </div>
      </div>

      {/* Subject Stats */}
      <h2 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
        Lộ trình Năng lực theo Môn học
      </h2>

      <div className="space-y-4">
        {subjectStats.map((subjectData, index) => {
          const competency = getCompetencyLevel(subjectData.avgAccuracy);
          const improvement = getImprovementIcon(
            subjectData.overallImprovement
          );

          const colorClasses = {
            green: {
              bg: "bg-green-100 dark:bg-green-900/30",
              text: "text-green-700 dark:text-green-400",
              bar: "bg-green-500",
            },
            blue: {
              bg: "bg-blue-100 dark:bg-blue-900/30",
              text: "text-blue-700 dark:text-blue-400",
              bar: "bg-blue-500",
            },
            yellow: {
              bg: "bg-yellow-100 dark:bg-yellow-900/30",
              text: "text-yellow-700 dark:text-yellow-400",
              bar: "bg-yellow-500",
            },
            red: {
              bg: "bg-red-100 dark:bg-red-900/30",
              text: "text-red-700 dark:text-red-400",
              bar: "bg-red-500",
            },
          };

          const colors = colorClasses[competency.color];

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() =>
                navigate(`/student/competency-map/detail`, {
                  state: { subjectData },
                })
              }
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center flex-1">
                  <Award className={`w-6 h-6 mr-3 ${colors.text}`} />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {subjectData.subject}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}
                >
                  {competency.level}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {subjectData.avgAccuracy}%
                  </span>
                  {improvement.icon === "trending-up" && (
                    <TrendingUp className={`w-5 h-5 ${improvement.color}`} />
                  )}
                  {improvement.icon === "arrow-up" && (
                    <ArrowUp className={`w-5 h-5 ${improvement.color}`} />
                  )}
                  {improvement.icon === "minus" && (
                    <Minus className={`w-5 h-5 ${improvement.color}`} />
                  )}
                  {improvement.icon === "arrow-down" && (
                    <ArrowDown className={`w-5 h-5 ${improvement.color}`} />
                  )}
                  {improvement.icon === "trending-down" && (
                    <TrendingDown className={`w-5 h-5 ${improvement.color}`} />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500 rounded-full"
                    style={{ width: `${subjectData.avgAccuracy}%` }}
                  />
                </div>
              </div>

              {/* Topics Breakdown */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {subjectData.mastered} vững
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {subjectData.progressing} tiến bộ
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {subjectData.needsWork} cần luyện
                  </span>
                </div>
              </div>

              {subjectData.lastEvaluated && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 italic">
                  Đánh giá gần nhất:{" "}
                  {new Date(subjectData.lastEvaluated).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Tips */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center mb-3">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-bold text-green-600 dark:text-green-400">
            Gợi ý từ AI
          </h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Bạn đã có {subjectStats.reduce((sum, s) => sum + s.mastered, 0)} chủ
          đề vững vàng! Hãy tiếp tục luyện tập{" "}
          {subjectStats.reduce((sum, s) => sum + s.needsWork, 0)} chủ đề cần cải
          thiện để nâng cao năng lực tổng thể.
        </p>
      </div>
    </div>
  );
};

export default StudentCompetencyMap;
