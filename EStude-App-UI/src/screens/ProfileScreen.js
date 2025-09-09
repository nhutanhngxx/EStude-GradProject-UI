import React, { useState, useContext } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import SubjectListScreen from "../screens/Subjects/SubjectListScreen";

export default function ProfileScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [activeTab, setActiveTab] = useState("Tổng quan");
  const tabs = ["Tổng quan", "Các môn học", "Hoạt động"];

  const handleSave = () => {
    showToast("Lưu thông tin thành công!", { type: "success" });
    setIsEditing(false);
  };

  const activities = [
    {
      id: "1",
      title: "Assignment 1: Algebra",
      details: "Advanced Mathematics • Aug 10, 2024",
      status: "Submitted",
      color: "#4CAF50",
    },
    {
      id: "2",
      title: "Quiz: Physics",
      details: "Physics • Aug 12, 2024",
      status: "Late",
      color: "#F44336",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header: profile card + stats + tabs */}
      <View
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: user?.avatarPath || "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, justifyContent: "space-around" }}>
            <Text style={styles.name}>{user?.fullName || "Chưa có tên"}</Text>
            {/* <Text style={styles.infoText}>
              {user?.school?.schoolName || "Chưa có trường"}
            </Text> */}
            <Text style={styles.infoText}>
              Mã học sinh: {user?.studentCode || "N/A"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="settings-outline" size={24} color="#333" />
            {/* <Text style={styles.settingsText}>Cài đặt</Text> */}
          </TouchableOpacity>
        </View>

        {/* Stats */}
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
      </View>

      {/* Nội dung tab */}
      <View style={styles.tabContent}>
        {/* Tab Tổng quan */}
        {activeTab === "Tổng quan" && (
          <View
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Card Thông tin cá nhân */}
            {/* <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>
                  {user?.dob
                    ? new Date(user.dob).toLocaleDateString("en-GB")
                    : "Chưa có"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || "Chưa có"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>
                  {user?.numberPhone || "Chưa có"}
                </Text>
              </View>
            </View> */}

            <View style={styles.cardContainer}>
              {/* Header với tiêu đề và nút chỉnh sửa */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                  <Text style={styles.editButton}>
                    {isEditing ? "Hủy" : "Chỉnh sửa"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ngày sinh */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>
                  {user?.dob
                    ? new Date(user.dob).toLocaleDateString("en-GB")
                    : "Chưa có"}
                </Text>
              </View>

              {/* Email */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoValue, styles.input]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.infoValue}>{email || "Chưa có"}</Text>
                )}
              </View>

              {/* Số điện thoại */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>
                  {user?.numberPhone || "Chưa có"}
                </Text>
              </View>

              {/* Nút lưu khi đang chỉnh sửa */}
              {isEditing && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Card Tóm tắt học tập */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Tóm tắt học tập</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>3.7</Text>
                  <Text style={styles.summaryLabel}>GPA hiện tại</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>#15</Text>
                  <Text style={styles.summaryLabel}>Xếp hạng lớp</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày nhập học</Text>
                <Text style={styles.infoValue}>
                  {user?.enrollmentDate
                    ? new Date(user.enrollmentDate).toLocaleDateString("en-GB")
                    : "Chưa có"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dự kiến tốt nghiệp</Text>
                <Text style={styles.infoValue}>Chưa có</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sĩ số lớp</Text>
                <Text style={styles.infoValue}>120 học sinh</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiến trình xếp hạng</Text>
                <Text style={styles.infoValue}>Top 13% của lớp</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab Các môn học */}
        {activeTab === "Các môn học" && (
          <SubjectListScreen navigation={navigation} />
        )}

        {/* Tab Lịch sử hoạt động */}
        {activeTab === "Hoạt động" && (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <View style={styles.activityItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityDetails}>{item.details}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${item.color}20`,
                        borderColor: item.color,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: item.color }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    paddingHorizontal: 16,
  },

  /* ==== Profile card (avatar + tên) ==== */
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
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
    color: "#333",
  },
  infoText: {
    color: "#666",
    fontSize: 14,
  },
  settingsButton: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  settingsText: {
    color: "#333",
    marginLeft: 4,
    fontSize: 14,
  },

  /* ==== Stats row ==== */
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
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },

  /* ==== Tabs ==== */
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#4CAF50",
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
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  /* ==== Card chung (bao gồm card chỉnh sửa) ==== */
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  editButton: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#555",
  },

  /* ==== Info row (trong card) ==== */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  infoLabel: {
    fontWeight: "600",
    color: "#666",
    width: "40%",
  },
  infoValue: {
    color: "#333",
    width: "60%",
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "right",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  /* ==== Summary section ==== */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  /* ==== Subjects list ==== */
  subjectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  gradeContainer: {
    backgroundColor: "#4CAF5020",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  gradeText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4CAF50",
  },

  /* ==== Activity list ==== */
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  activityDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
