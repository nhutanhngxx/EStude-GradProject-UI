import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import aiService from "../services/aiService";
import { useToast } from "../contexts/ToastContext";
import { AuthContext } from "../contexts/AuthContext";
import AILoadingIntro from "../components/common/AILoadingIntro";
import AIHeader from "../components/common/AIHeader";

export default function AIDashboardScreen() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const studentId = user.userId;

  const [subjectAnalysis, setSubjectAnalysis] = useState(null);
  const [semesterAnalysis, setSemesterAnalysis] = useState(null);
  const [loadingIntro, setLoadingIntro] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Hàm fetch dữ liệu AI
  const fetchData = async () => {
    setLoadingIntro(true);
    try {
      const subj = await aiService.getLatestPredictedSubjectsForStudent(
        studentId
      );
      const sem = await aiService.getLatestPredictedGPAForStudent(studentId);
      setSubjectAnalysis(subj?.detailedAnalysis?.data || null);
      setSemesterAnalysis(sem || null);
    } catch (err) {
      showToast("Không thể tải dữ liệu AI", { type: "error" });
    } finally {
      setLoadingIntro(false);
    }
  };

  // Hàm dự đoán mới khi nhấn nút
  const handlePredict = async () => {
    setLoadingIntro(true);
    try {
      await aiService.predictSubjectsForStudent(studentId);

      await aiService.predictStudentGPA(studentId);

      const subj = await aiService.getLatestPredictedSubjectsForStudent(
        studentId
      );
      const sem = await aiService.getLatestPredictedGPAForStudent(studentId);

      setSubjectAnalysis(subj?.detailedAnalysis?.data || null);
      setSemesterAnalysis(sem || null);

      showToast("Dự đoán lại thành công!", { type: "success" });
    } catch (err) {
      showToast("Không thể tải dữ liệu AI", { type: "error" });
    } finally {
      setLoadingIntro(false);
    }
  };

  const renderSubjectCard = (subject, data) => {
    const color =
      data.diem_tb_du_doan >= 8
        ? "#27ae60"
        : data.diem_tb_du_doan >= 6.5
        ? "#f1c40f"
        : "#e74c3c";

    return (
      <View key={subject} style={styles.subjectCard}>
        <Text style={styles.subjectName}>{data.mon_hoc}</Text>
        <Text style={styles.predicted}>
          Điểm trung bình dự đoán:{" "}
          <Text style={{ fontWeight: "bold", color }}>
            {data.diem_tb_du_doan}
          </Text>
        </Text>
        <Text style={styles.detailText}>{data.nhan_xet}</Text>

        <View style={styles.chipRow}>
          <Text style={styles.chipGoal}>
            CK ≥ {data.muc_tieu_kha.diem_ck_can_thiet} để đạt Khá
          </Text>
          <Text style={styles.chipGoal}>
            CK ≥ {data.muc_tieu_gioi.diem_ck_can_thiet} để đạt Giỏi
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Intro overlay */}
      {loadingIntro && (
        <AILoadingIntro onFinish={() => setLoadingIntro(false)} />
      )}

      {!loadingIntro && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          {/* <View style={styles.header}>
            <View>
              <Text style={styles.brand}>AI ESTUDE</Text>
              <Text style={styles.subtitle}>Phân tích & dự đoán học tập</Text>
            </View>
          </View> */}

          <AIHeader />

          {subjectAnalysis && (
            <>
              {/* Button dự đoán */}
              <TouchableOpacity
                style={styles.predictBtn}
                onPress={handlePredict}
              >
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.predictBtnText}> DỰ ĐOÁN BẰNG AI</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Subject Predictions */}
          {subjectAnalysis?.predictions && (
            <>
              <Text style={styles.sectionTitle}>Phân tích từng môn học</Text>
            </>
          )}
          {subjectAnalysis?.predictions ? (
            Object.entries(subjectAnalysis.predictions).map(([subj, data]) =>
              renderSubjectCard(subj, data)
            )
          ) : (
            <Text style={styles.empty}>Chưa có dữ liệu từ AI ESTUDE</Text>
          )}

          {/* Semester Overview */}
          {semesterAnalysis && (
            <>
              <Text style={styles.sectionTitle}>Tổng quan học kỳ</Text>
              <View style={styles.semesterCard}>
                <Text style={styles.averageScore}>
                  {semesterAnalysis.predictedAverage}
                </Text>
                <Text style={styles.rank}>
                  {semesterAnalysis.predictedPerformance}
                </Text>
                <Text style={styles.comment}>{semesterAnalysis.comment}</Text>

                <View style={styles.badgeRow}>
                  {semesterAnalysis.detailedAnalysis?.mon_manh?.map((m) => (
                    <Text key={m} style={styles.badgeStrong}>
                      <Ionicons name="trending-up" size={14} color="#27ae60" />{" "}
                      {m}
                    </Text>
                  ))}
                  {semesterAnalysis.detailedAnalysis?.mon_yeu?.map((m) => (
                    <Text key={m} style={styles.badgeWeak}>
                      <Ionicons
                        name="trending-down"
                        size={14}
                        color="#e74c3c"
                      />{" "}
                      {m}
                    </Text>
                  ))}
                </View>

                <View style={styles.statGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {semesterAnalysis?.statistics?.so_mon_dat}
                    </Text>
                    <Text style={styles.statLabel}>Môn đạt</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {semesterAnalysis?.statistics?.ty_le_mon_du_8}%
                    </Text>
                    <Text style={styles.statLabel}>≥ 8 điểm</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {semesterAnalysis?.statistics?.ty_le_mon_du_6_5}%
                    </Text>
                    <Text style={styles.statLabel}>≥ 6.5 điểm</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Footer */}
          <Text style={styles.footer}>
            © 2025 ESTUDE. TẤT CẢ QUYỀN THUỘC VỀ AI CỦA ESTUDE.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: { fontSize: 24, fontWeight: "800", color: "#00cc66" },
  subtitle: { fontSize: 15, color: "#555" },
  avatar: { width: 50, height: 50, borderRadius: 25 },

  // Button
  predictBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00cc66",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  predictBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 16,
    color: "#2c3e50",
  },

  // Subject Card
  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  subjectName: { fontSize: 17, fontWeight: "700", color: "#34495e" },
  predicted: { fontSize: 15, marginTop: 6, color: "#333" },
  detailText: { fontSize: 14, color: "#555", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
  chipGoal: {
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: "#555",
    marginRight: 6,
  },

  // Semester Card
  semesterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  averageScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00cc66",
    marginBottom: 6,
  },
  rank: { fontSize: 16, fontWeight: "600", color: "#34495e", marginBottom: 10 },
  comment: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#2c3e50",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  badgeStrong: {
    backgroundColor: "#d4efdf",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 13,
    color: "#27ae60",
    marginRight: 6,
  },
  badgeWeak: {
    backgroundColor: "#fdecea",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 13,
    color: "#e74c3c",
    marginRight: 6,
  },
  statGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#2c3e50" },
  statLabel: { fontSize: 13, color: "#777", marginTop: 2 },

  empty: { fontSize: 15, color: "#999", textAlign: "center", marginTop: 10 },
  footer: { marginTop: 28, fontSize: 13, textAlign: "center", color: "#888" },
});
