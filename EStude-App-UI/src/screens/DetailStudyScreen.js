import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import ProgressBar from "../components/common/ProgressBar";
import Dropdown from "../components/common/Dropdown";
import StudyOverviewCard from "../components/common/StudyOverviewCard";
import studentStudyService from "../services/studentStudyService";
import { AuthContext } from "../contexts/AuthContext";

export default function DetailStudyScreen() {
  const { user } = useContext(AuthContext);
  const tabs = ["Tổng quan", "Môn học"];
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
            submissionRate: (overviewData.submissionRate ?? 0) * 100,
            attendanceRate: overviewData.attendanceRate ?? 0,
          });
        }
      } catch (err) {
        console.error("Load student data failed:", err);
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === "Tổng quan" && overview && (
          <View>
            <StudyOverviewCard
              gpa={overview.gpa}
              rank={overview.rank}
              totalStudents={overview.totalStudents}
              passedCredits={overview.passedCredits}
              requiredCredits={overview.requiredCredits}
              submissionRate={overview.submissionRate}
              attendanceRate={overview.attendanceRate}
            />
            <View style={styles.filterSortRow}>
              <View style={styles.dropdownWrapper}>
                <Text style={styles.dropdownLabel}>Lọc theo</Text>
                <Dropdown
                  options={["Tất cả", "Môn rủi ro", "Môn hoàn thành"]}
                  selected={
                    filter === "all"
                      ? "Tất cả"
                      : filter === "atRisk"
                      ? "Môn rủi ro"
                      : "Môn hoàn thành"
                  }
                  onSelect={(item) => {
                    if (item === "Tất cả") setFilter("all");
                    else if (item === "Môn rủi ro") setFilter("atRisk");
                    else setFilter("completed");
                  }}
                />
              </View>
              <View style={styles.dropdownWrapper}>
                <Text style={styles.dropdownLabel}>Sắp xếp theo</Text>
                <Dropdown
                  options={[
                    "Mặc định",
                    "GPA giảm dần",
                    "Tiến độ giảm dần",
                    "Môn rủi ro trước",
                  ]}
                  selected={
                    sort === "default"
                      ? "Mặc định"
                      : sort === "gpa"
                      ? "GPA giảm dần"
                      : sort === "progress"
                      ? "Tiến độ giảm dần"
                      : "Môn rủi ro trước"
                  }
                  onSelect={(item) => {
                    if (item === "Mặc định") setSort("default");
                    else if (item === "GPA giảm dần") setSort("gpa");
                    else if (item === "Tiến độ giảm dần") setSort("progress");
                    else setSort("atRisk");
                  }}
                />
              </View>
            </View>
            {filteredSubjects.map((subject, index) => {
              const subjectPercent = Math.round(
                ((subject.completed ?? 0) / (subject.total || 1)) * 100
              );
              return (
                <View key={index} style={[styles.card, styles.subjectCard]}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={[
                        styles.subjectName,
                        subject.atRisk && { color: "#ff4d4f" },
                      ]}
                    >
                      {subject.name} ({subject.termName})
                    </Text>
                    {subject.atRisk && (
                      <Text style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                        ⚠
                      </Text>
                    )}
                  </View>
                  <View style={styles.subjectDetailRow}>
                    <Text style={styles.detailLabel}>
                      Điểm TB: {subject.gpa ?? "-"}
                    </Text>
                    <Text style={styles.detailLabel}>
                      Điểm danh: {subject.completed ?? 0}/{subject.total ?? 0}
                    </Text>
                  </View>
                  <ProgressBar value={subjectPercent} />
                  <Text style={styles.progressText}>
                    {subjectPercent}% hoàn thành
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === "Môn học" && (
          <View>
            {termKeys.map((term) => {
              const termSubjects = groupedSubjects[term].subjects;
              const summary = calculateSummary(termSubjects);
              return (
                <View key={term} style={styles.semesterSection}>
                  <Text style={styles.semesterLabel}>{term}</Text>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <View style={{ flex: 3, paddingHorizontal: 8 }}>
                        <Text style={styles.tableHeaderText}>Tên môn học</Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 8 }}>
                        <Text
                          style={[
                            styles.tableHeaderText,
                            { textAlign: "right" },
                          ]}
                        >
                          Điểm TB
                        </Text>
                      </View>
                    </View>
                    {/* Table Rows */}
                    {termSubjects.map((s, idx) => {
                      const key = `${term}-${s.subjectGradeId}`;
                      const isExpanded = expanded[key];
                      return (
                        <View key={idx}>
                          {/* Row môn học */}
                          <TouchableOpacity
                            style={styles.tableRow}
                            onPress={() => toggleExpand(key)}
                          >
                            <View style={{ flex: 3, paddingHorizontal: 8 }}>
                              <Text style={styles.tableCellText}>{s.name}</Text>
                            </View>
                            <View style={{ flex: 1, paddingHorizontal: 8 }}>
                              <Text
                                style={[
                                  styles.tableCellText,
                                  { textAlign: "right" },
                                ]}
                              >
                                {s.grade?.actualAverage ?? "-"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Chi tiết điểm */}
                          {isExpanded && (
                            <View style={styles.detailView}>
                              <View style={styles.detailRow}>
                                {/* Cột chứa Giữa kỳ, Cuối kỳ, Tổng kết, Xếp loại */}
                                <View style={styles.detailColumn}>
                                  <View style={[styles.row, styles.rowEven]}>
                                    <Text style={styles.label}>
                                      Giữa kỳ (30%)
                                    </Text>
                                    <Text style={styles.value}>
                                      {s.grade?.midtermScore ?? "-"}
                                    </Text>
                                  </View>
                                  <View style={[styles.row, styles.rowEven]}>
                                    <Text style={styles.label}>
                                      Thường kỳ (20%)
                                    </Text>
                                    <View>
                                      <View style={styles.scoresGrid}>
                                        {(() => {
                                          const scores =
                                            s.grade?.regularScores ?? [];
                                          const display = [...scores];
                                          while (display.length < 5)
                                            display.push("-");
                                          return display
                                            .slice(0, 5)
                                            .map((sc, i) => (
                                              <View
                                                key={i}
                                                style={styles.scoreBox}
                                              >
                                                <Text style={styles.scoreText}>
                                                  {sc}
                                                </Text>
                                              </View>
                                            ));
                                        })()}
                                      </View>
                                    </View>
                                  </View>

                                  <View style={[styles.row, styles.rowEven]}>
                                    <Text style={styles.label}>
                                      Cuối kỳ (50%)
                                    </Text>
                                    <Text style={styles.value}>
                                      {s.grade?.finalScore ?? "-"}
                                    </Text>
                                  </View>
                                  <View style={[styles.row, styles.rowEven]}>
                                    <Text style={styles.label}>Tổng kết</Text>
                                    <Text style={styles.value}>
                                      {s.grade?.totalScore ?? "-"}
                                    </Text>
                                  </View>
                                  <View style={[styles.row, styles.rowEven]}>
                                    <Text style={styles.label}>Xếp loại</Text>
                                    <Text style={styles.value}>
                                      {s.grade?.rank ?? "-"}
                                    </Text>
                                  </View>
                                </View>

                                {/* Cột chứa điểm Thực hành (nếu có) */}
                                {s.grade?.practiceScores?.length > 0 && (
                                  <View style={styles.regularScoresContainer}>
                                    <Text style={styles.regularLabel}>
                                      Thực hành
                                    </Text>
                                    <View style={styles.scoresGrid}>
                                      {s.grade.practiceScores.map((sc, i) => (
                                        <View key={i} style={styles.scoreBox}>
                                          <Text style={styles.scoreText}>
                                            {sc}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.summaryContainer}>
                    <View style={[styles.summaryRow]}>
                      <Text style={styles.summaryLabel}>
                        Điểm trung bình cộng
                      </Text>
                      <Text style={styles.summaryValue}>{summary.average}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Xếp loại học lực</Text>
                      <Text style={styles.summaryValue}>{summary.rank}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Trạng thái học vụ</Text>
                      <Text style={styles.summaryValue}>{summary.status}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.summaryRowLast]}>
                      <Text style={styles.summaryLabel}>
                        Xếp loại hạnh kiểm
                      </Text>
                      <Text style={styles.summaryValue}>{summary.conduct}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#27ae60",
  },
  tabText: {
    // fontSize: 14,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filterSortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  dropdownLabel: {
    // fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  subjectCard: {
    padding: 12,
    gap: 5,
  },
  subjectName: {
    // fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  detailLabel: {
    // fontSize: 12,
    color: "#555",
  },
  progressText: {
    // fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  semesterSection: {
    marginBottom: 20,
  },
  semesterLabel: {
    // fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
    alignItems: "center",
  },
  tableHeaderText: {
    // fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  tableCellText: {
    // fontSize: 15,
    fontWeight: "bold",
    color: "#555",
  },
  detailView: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  detailColumn: {
    flex: 1,
    flexDirection: "column",
    paddingRight: 8,
  },
  regularScoresContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  regularLabel: {
    // fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
    textAlign: "center",
    alignSelf: "center",
    width: 80,
  },
  scoresGrid: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
  },
  scoreBox: {
    borderRadius: 6,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    // fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  rowEven: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: {
    // fontSize: 15,
    // fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  value: {
    // fontSize: 14,
    color: "#555",
    textAlign: "right",
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e6e6e6",

    // Đổ bóng nhẹ
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  summaryRowLast: {
    borderBottomWidth: 0, // bỏ line ở row cuối
  },

  summaryLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27ae60", // màu nhấn mạnh cho kết quả
  },
});
