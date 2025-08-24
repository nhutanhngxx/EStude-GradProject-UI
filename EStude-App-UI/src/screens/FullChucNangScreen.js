import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const features = [
  { id: "1", icon: "📊", label: "Xem điểm", hint: "Kết quả học tập" },
  { id: "2", icon: "📝", label: "Điểm danh", hint: "Check-in buổi học" },
  { id: "3", icon: "📤", label: "Nộp bài", hint: "Bài hôm nay" },
  { id: "4", icon: "📅", label: "Lịch học", hint: "Lịch học & lịch thi" },
  { id: "5", icon: "📈", label: "Thống kê", hint: "Điểm danh chi tiết" },
  { id: "6", icon: "📰", label: "Tin tức", hint: "Thông báo mới" },
];

export default function FullChucNangScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => console.log(`Đi tới ${item.label}`)}
    >
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.hint}>{item.hint}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={features}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  list: { paddingBottom: 20, backgroundColor: "#f5f5f5" },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { fontSize: 32, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12, color: "#666", marginTop: 4 },
});
