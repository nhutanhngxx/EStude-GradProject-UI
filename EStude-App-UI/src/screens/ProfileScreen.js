// ProfileScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Tổng quan");

  const tabs = ["Tổng quan", "Các môn học", "Hoạt động"];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Thông tin học sinh */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Nguyễn Văn A</Text>
            <Text style={styles.infoText}>Lớp 12A1 • ID: HS00123</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="settings-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Cài đặt</Text>
          </TouchableOpacity>
        </View>

        {/* Thông số học tập */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>3.85</Text>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>#5</Text>
            <Text style={styles.statLabel}>Class Rank</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Tab navigation */}
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

        {/* Nội dung tab */}
        <View style={styles.tabContent}>
          {activeTab === "Tổng quan" && (
            <Text style={styles.contentText}>
              📌 Đây là phần tổng quan học tập của bạn. GPA hiện tại 3.85, xếp
              hạng thứ 5/200 trong khối.
            </Text>
          )}
          {activeTab === "Các môn học" && (
            <View>
              <Text style={styles.contentText}>📖 Môn học & điểm số:</Text>
              <Text>- Toán: 9.2</Text>
              <Text>- Văn: 8.5</Text>
              <Text>- Anh: 9.0</Text>
            </View>
          )}
          {activeTab === "Hoạt động" && (
            <Text style={styles.contentText}>
              🏆 Tham gia CLB STEM, đạt giải Nhất Olympic Tin học.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoText: {
    color: "#666",
    fontSize: 14,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  editText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: "#fff",
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    elevation: 2, // Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#007bff",
  },
  tabText: {
    fontSize: 14,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  contentText: {
    fontSize: 14,
    marginBottom: 8,
  },
});
