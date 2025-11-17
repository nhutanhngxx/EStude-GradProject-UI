import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../contexts/ToastContext";
import { AuthContext } from "../../contexts/AuthContext";
import topicService from "../../services/topicService";

const themeColors = {
  primary: "#00cc66",      // xanh lá chủ đạo
  secondary: "#33cc77",    // xanh lá nhạt hơn
  background: "#e6f5ea",   // nền xanh rất nhạt / trắng pha xanh
  card: "#FFFFFF",          // màu card vẫn trắng
  text: "#006633",          // text màu xanh đậm
};

export default function AssessmentTopicSelectionScreen({ route, navigation }) {
  const { subjectId, subjectName, gradeLevel } = route.params;
  const { showToast } = useToast();
  const { user, token } = useContext(AuthContext);

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [numQuestions, setNumQuestions] = useState("20");
  const [difficulty, setDifficulty] = useState("mixed");
  const [generating, setGenerating] = useState(false);

  // Nhóm topics theo volume và chapter
  const [groupedTopics, setGroupedTopics] = useState({});

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await topicService.getTopicsBySubject(subjectId, gradeLevel);

      if (Array.isArray(data)) {
        // Group by volume then by chapter
        const grouped = {};
        data.forEach((topic) => {
          const volume = topic.volume || 1;
          const chapter = topic.chapter || "Chưa phân loại";

          if (!grouped[volume]) {
            grouped[volume] = {};
          }
          if (!grouped[volume][chapter]) {
            grouped[volume][chapter] = [];
          }

          grouped[volume][chapter].push(topic);
        });

        // Sort topics by orderIndex in each chapter
        Object.keys(grouped).forEach((vol) => {
          Object.keys(grouped[vol]).forEach((chap) => {
            grouped[vol][chap].sort(
              (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
            );
          });
        });

        setGroupedTopics(grouped);
        setTopics(data);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      showToast("Lỗi khi tải danh sách chủ đề", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContinue = () => {
    if (selectedTopics.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 chủ đề", { type: "warning" });
      return;
    }

    setShowSettingsModal(true);
  };

  const handleStartAssessment = async () => {
    const numQuestionsInt = parseInt(numQuestions) || 20;

    // Validate: số câu hỏi phải >= số topics
    if (numQuestionsInt < selectedTopics.length) {
      showToast(
        `Số câu hỏi phải lớn hơn hoặc bằng số chủ đề (${selectedTopics.length})`,
        { type: "error" }
      );
      return;
    }

    Keyboard.dismiss();
    setShowSettingsModal(false);
    setGenerating(true);

    try {
      // Call API to generate questions
      const payload = {
        studentId: user.userId,
        subjectId: subjectId,
        topicIds: selectedTopics,
        numQuestions: numQuestionsInt,
        difficulty: difficulty, // "easy", "medium", "hard", "mixed"
        gradeLevel: gradeLevel,
      };

      const response = await topicService.generateAssessmentQuestions(
        payload,
        token
      );

      if (response.success && response.data) {
        // Navigate to quiz screen with generated questions
        navigation.navigate("AssessmentQuiz", {
          assessmentId: response.data.assessmentId,
          subjectId: subjectId,
          subjectName: response.data.subjectName || subjectName,
          questions: response.data.questions,
          totalQuestions: response.data.totalQuestions,
          difficulty: response.data.difficulty,
          selectedTopics: topics.filter((t) =>
            selectedTopics.includes(t.topicId)
          ),
        });
      } else {
        showToast(response.message || "Không thể tạo bài đánh giá", {
          type: "error",
        });
      }
    } catch (error) {
      // console.error("Error generating assessment:", error);

      // Parse and simplify error message from backend
      let errorMessage = "Lỗi khi tạo bài đánh giá. Vui lòng thử lại.";
      let errorTitle = "Không thể tạo bài đánh giá";

      if (error.message) {
        // Shorten long error messages for better readability
        if (error.message.includes("cần ít nhất")) {
          // Extract key numbers from message
          const match = error.message.match(/cần ít nhất (\d+) câu/);
          const minQuestions = match ? match[1] : "4";

          errorTitle = "Số câu hỏi không đủ";
          errorMessage = `Cần ít nhất ${minQuestions} câu hỏi cho cài đặt này.\n\nVui lòng tăng số câu hỏi hoặc chọn độ khó khác.`;
        } else if (error.message.includes("Không đủ câu hỏi")) {
          errorTitle = "Không đủ câu hỏi";
          errorMessage =
            "Chủ đề này chưa có đủ câu hỏi.\n\nVui lòng chọn thêm chủ đề hoặc giảm số câu hỏi.";
        } else {
          // Use original message if it's short enough
          errorMessage =
            error.message.length > 150
              ? error.message.substring(0, 147) + "..."
              : error.message;
        }
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [{ text: "Đã hiểu", style: "default" }],
        { cancelable: true }
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách chủ đề...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Cài đặt bài đánh giá</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowSettingsModal(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={28} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.topicLabel}>
                      Số chủ đề đã chọn:{" "}
                      <Text style={styles.topicValue}>
                        {selectedTopics.length}
                      </Text>
                    </Text>

                    {/* Số câu hỏi */}
                    <View style={styles.settingGroup}>
                      <Text style={styles.settingLabel}>Số câu hỏi:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={numQuestions}
                        onChangeText={setNumQuestions}
                        keyboardType="numeric"
                        maxLength={3}
                        placeholder="20"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                      <Text style={styles.hintText}>
                        * Số câu hỏi phải ≥ số chủ đề ({selectedTopics.length})
                      </Text>
                    </View>

                    {/* Mức độ */}
                    <View style={styles.settingGroup}>
                      <Text style={styles.settingLabel}>Mức độ:</Text>
                      <View style={styles.difficultyButtons}>
                        {[
                          {
                            key: "easy",
                            label: "Dễ",
                            icon: "happy-outline",
                            color: "#4caf50",
                          },
                          {
                            key: "medium",
                            label: "Trung bình",
                            icon: "sunny-outline",
                            color: "#ff9800",
                          },
                          {
                            key: "hard",
                            label: "Khó",
                            icon: "flame-outline",
                            color: "#f44336",
                          },
                          {
                            key: "mixed",
                            label: "Hỗn hợp",
                            icon: "shuffle-outline",
                            color: "#9c27b0",
                          },
                        ].map((item) => (
                          <TouchableOpacity
                            key={item.key}
                            style={[
                              styles.difficultyBtn,
                              difficulty === item.key && {
                                backgroundColor: item.color,
                                borderColor: item.color,
                              },
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setDifficulty(item.key);
                            }}
                          >
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color={
                                difficulty === item.key ? "#fff" : item.color
                              }
                            />
                            <Text
                              style={[
                                styles.difficultyText,
                                difficulty === item.key &&
                                  styles.difficultyTextActive,
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowSettingsModal(false);
                      }}
                      disabled={generating}
                    >
                      <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.confirmBtn,
                        generating && styles.confirmBtnDisabled,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleStartAssessment();
                      }}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.confirmBtnText}>
                            Đang tạo bài...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#fff"
                          />
                          <Text style={styles.confirmBtnText}>
                            Bắt đầu đánh giá
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <Text style={styles.headerSubtitle}>
          Chọn các chủ đề bạn muốn đánh giá năng lực
        </Text>
        <Text style={styles.selectedCount}>
          Đã chọn: {selectedTopics.length} chủ đề
        </Text>
      </View>

      {/* Topics List */}
      <ScrollView style={styles.content}>
        {Object.keys(groupedTopics)
          .sort()
          .map((volume) => (
            <View key={volume} style={styles.volumeSection}>
              <Text style={styles.volumeTitle}>Tập {volume}</Text>

              {Object.keys(groupedTopics[volume]).map((chapter) => (
                <View key={chapter} style={styles.chapterSection}>
                  <Text style={styles.chapterTitle}>{chapter}</Text>

                  {groupedTopics[volume][chapter].map((topic) => {
                    const isSelected = selectedTopics.includes(topic.topicId);
                    return (
                      <TouchableOpacity
                        key={topic.topicId}
                        style={[
                          styles.topicCard,
                          isSelected && styles.topicCardSelected,
                        ]}
                        onPress={() => toggleTopic(topic.topicId)}
                      >
                        <View style={styles.topicCheckbox}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          )}
                        </View>
                        <View style={styles.topicInfo}>
                          <Text
                            style={[
                              styles.topicName,
                              isSelected && styles.topicNameSelected,
                            ]}
                          >
                            {topic.name}
                          </Text>
                          {topic.description && (
                            <Text style={styles.topicDescription}>
                              {topic.description}
                            </Text>
                          )}
                          <Text style={styles.topicMeta}>
                            Câu hỏi: {topic.totalQuestions || 0}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            selectedTopics.length === 0 && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedTopics.length === 0}
        >
          <Text style={styles.continueBtnText}>
            Tiếp tục ({selectedTopics.length})
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  header: {
    backgroundColor: themeColors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  volumeSection: {
    marginBottom: 24,
  },
  volumeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.primary,
    marginBottom: 12,
  },
  chapterSection: {
    marginBottom: 16,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 8,
    paddingLeft: 8,
  },
  topicCard: {
    flexDirection: "row",
    backgroundColor: themeColors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  topicCardSelected: {
    borderColor: themeColors.primary,
    backgroundColor: `${themeColors.primary}10`,
  },
  topicCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: themeColors.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 4,
  },
  topicNameSelected: {
    color: themeColors.primary,
  },
  topicDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  topicMeta: {
    fontSize: 12,
    color: "#999",
  },
  bottomBar: {
    padding: 16,
    backgroundColor: themeColors.card,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  continueBtn: {
    flexDirection: "row",
    backgroundColor: themeColors.primary,
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueBtnDisabled: {
    backgroundColor: "#CCC",
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  modalBody: {
    padding: 20,
  },
  topicLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f0f0ff",
    borderRadius: 8,
  },
  topicValue: {
    color: themeColors.primary,
    fontWeight: "700",
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  numberInput: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  hintText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 6,
    fontStyle: "italic",
  },
  difficultyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  difficultyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    minWidth: "48%",
    justifyContent: "center",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#666",
  },
  difficultyTextActive: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: "#CCC",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
