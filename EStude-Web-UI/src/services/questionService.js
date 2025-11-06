import config from "../config/config.js";

const endpoints = {
  addQuestionToAssignment: "/api/questions/assignments/{assignmentId}",
  // Question Bank endpoints
  createQuestionBank: "/api/questions/bank",
  getAllQuestionBank: "/api/questions/bank",
  getQuestionBankByTopic: "/api/questions/bank/topic/{topicId}",
  getQuestionBankById: "/api/questions/bank/{questionId}",
  updateQuestionBank: "/api/questions/bank/{questionId}",
  deleteQuestionBank: "/api/questions/bank/{questionId}",
  countQuestionsByTopic: "/api/questions/bank/topic/{topicId}/count",
};

const getAccessToken = () => localStorage.getItem("accessToken");

const questionService = {
  addQuestion: async (assignmentId, question) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.addQuestionToAssignment.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(question),
        }
      );
      if (!response.ok) {
        throw new Error("Thêm câu hỏi thất bại");
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm câu hỏi:", error);
      return null;
    }
  },

  // ============ QUESTION BANK APIs ============

  /**
   * Create a new question in the question bank
   * @param {Object} question - Question data
   * @returns {Promise<Object>} Created question
   */
  createQuestionBank: async (question) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.createQuestionBank}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(question),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Thêm câu hỏi vào ngân hàng thất bại"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm câu hỏi vào ngân hàng:", error);
      throw error;
    }
  },

  /**
   * Get all questions from question bank
   * @returns {Promise<Object>} Response with questions array
   */
  getAllQuestionBank: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllQuestionBank}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Lấy danh sách câu hỏi thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi:", error);
      throw error;
    }
  },

  /**
   * Get questions by topic with optional difficulty filter
   * @param {number} topicId - Topic ID
   * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD) - optional
   * @returns {Promise<Object>} Response with questions array
   */
  getQuestionBankByTopic: async (topicId, difficulty = null) => {
    try {
      let url = `${config.BASE_URL}${endpoints.getQuestionBankByTopic.replace(
        "{topicId}",
        topicId
      )}`;

      if (difficulty) {
        url += `?difficulty=${difficulty}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Lấy danh sách câu hỏi theo chủ đề thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi theo chủ đề:", error);
      throw error;
    }
  },

  /**
   * Get question by ID
   * @param {number} questionId - Question ID
   * @returns {Promise<Object>} Question data
   */
  getQuestionBankById: async (questionId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getQuestionBankById.replace(
          "{questionId}",
          questionId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Lấy chi tiết câu hỏi thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết câu hỏi:", error);
      throw error;
    }
  },

  /**
   * Update a question in the question bank
   * @param {number} questionId - Question ID
   * @param {Object} question - Updated question data
   * @returns {Promise<Object>} Updated question
   */
  updateQuestionBank: async (questionId, question) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.updateQuestionBank.replace(
          "{questionId}",
          questionId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(question),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Cập nhật câu hỏi thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi cập nhật câu hỏi:", error);
      throw error;
    }
  },

  /**
   * Delete a question from the question bank
   * @param {number} questionId - Question ID
   * @returns {Promise<Object>} Success response
   */
  deleteQuestionBank: async (questionId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.deleteQuestionBank.replace(
          "{questionId}",
          questionId
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
        throw new Error(errorData.message || "Xóa câu hỏi thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi xóa câu hỏi:", error);
      throw error;
    }
  },

  /**
   * Count questions by topic
   * @param {number} topicId - Topic ID
   * @returns {Promise<Object>} Count response
   */
  countQuestionsByTopic: async (topicId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.countQuestionsByTopic.replace(
          "{topicId}",
          topicId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Đếm số lượng câu hỏi thất bại");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi đếm số lượng câu hỏi:", error);
      throw error;
    }
  },
};

export default questionService;
