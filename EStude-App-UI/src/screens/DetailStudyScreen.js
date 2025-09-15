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

const studentData = {
  gpa: 8.7,
  rank: 5,
  totalStudents: 42,
  passedCredits: 85,
  requiredCredits: 120,
  subjects: [
    {
      name: "Toán - Hình học",
      gpa: 9.0,
      completed: 12,
      total: 13,
      atRisk: false,
    },
    { name: "Vật lý", gpa: 8.5, completed: 11, total: 13, atRisk: false },
    { name: "Hóa học", gpa: 7.0, completed: 10, total: 13, atRisk: true },
  ],
};

export default function DetailStudyScreen() {
  const { user } = useContext(AuthContext);
  const tabs = ["Tổng quan", "Môn học"];
  const [activeTab, setActiveTab] = useState("Tổng quan");

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await studentStudyService.getSubjectsWithGrades(
        user.studentId
      );
      console.log("subjects:", data);
      setSubjects(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const creditPercent = Math.round(
    (studentData.passedCredits / studentData.requiredCredits) * 100
  );

  const filteredSubjects = studentData.subjects
    .filter((sub) => {
      if (filter === "all") return true;
      if (filter === "atRisk") return sub.atRisk;
      if (filter === "completed") return sub.completed === sub.total;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "gpa":
          return b.gpa - a.gpa;
        case "progress":
          return b.completed / b.total - a.completed / a.total;
        case "atRisk":
          return (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0);
        default:
          return 0;
      }
    });

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

        {/* Nội dung */}
        {activeTab === "Tổng quan" && (
          <View>
            <StudyOverviewCard
              gpa={studentData.gpa}
              rank={studentData.rank}
              totalStudents={studentData.totalStudents}
              passedCredits={studentData.passedCredits}
              requiredCredits={studentData.requiredCredits}
            />

            <View>
              {/* Filter + Sort */}
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

              {/* Danh sách môn học */}
              {filteredSubjects.map((subject, index) => {
                const subjectPercent = Math.round(
                  (subject.completed / subject.total) * 100
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
                        {subject.name}
                      </Text>
                      {subject.atRisk && (
                        <Text style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                          ⚠
                        </Text>
                      )}
                    </View>
                    <View style={styles.subjectDetailRow}>
                      <Text style={styles.detailLabel}>
                        Điểm TB: {subject.gpa}
                      </Text>
                      <Text style={styles.detailLabel}>
                        Điểm danh: {subject.completed}/{subject.total}
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
          </View>
        )}

        {activeTab === "Môn học" && (
          <View>
            {subjects.map((s, idx) => (
              <View
                key={idx}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: "bold" }}>
                  {s.clazz?.name ?? "Không rõ môn"} (
                  {s.clazz?.terms?.[0]?.name ?? "?"})
                </Text>
                <Text>GV: {s.clazz?.homeroomTeacher ?? "Chưa có"}</Text>
                {s.grade ? (
                  <>
                    <Text>
                      Điểm thường xuyên: {s.grade.regularScores?.join(", ")}
                    </Text>
                    <Text>
                      Điểm giữa kỳ: {s.grade.midtermScore ?? "Chưa có"}
                    </Text>
                    <Text>Điểm cuối kỳ: {s.grade.finalScore ?? "Chưa có"}</Text>
                    <Text>
                      Trung bình: {s.grade.actualAverage ?? "Chưa có"}
                    </Text>
                  </>
                ) : (
                  <Text>Chưa có điểm</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },

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
  activeTab: { backgroundColor: "#27ae60" },
  tabText: { fontSize: 14, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "bold" },

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
  dropdownWrapper: { flex: 1, marginHorizontal: 4 },
  dropdownLabel: { fontSize: 12, color: "#555", marginBottom: 2 },

  subjectCard: { padding: 12, gap: 5 },
  subjectName: { fontSize: 16, fontWeight: "600", color: "#333" },
  subjectDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  detailLabel: { fontSize: 12, color: "#555" },

  footerSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footerText: { fontSize: 14, color: "#333", marginBottom: 4 },
  progressText: { fontSize: 12, color: "#666", marginTop: 4 },
});
