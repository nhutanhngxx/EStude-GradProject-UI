import React from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Thông tin người dùng
const user = {
  name: "Nguyễn Nhựt Anh",
  avatar: "https://i.pravatar.cc/150?img=12",
  grade: "12A3",
};

// Dữ liệu dự đoán theo classSubject
const predictedScores = [
  {
    classSubjectId: "cs1",
    subject: { name: "Toán" },
    missing: ["CK"],
    available: ["GK", "TK"],
    predicted: 8.5,
  },
  {
    classSubjectId: "cs2",
    subject: { name: "Văn" },
    missing: ["CK", "GK"],
    available: ["TK"],
    predicted: 7.2,
  },
  {
    classSubjectId: "cs3",
    subject: { name: "Vật lý" },
    missing: [],
    available: ["GK", "CK", "TK"],
    predicted: 8.8,
  },
];

// Dữ liệu lộ trình học theo classSubject
const learningPaths = [
  {
    classSubjectId: "cs1",
    title: "Ôn tập Toán nâng cao",
    description: "Tập trung vào hình học và đại số theo lịch học của bạn",
  },
  {
    classSubjectId: "cs2",
    title: "Văn học - Kỹ năng viết luận",
    description: "Luyện tập viết văn nghị luận và cảm nhận tác phẩm",
  },
  {
    classSubjectId: "cs3",
    title: "Vật lý chuyên sâu",
    description: "Tăng cường kỹ năng giải bài tập trắc nghiệm",
  },
];

export default function AILearningScreen({ navigation }) {
  const renderPredictionCard = (item) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("PredictionDetail", { subject: item })}
    >
      <Text style={styles.cardTitle}>{item.subject.name}</Text>
      <Text style={styles.cardText}>
        Cột còn thiếu:{" "}
        {item.missing.length > 0 ? item.missing.join(", ") : "Không"}
      </Text>
      <Text style={styles.cardText}>
        Điểm dự đoán:{" "}
        <Text
          style={{
            fontWeight: "bold",
            color:
              item.predicted >= 8
                ? "#2ecc71"
                : item.predicted >= 6.5
                ? "#f1c40f"
                : "#e74c3c",
          }}
        >
          {item.predicted}
        </Text>
      </Text>
    </TouchableOpacity>
  );

  const renderPathCard = (item) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("PathDetail", { path: item })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 3 }}>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào,{" "}
              <Text style={styles.highlight}>{user.name.toUpperCase()}</Text> 👋
            </Text>

            <Text style={styles.subGreeting}>
              Nơi lưu giữ hành tri tri thức trẻ
            </Text>
          </View>
          {/* <Image source={{ uri: avatarUri }} style={styles.avatar} /> */}
        </View>

        {/* Dự đoán kết quả học tập */}
        <Text style={styles.sectionTitle}>Dự đoán kết quả học tập</Text>
        {predictedScores.map((item) => (
          <View key={item.classSubjectId}>{renderPredictionCard(item)}</View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#00cc66" },
  greeting: { fontSize: 16, color: "#333" },
  highlight: { fontWeight: "bold" },
  subGreeting: { fontSize: 14, color: "#777" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#2c3e50",
  },
  cardText: { fontSize: 14, color: "#555", marginBottom: 4 },
});
