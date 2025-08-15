import React, { useState, useEffect } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const user = {
  name: "Nguyễn Minh Khoa",
  avatar: "https://i.pravatar.cc/150?img=12",
  grade: "12A3",
};

export default function AILearningScreen({ navigation }) {
  const [showModal, setShowModal] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);

  // Fake data dự đoán điểm
  const predictedScores = [
    {
      subject: "Toán",
      missing: ["CK"],
      available: ["GK", "TK"],
      predicted: 8.5,
    },
    {
      subject: "Văn",
      missing: ["CK", "GK"],
      available: ["TK"],
      predicted: 7.2,
    },
    {
      subject: "Vật lý",
      missing: [],
      available: ["GK", "CK", "TK"],
      predicted: 8.8,
    },
  ];

  // Fake data lộ trình học
  const learningPaths = [
    {
      title: "Ôn tập Toán nâng cao",
      description: "Tập trung vào hình học và đại số theo lịch học của bạn",
    },
    {
      title: "Văn học - Kỹ năng viết luận",
      description: "Luyện tập viết văn nghị luận và cảm nhận tác phẩm",
    },
    {
      title: "Vật lý chuyên sâu",
      description: "Tăng cường kỹ năng giải bài tập trắc nghiệm",
    },
  ];

  const blocks = ["Khối 10", "Khối 11", "Khối 12", "Khối đại học"];

  const handleSelectBlock = (block) => {
    setSelectedBlock(block);
    setShowModal(false);
  };

  const renderPredictionCard = (item) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("PredictionDetail", { subject: item })}
    >
      <Text style={styles.cardTitle}>{item.subject}</Text>
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
      <StatusBar style="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào, <Text style={styles.highlight}>{user.name}</Text> 👋
            </Text>
            <Text style={styles.subGreeting}>
              Lớp {user.grade} • Học tốt mỗi ngày
            </Text>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>
        {/* Modal chọn bang/khối */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn bang/khối học</Text>
              {blocks.map((block) => (
                <TouchableOpacity
                  key={block}
                  style={styles.modalButton}
                  onPress={() => handleSelectBlock(block)}
                >
                  <Text style={styles.modalButtonText}>{block}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {selectedBlock && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>📊 Dự đoán kết quả học tập</Text>
            {predictedScores.map((item, idx) => (
              <View key={idx}>{renderPredictionCard(item)}</View>
            ))}

            <Text style={styles.sectionTitle}>🗺 Gợi ý lộ trình học</Text>
            {learningPaths.map((item, idx) => (
              <View key={idx}>{renderPathCard(item)}</View>
            ))}
          </ScrollView>
        )}
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
  cardText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#3498db",
    marginVertical: 6,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
