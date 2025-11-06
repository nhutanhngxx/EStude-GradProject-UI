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
};

export default topicService;
