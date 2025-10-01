import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import attendanceService from "../../services/attandanceService"; // bạn đã có service này
import { useToast } from "../../contexts/ToastContext"; // nếu đang dùng context toast

export default function AttendanceDetailScreen({ route }) {
  const { session: initSession, subject, user } = route.params;
  const [session, setSession] = useState(initSession);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);

  const handleMarkAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.markAttendance(
        session.sessionId,
        user.userId,
        "BUTTON_PRESS"
      );
      if (res) {
        setSession({ ...session, status: "PRESENT" });
        showToast("Điểm danh thành công", { type: "success" });
      } else {
        showToast("Điểm danh thất bại", { type: "error" });
      }
    } catch (err) {
      showToast("Có lỗi xảy ra", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>{session.sessionName}</Text>
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Thời gian</Text>
        <Text style={styles.value}>
          Bắt đầu:{" "}
          {startTime.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.value}>
          Kết thúc:{" "}
          {endTime.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Trạng thái</Text>
        <Text
          style={[
            styles.value,
            session.status === "PRESENT"
              ? { color: "#27ae60" }
              : session.status === "ABSENT"
              ? { color: "#e74c3c" }
              : session.status === "LATE"
              ? { color: "#f39c12" }
              : { color: "#999" },
          ]}
        >
          {session.status === "PRESENT"
            ? "CÓ MẶT"
            : session.status === "ABSENT"
            ? "VẮNG"
            : session.status === "LATE"
            ? "TRỄ"
            : "CHƯA ĐIỂM DANH"}
        </Text>
      </View>

      {/* Nút điểm danh nếu chưa điểm danh */}
      {session.status === "NOT_MARKED" && (
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleMarkAttendance}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ĐIỂM DANH NGAY</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 18,
  },
  infoBlock: {
    marginBottom: 18,
  },
  label: {
    fontWeight: "600",
    fontSize: 15,
    color: "#222",
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
