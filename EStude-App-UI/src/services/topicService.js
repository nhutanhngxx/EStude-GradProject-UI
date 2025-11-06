import config from "../configs/config";

const topicService = {
  /**
   * Lấy tất cả topics theo subjectId
   * @param {number} subjectId
   * @param {string} gradeLevel - Optional: GRADE_10, GRADE_11, GRADE_12
   */
  getTopicsBySubject: async (subjectId, gradeLevel = null) => {
    try {
      let url = `${config.BASE_URL}/api/topics?subjectId=${subjectId}`;
      if (gradeLevel) {
        url += `&gradeLevel=${gradeLevel}`;
      }

      console.log("Fetching topics from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log("Topics data received:", data);
      return data;
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  },

  /**
   * Lấy questions theo topicId
   * @param {number} topicId
   * @param {string} difficulty - Optional: EASY, MEDIUM, HARD
   */
  /**
   * Tạo bộ câu hỏi ngẫu nhiên cho bài đánh giá
   * @param {Object} data - Assessment configuration
   * @param {number} data.studentId - ID học sinh
   * @param {number} data.subjectId - ID môn học
   * @param {Array<number>} data.topicIds - Danh sách ID topics
   * @param {number} data.numQuestions - Tổng số câu hỏi
   * @param {string} data.difficulty - "easy", "medium", "hard", "mixed"
   * @param {string} data.gradeLevel - "GRADE_10", "GRADE_11", "GRADE_12"
   * @param {string} token - JWT token
   */
  generateAssessmentQuestions: async (data, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/generate-questions`;

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
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Assessment questions received:", result);
      return result;
    } catch (error) {
      // console.error("Error generating assessment questions:", error);
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
   * @param {string} token - JWT token
   */
  submitAssessment: async (data, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submit`;

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
        const errorData = await response.json();
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
   * @param {string} token - JWT token
   */
  getStudentSubmissions: async (studentId, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/student/${studentId}/submissions`;

      console.log("Fetching student submissions:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
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
   * @param {string} token - JWT token
   */
  getSubmissionDetail: async (submissionId, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submissions/${submissionId}`;

      console.log("Fetching submission detail:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
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
   * @param {string} token - JWT token
   */
  getTopicStatistics: async (studentId, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/student/${studentId}/topic-statistics`;

      console.log("Fetching topic statistics:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
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
   * @param {string} token - JWT token
   */
  markSubmissionEvaluated: async (submissionId, token) => {
    try {
      const url = `${config.BASE_URL}/api/assessment/submissions/${submissionId}/mark-evaluated`;

      console.log("Marking submission as evaluated:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
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
