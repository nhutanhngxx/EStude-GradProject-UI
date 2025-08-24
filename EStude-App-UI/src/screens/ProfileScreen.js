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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("sarah.johnson@school.edu");
  const [activeTab, setActiveTab] = useState("Tổng quan");
  const tabs = ["Tổng quan", "Các môn học", "Lịch sử hoạt động"];

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
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="settings-outline" size={18} color="#fff" />
            <Text style={styles.settingsText}>Cài đặt</Text>
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
            <View>
              {/* Card Thông tin cá nhân */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                  <TouchableOpacity onPress={() => setEditing(true)}>
                    <Text style={styles.editButton}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{email}</Text>
                  )}
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>+1 (555) 123-4567</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date of Birth</Text>
                  <Text style={styles.infoValue}>March 15, 2006</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    123 Oak Street, Springfield, IL 62701
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>
                    Mary Johnson - +1 (555) 987-6543
                  </Text>
                </View>

                {editing && (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => setEditing(false)}
                  >
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Card Academic Summary */}
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Academic Summary</Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>3.7</Text>
                    <Text style={styles.summaryLabel}>Current GPA</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>#15</Text>
                    <Text style={styles.summaryLabel}>Class Rank</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Enrollment Date</Text>
                  <Text style={styles.infoValue}>9/1/2022</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expected Graduation</Text>
                  <Text style={styles.infoValue}>6/15/2026</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Class Size</Text>
                  <Text style={styles.infoValue}>120 students</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Class Rank Progress</Text>
                  <Text style={styles.infoValue}>Top 13% of class</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "Các môn học" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Current Subjects</Text>
              <Text style={styles.cardSubtitle}>Fall 2024 Semester</Text>

              {[
                {
                  name: "Advanced Mathematics",
                  teacher: "Mr. Johnson",
                  credits: 4,
                  grade: "A-",
                },
                {
                  name: "AP Chemistry",
                  teacher: "Dr. Smith",
                  credits: 4,
                  grade: "B+",
                },
                {
                  name: "English Literature",
                  teacher: "Ms. Davis",
                  credits: 3,
                  grade: "A",
                },
                {
                  name: "AP Physics",
                  teacher: "Dr. Wilson",
                  credits: 4,
                  grade: "A-",
                },
                {
                  name: "World History",
                  teacher: "Mr. Brown",
                  credits: 3,
                  grade: "B+",
                },
              ].map((subject, index) => (
                <View key={index} style={styles.subjectItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectDetails}>
                      {subject.teacher} • {subject.credits} credits
                    </Text>
                  </View>
                  <View style={styles.gradeContainer}>
                    <Text style={styles.gradeText}>{subject.grade}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "Lịch sử hoạt động" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Recent Submissions</Text>

              {[
                {
                  title: "Assignment 1: Algebra",
                  subject: "Advanced Mathematics",
                  date: "Aug 10, 2024",
                  status: "Submitted",
                },
                {
                  title: "Lab Report: Chemical Reactions",
                  subject: "AP Chemistry",
                  date: "Aug 8, 2024",
                  status: "Late",
                },
                {
                  title: "Essay: Shakespeare Analysis",
                  subject: "English Literature",
                  date: "Aug 5, 2024",
                  status: "Grading",
                },
                {
                  title: "Project: Newton’s Laws",
                  subject: "AP Physics",
                  date: "Aug 3, 2024",
                  status: "Submitted",
                },
              ].map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDetails}>
                      {activity.subject} • {activity.date}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      activity.status === "Submitted" && {
                        backgroundColor: "#4CAF5020",
                        borderColor: "#4CAF50",
                      },
                      activity.status === "Late" && {
                        backgroundColor: "#FF572220",
                        borderColor: "#FF5722",
                      },
                      activity.status === "Grading" && {
                        backgroundColor: "#FFC10720",
                        borderColor: "#FFC107",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        activity.status === "Submitted" && { color: "#4CAF50" },
                        activity.status === "Late" && { color: "#FF5722" },
                        activity.status === "Grading" && { color: "#FFC107" },
                      ]}
                    >
                      {activity.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
  settingsButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  settingsText: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editButton: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flex: 1,
    paddingVertical: 2,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#555",
  },
  highlight: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
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
    borderRadius: 6,
  },
  gradeText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4CAF50",
  },
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
    borderRadius: 6,
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
