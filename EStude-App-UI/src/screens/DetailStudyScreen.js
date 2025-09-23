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
                  <Text style={styles.semesterLabel}>Học kỳ: {term}</Text>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <View style={{ flex: 3, paddingHorizontal: 8 }}>
                        <Text style={styles.tableHeaderText}>Tên môn học</Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 8 }}>
                        <Text style={styles.tableHeaderText}>Điểm TB</Text>
                      </View>
                    </View>
                    {/* Table Rows */}
                    {termSubjects.map((s, idx) => {
                      const key = `${term}-${s.subjectGradeId}`;
                      const isExpanded = expanded[key];
                      return (
                        <View key={idx}>
                          <TouchableOpacity
                            style={styles.tableRow}
                            onPress={() => toggleExpand(key)}
                          >
                            <View style={{ flex: 3, paddingHorizontal: 8 }}>
                              <Text style={styles.tableCellText}>
                                {s.name} ({s.clazz?.name})
                              </Text>
                            </View>
                            <View style={{ flex: 1, paddingHorizontal: 8 }}>
                              <Text style={styles.tableCellText}>
                                {s.grade?.actualAverage ?? "-"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          {isExpanded && (
                            <View style={styles.detailView}>
                              <View style={styles.rightCol}>
                                {/* Điểm giữa kỳ */}
                                <View style={styles.row}>
                                  <Text style={styles.label}>Giữa kỳ</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.midtermScore ?? "-"}
                                    </Text>
                                  </View>
                                </View>

                                {/* Điểm thường xuyên - 5 cột */}
                                <View style={styles.row}>
                                  <Text style={styles.label}>Thường xuyên</Text>
                                  <View style={[styles.cell, { flex: 1 }]}>
                                    <View style={styles.scoresGrid}>
                                      {(() => {
                                        const scores =
                                          s.grade?.regularScores ?? [];
                                        const display = [...scores];
                                        while (display.length < 5)
                                          display.push("-");
                                        return display
                                          .slice(0, 5)
                                          .map((sc, idx) => (
                                            <View
                                              key={idx}
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

                                {/* Thực hành (nếu có) */}
                                {s.grade?.practiceScores?.length > 0 && (
                                  <View style={styles.row}>
                                    <Text style={styles.label}>Thực hành</Text>
                                    <View style={[styles.cell, { flex: 1 }]}>
                                      <View style={styles.scoresGrid}>
                                        {s.grade.practiceScores.map(
                                          (sc, idx) => (
                                            <View
                                              key={idx}
                                              style={styles.scoreBox}
                                            >
                                              <Text style={styles.scoreText}>
                                                {sc}
                                              </Text>
                                            </View>
                                          )
                                        )}
                                      </View>
                                    </View>
                                  </View>
                                )}

                                {/* Cuối kỳ */}
                                <View style={styles.row}>
                                  <Text style={styles.label}>Cuối kỳ</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.finalScore ?? "-"}
                                    </Text>
                                  </View>
                                </View>

                                {/* TBQT */}
                                {/* <View style={styles.row}>
                                  <Text style={styles.label}>TBQT</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.avgScore ?? "-"}
                                    </Text>
                                  </View>
                                </View> */}

                                {/* Điểm tổng kết */}
                                <View style={styles.row}>
                                  <Text style={styles.label}>
                                    Điểm tổng kết
                                  </Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.totalScore ?? "-"}
                                    </Text>
                                  </View>
                                </View>

                                {/* Thang điểm 4 */}
                                {/* <View style={styles.row}>
                                  <Text style={styles.label}>Thang điểm 4</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.scale4 ?? "-"}
                                    </Text>
                                  </View>
                                </View> */}

                                {/* Điểm chữ */}
                                {/* <View style={styles.row}>
                                  <Text style={styles.label}>Điểm chữ</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.letter ?? "-"}
                                    </Text>
                                  </View>
                                </View> */}

                                {/* Xếp loại */}
                                <View style={styles.row}>
                                  <Text style={styles.label}>Xếp loại</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.rank ?? "-"}
                                    </Text>
                                  </View>
                                </View>

                                {/* Ghi chú */}
                                {/* <View style={styles.row}>
                                  <Text style={styles.label}>Ghi chú</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.comment ?? "-"}
                                    </Text>
                                  </View>
                                </View> */}

                                {/* Đạt */}
                                {/* <View style={styles.row}>
                                  <Text style={styles.label}>Đạt</Text>
                                  <View style={styles.cell}>
                                    <Text style={styles.value}>
                                      {s.grade?.isPassed ? "Đạt" : "Chưa đạt"}
                                    </Text>
                                  </View>
                                </View> */}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  {/* Summary */}
                  <View style={styles.summaryContainer}>
                    <Text>Điểm trung bình cộng: {summary.average}</Text>
                    <Text>Xếp loại học lực: {summary.rank}</Text>
                    <Text>Trạng thái học vụ: {summary.status}</Text>
                    <Text>Xếp loại hạnh kiểm: {summary.conduct}</Text>
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
    fontSize: 14,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  subjectCard: {
    padding: 12,
    gap: 5,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#555",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
  },
  semesterSection: {
    marginBottom: 20,
  },
  semesterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 0,
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
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left",
  },
  tableCellText: {
    fontSize: 12,
    color: "#555",
    textAlign: "left",
  },
  detailView: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "flex-start",
  },
  leftCol: {
    width: 120, // cố định để căn trái; chỉnh theo ý bạn
    paddingRight: 8,
    justifyContent: "flex-start",
  },
  rightCol: {
    flex: 1,
  },
  detailTitle: {
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 14,
  },

  subTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },

  // grid 5 cột
  scoresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  scoreBox: {
    width: "20%", // 5 cột
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // row cho các mục khác
  row: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  label: {
    width: 120, // căn đều với leftCol để thẳng cột
    fontWeight: "500",
  },
  value: {
    flex: 1,
  },
  summaryContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
});
