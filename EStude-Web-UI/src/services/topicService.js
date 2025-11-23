import config from "../config/config.js";

const endpoints = {
  createTopic: "/api/topics",
  getAllTopics: "/api/topics",
  getTopicsBySubject: "/api/topics",
  updateTopic: "/api/topics/{topicId}",
  deleteTopic: "/api/topics/{topicId}",
};

const getAccessToken = () => localStorage.getItem("accessToken");

const topicService = {
  /**
   * Create a new topic
   * @param {Object} topic - Topic data
   * @returns {Promise<Object|null>} Created topic or null
   */
  createTopic: async (topic) => {
    try {
      const payload = {
        name: topic.name,
        description: topic.description || "",
        chapter: topic.chapter || "",
        orderIndex: topic.orderIndex || 1,
        gradeLevel: topic.gradeLevel,
        volume: topic.volume,
        subjectId: topic.subjectId,
      };

      const response = await fetch(
        `${config.BASE_URL}${endpoints.createTopic}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Thêm chủ đề thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm chủ đề:", error);
      throw error;
    }
  },

  /**
   * Get all topics with optional filters
   * @param {Object} filters - Filter options
   * @param {number} filters.subjectId - Subject ID (required)
   * @param {string} filters.gradeLevel - Grade level (optional)
   * @param {number} filters.volume - Volume (optional)
   * @returns {Promise<Array>} List of topics
   */
  getTopics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.subjectId) {
        params.append("subjectId", filters.subjectId);
      }

      if (filters.gradeLevel) {
        params.append("gradeLevel", filters.gradeLevel);
      }

      if (filters.volume) {
        params.append("volume", filters.volume);
      }

      const url = `${config.BASE_URL}${endpoints.getAllTopics}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Lấy danh sách chủ đề thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chủ đề:", error);
      throw error;
    }
  },

  /**
   * Update an existing topic
   * @param {number} topicId - Topic ID
   * @param {Object} topic - Updated topic data
   * @returns {Promise<Object>} Updated topic
   */
  updateTopic: async (topicId, topic) => {
    try {
      const payload = {
        name: topic.name,
        description: topic.description || "",
        chapter: topic.chapter || "",
        orderIndex: topic.orderIndex || 1,
        gradeLevel: topic.gradeLevel,
        volume: topic.volume,
        subjectId: topic.subjectId,
      };

      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateTopic.replace(
          "{topicId}",
          topicId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Cập nhật chủ đề thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi cập nhật chủ đề:", error);
      throw error;
    }
  },

  /**
   * Get a topic by ID
   * @param {number} topicId - Topic ID
   * @returns {Promise<Object>} Topic data
   */
  getTopicById: async (topicId) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/topics/${topicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Lấy thông tin chủ đề thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chủ đề:", error);
      throw error;
    }
  },

  /**
   * Delete a topic
   * @param {number} topicId - Topic ID
   * @returns {Promise<boolean>} Success status
   */
  deleteTopic: async (topicId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteTopic.replace(
          "{topicId}",
          topicId
        )}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Xóa chủ đề thất bại");
      }

      return true;
    } catch (error) {
      console.error("Lỗi khi xóa chủ đề:", error);
      throw error;
    }
  },

  // ==================== ASSESSMENT METHODS ====================

  /**
   * Tạo bộ câu hỏi ngẫu nhiên cho bài đánh giá
   * @param {Object} data - Assessment configuration
   * @param {number} data.studentId - ID học sinh
   * @param {number} data.subjectId - ID môn học
   * @param {Array<number>} data.topicIds - Danh sách ID topics
   * @param {number} data.numQuestions - Tổng số câu hỏi
   * @param {string} data.difficulty - "easy", "medium", "hard", "mixed"
   * @param {string} data.gradeLevel - "GRADE_10", "GRADE_11", "GRADE_12"
   */
  generateAssessmentQuestions: async (data) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/generate-questions`;
      const token = getAccessToken();

      console.log("Generating assessment questions:", url, data);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Assessment questions received:", result);
      return result;
    } catch (error) {
      console.error("Error generating assessment questions:", error);
      throw error;
    }
  },

  /**
   * Nộp bài đánh giá
   * @param {Object} data - Submission data
   * @param {string} data.assessmentId - ID bài đánh giá
   * @param {number} data.studentId - ID học sinh
   * @param {number} data.subjectId - ID môn học
   * @param {string} data.gradeLevel - Khối học
   * @param {string} data.difficulty - Độ khó
   * @param {Array} data.answers - Mảng câu trả lời [{questionId, chosenOptionId}]
   * @param {number} data.timeTaken - Thời gian làm bài (seconds)
   */
  submitAssessment: async (data) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submit`;
      const token = getAccessToken();

      console.log("Submitting assessment:", url, data);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Assessment submitted successfully:", result);
      return result;
    } catch (error) {
      console.error("Error submitting assessment:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tất cả bài nộp của học sinh
   * @param {number} studentId - ID học sinh
   */
  getStudentSubmissions: async (studentId) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/student/${studentId}/submissions`;
      const token = getAccessToken();

      console.log("Fetching student submissions:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Student submissions received:", result);
      return result;
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 bài nộp cụ thể
   * @param {number} submissionId - ID bài nộp
   */
  getSubmissionDetail: async (submissionId) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submissions/${submissionId}`;
      const token = getAccessToken();

      console.log("Fetching submission detail:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Submission detail received:", result);
      return result;
    } catch (error) {
      console.error("Error fetching submission detail:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê accuracy các topics đã được đánh giá trước đó
   * @param {number} studentId - ID học sinh
   */
  getTopicStatistics: async (studentId) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/student/${studentId}/topic-statistics`;
      const token = getAccessToken();

      console.log("Fetching topic statistics:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Topic statistics received:", result);
      return result;
    } catch (error) {
      console.error("Error fetching topic statistics:", error);
      throw error;
    }
  },

  /**
   * Đánh dấu bài nộp đã được đánh giá tiến bộ
   * @param {number} submissionId - ID bài nộp
   */
  markSubmissionEvaluated: async (submissionId) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submissions/${submissionId}/mark-evaluated`;
      const token = getAccessToken();

      console.log("Marking submission as evaluated:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Submission marked as evaluated:", result);
      return result;
    } catch (error) {
      console.error("Error marking submission as evaluated:", error);
      throw error;
    }
  },
};

export default topicService;
