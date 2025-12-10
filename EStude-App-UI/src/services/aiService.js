import config from "../configs/config";

const endpoints = {
  // Phân tích AI của bài nộp
  getAIAnalysisBySubmission:
    "/api/ai/analyze/{assignmentId}/student/{studentId}",

  // Lấy phân tích AI của bài nộp
  getAIAnalysisResultOfSubmission:
    "/api/ai/student/{studentId}/assignment/{assignmentId}",

  // Phân tích/dự đoán môn học của học sinh
  predictSubjectsForStudent: "/api/ai/analyze/{studentId}",

  // Lấy phân tích/dự đoán môn học mới nhất
  getLatestPredictedSubjectsForStudent:
    "/api/ai/subject-latest/student/{studentId}",

  // Phân tích/dự đoán học lực của học kỳ
  predictStudentGPA: "/api/ai/student/{studentId}/predict-semeter",

  // Lấy phân tích/dự đoán học lực mới nhất
  getLatestPredictedGPAForStudent:
    "/api/ai/semester-latest/student/{studentId}",

  // Phân tích chi tiết từng câu hỏi
  layer1: "/api/ai/learning-feedback",

  // Đưa ra gợi ý học tập cá nhân hóa
  layer2: "/api/ai/learning-recommendation",

  // Sinh ra câu hỏi luyện tập
  layer3: "/api/ai/generate-practice-quiz",

  // Đánh giá tiện bộ sau luyện tập
  layer4: "/api/ai/improvement-evaluation",

  getLayer1: "/api/ai/me/feedback/latest",

  // Lấy TẤT CẢ Feedback layer 1 theo assignment_id
  getAIFeedbackByAssignmentId: "/api/ai/me/feedback/assignment/{assignmentId}",

  // Lấy TẤT CẢ Recommendation layer 2 theo assignment_id
  getAIRecommendationByAssignmentId:
    "/api/ai/me/recommendation/assignment/{assignmentId}",

  // Lấy TẤT CẢ Practice Review layer 3.5 theo assignment_id
  getAIPracticeReviewByAssignmentId:
    "/api/ai/me/practice-review/assignment/{assignmentId}",
  // Gửi kết quả bài luyện tập (Layer 3.5)
  submitPracticeReview: "/api/ai/review-practice-results",

  // Lấy TẤT CẢ Improvement layer 4 theo assignment_id
  getAIImprovementByAssignmentId:
    "/api/ai/me/improvement/assignment/{assignmentId}",

  // Lấy TẤT CẢ Improvement của user
  getAllUserImprovements: "/api/ai/me/improvement",

  // Layer 5: Learning Roadmap Generation
  getFeedbackLatest: "/api/ai/me/feedback/latest",
  getImprovementLatest: "/api/ai/me/improvement/latest",
  generateLearningRoadmap: "/api/ai/generate-learning-roadmap",
  getRoadmapLatest: "/api/ai/me/roadmap/latest",
  getAllRoadmaps: "/api/ai/me/roadmap", // Get all roadmaps (array)
  getRequestById: "/api/ai/request/{requestId}", // Get request by ID (no token needed)

  // Layer 5: Progress Tracking APIs (NEW - Nov 2025)
  getRoadmapLatestSummary: "/api/ai/me/roadmap/latest/summary",
  getRoadmapProgress: "/api/ai/me/roadmap/progress/{resultId}",
  markTaskComplete: "/api/ai/me/roadmap/{resultId}/task/{taskId}/complete",
  getNextTasks: "/api/ai/me/roadmap/{resultId}/next-tasks",
  skipTask: "/api/ai/me/roadmap/{resultId}/task/{taskId}/skip",
};

const aiService = {
  getAIAnalysisBySubmission: async (assignmentId, studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAIAnalysisBySubmission
          .replace("{assignmentId}", assignmentId)
          .replace("{studentId}", studentId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Lấy phân tích AI thất bại");
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Phân tích AI hiện không khả dụng:", error);
      return null;
    }
  },

  getAIAnalysisResultOfSubmission: async (studentId, assignmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAIAnalysisResultOfSubmission
          .replace("{studentId}", studentId)
          .replace("{assignmentId}", assignmentId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Lấy kết quả phân tích AI thất bại");
        return [];
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy kết quả phân tích AI:", error);
      return null;
    }
  },

  predictSubjectsForStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.predictSubjectsForStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Dự đoán môn học thất bại");
        return [];
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Dự đoán môn học hiện không khả dụng:", error);
      return null;
    }
  },

  getLatestPredictedSubjectsForStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${
          config.BASE_URL
        }${endpoints.getLatestPredictedSubjectsForStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Lấy kết quả dự đoán môn học thất bại");
        return [];
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy kết quả dự đoán môn học:", error);
      return null;
    }
  },

  predictStudentGPA: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.predictStudentGPA.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Dự đoán học lực thất bại");
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Dự đoán học lực hiện không khả dụng:", error);
      return null;
    }
  },

  getLatestPredictedGPAForStudent: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getLatestPredictedGPAForStudent.replace(
          "{studentId}",
          studentId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        // throw new Error("Lấy kết quả dự đoán học lực thất bại");
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy kết quả dự đoán học lực:", error);
      return null;
    }
  },

  /**
   * Layer 1: Phân tích chi tiết từng câu hỏi
   * @param {Object} payload - { assignment_id, submission_id, student_name, subject, questions }
   * @param {string} token - JWT token
   */
  layer1: async (payload, token) => {
    try {
      // Validate required fields
      if (!payload.submission_id) {
        console.error("Layer1: submission_id is required");
        return null;
      }

      const response = await fetch(`${config.BASE_URL}${endpoints.layer1}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Layer1 request failed:", response.status, errText);
        return null;
      }

      const result = await response.json();
      console.log("Layer1 success:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi phân tích chi tiết từng câu hỏi:", error);
      return null;
    }
  },

  /**
   * Layer 2: Đưa ra gợi ý học tập cá nhân hóa
   * @param {Object} payload - { submission_id, feedback_data }
   * @param {string} token - JWT token
   */
  layer2: async (payload, token) => {
    try {
      // Validate required fields
      if (!payload.submission_id) {
        console.error("Layer2: submission_id is required");
        return null;
      }

      const response = await fetch(`${config.BASE_URL}${endpoints.layer2}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Layer2 request failed:", response.status, errText);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(
        "Đưa ra gợi ý học tập cá nhân hóa hiện không khả dụng:",
        error
      );
      return null;
    }
  },

  /**
   * Layer 3: Sinh ra câu hỏi luyện tập
   * @param {Object} payload - { submission_id, subject, topics, num_questions, difficulty, reference_questions }
   * @param {string} token - JWT token
   */
  layer3: async (payload, token) => {
    try {
      // Validate required fields
      if (!payload.submission_id) {
        console.error("❌ Layer3: submission_id is required");
        return null;
      }

      console.log("📤 Layer3 API Call:", {
        url: `${config.BASE_URL}${endpoints.layer3}`,
        payload: payload,
        hasToken: !!token,
      });

      const response = await fetch(`${config.BASE_URL}${endpoints.layer3}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Layer3 Response Status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Layer3 request failed:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errText,
        });
        return null;
      }

      const result = await response.json();
      console.log("✅ Layer3 success:", result);
      return result;
    } catch (error) {
      console.error("❌ Layer3 Exception:", {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      return null;
    }
  },

  /**
   * Layer 4: Đánh giá tiến bộ sau luyện tập
   * @param {Object} payload - { submission_id, subject, student_id, result_id, previous_results_id, previous_results, new_results }
   * @param {string} token - JWT token
   */
  layer4: async (payload, token) => {
    try {
      // Validate required fields
      if (!payload.submission_id) {
        console.error("Layer4: submission_id is required");
        return null;
      }

      const response = await fetch(`${config.BASE_URL}${endpoints.layer4}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Layer4 request failed:", response.status, errText);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(
        "Đánh giá tiện ích sau luyện tập hiện không khả dụng:",
        error
      );
      return null;
    }
  },

  getLayer1: async (token) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.getLayer1}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy kết quả phân tích AI:", error);
      return null;
    }
  },

  // Lấy TẤT CẢ Feedback layer 1 theo assignment_id
  getAIFeedbackByAssignmentId: async (assignmentId, token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAIFeedbackByAssignmentId.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get AI Feedback failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy feedback AI:", error);
      return null;
    }
  },

  // Lấy TẤT CẢ Recommendation layer 2 theo assignment_id
  getAIRecommendationByAssignmentId: async (assignmentId, token) => {
    console.log("Token Layer 2", token);

    try {
      const response = await fetch(
        `${
          config.BASE_URL
        }${endpoints.getAIRecommendationByAssignmentId.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get AI Recommendation failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy recommendation AI:", error);
      return null;
    }
  },

  // Lấy TẤT CẢ Practice Review layer 3.5 theo assignment_id
  getAIPracticeReviewByAssignmentId: async (assignmentId, token) => {
    try {
      const response = await fetch(
        `${
          config.BASE_URL
        }${endpoints.getAIPracticeReviewByAssignmentId.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get AI Practice Review failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy practice review AI:", error);
      return null;
    }
  },

  /**
   * Layer 3.5: Gửi kết quả bài luyện tập
   * @param {Object} payload - { submission_id, assignment_id, student_name, subject, questions }
   * @param {string} token - JWT token
   */
  submitPracticeReview: async (payload, token) => {
    try {
      // Validate required fields
      if (!payload.submission_id) {
        console.error("Layer3.5: submission_id is required");
        return null;
      }

      const response = await fetch(
        `${config.BASE_URL}${endpoints.submitPracticeReview}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        console.error("Submit Practice Review failed:", response.status, text);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi gửi kết quả bài luyện tập (Layer 3.5):", error);
      return null;
    }
  },

  // Lấy TẤT CẢ Improvement layer 4 theo assignment_id
  getAIImprovementByAssignmentId: async (assignmentId, token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAIImprovementByAssignmentId.replace(
          "{assignmentId}",
          assignmentId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get AI Improvement failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy improvement AI:", error);
      return null;
    }
  },

  // Lấy TẤT CẢ Improvement của user
  getAllUserImprovements: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllUserImprovements}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get All User Improvements failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy tất cả improvement của user:", error);
      return null;
    }
  },

  /**
   * Layer 5: Lấy feedback mới nhất (câu hỏi làm sai)
   * @param {string} token - JWT token
   */
  getFeedbackLatest: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getFeedbackLatest}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get Feedback Latest failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy feedback mới nhất:", error);
      return null;
    }
  },

  /**
   * Layer 5: Lấy improvement mới nhất (đánh giá tiến bộ)
   * @param {string} token - JWT token
   */
  getImprovementLatest: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getImprovementLatest}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get Improvement Latest failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy improvement mới nhất:", error);
      return null;
    }
  },

  /**
   * Layer 5: Tạo lộ trình học tập cá nhân hóa
   * @param {Object} payload - { submission_id, student_id, subject, evaluation_data, incorrect_questions, learning_style, available_time_per_day }
   * @param {string} token - JWT token
   */
  generateLearningRoadmap: async (payload, token) => {
    try {
      console.log("📤 Generate Learning Roadmap API Call:", {
        url: `${config.BASE_URL}${endpoints.generateLearningRoadmap}`,
        payload: payload,
        hasToken: !!token,
      });

      const response = await fetch(
        `${config.BASE_URL}${endpoints.generateLearningRoadmap}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📥 Generate Roadmap Response Status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Generate Roadmap failed:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errText,
        });
        return null;
      }

      const result = await response.json();
      console.log("✅ Generate Roadmap success:", result);
      return result;
    } catch (error) {
      console.error("❌ Generate Roadmap Exception:", {
        message: error.message,
        error: error,
      });
      return null;
    }
  },

  /**
   * Layer 5: Lấy lộ trình học tập mới nhất
   * @param {string} token - JWT token
   */
  getRoadmapLatest: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getRoadmapLatest}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Get Roadmap Latest failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy roadmap mới nhất:", error);
      return null;
    }
  },

  /**
   * Layer 5: Lấy request data theo requestId (không cần token)
   * @param {number} requestId - Request ID
   * @returns {Object} Request data với dataPayload đầy đủ
   */
  getRequestById: async (requestId) => {
    try {
      const url = `${config.BASE_URL}${endpoints.getRequestById}`.replace(
        "{requestId}",
        requestId
      );
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error("Get Request by ID failed:", response.status);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy request data:", error);
      return null;
    }
  },

  // ==================== PROGRESS TRACKING APIs (NEW) ====================

  /**
   * Lấy tất cả roadmaps (lịch sử)
   * @param {string} token - JWT token
   * @returns {Array} Mảng các roadmap objects
   */
  getAllRoadmaps: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllRoadmaps}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Get All Roadmaps failed:", response.status);
        return [];
      }

      const result = await response.json();
      console.log("✅ All Roadmaps API Response:", result);
      // Backend có thể trả về {data: [...]} hoặc trực tiếp [...]
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách roadmaps:", error);
      return [];
    }
  },

  /**
   * Lấy summary roadmap mới nhất (dùng cho HomeScreen card)
   * @param {string} token - JWT token
   * @returns {Object} { roadmap_id, subject, overall_goal, current_phase, progress }
   */
  getRoadmapLatestSummary: async (token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getRoadmapLatestSummary}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No active roadmap found");
          return null;
        }
        console.error("Get Roadmap Summary failed:", response.status);
        return null;
      }

      const result = await response.json();
      console.log(
        "✅ Roadmap Summary API Response:",
        JSON.stringify(result, null, 2)
      );
      return result.data || result; // Handle both {data: ...} and direct response
    } catch (error) {
      console.error("Lỗi khi lấy roadmap summary:", error);
      return null;
    }
  },

  /**
   * Lấy full roadmap với progress (dùng cho RoadmapScreen)
   * @param {number} resultId - AI Analysis Result ID
   * @param {string} token - JWT token
   * @returns {Object} Full roadmap data với calculated_progress
   */
  getRoadmapProgress: async (resultId, token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getRoadmapProgress.replace(
          "{resultId}",
          resultId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Get Roadmap Progress failed:", response.status);
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy roadmap progress:", error);
      return null;
    }
  },

  /**
   * Đánh dấu task hoàn thành
   * @param {number} resultId - AI Analysis Result ID
   * @param {string} taskId - Task ID (e.g., "task_1_1")
   * @param {Object} completionData - { actual_time_spent_minutes, score, accuracy }
   * @param {string} token - JWT token
   * @returns {Object} { success, message, updated_progress }
   */
  markTaskComplete: async (resultId, taskId, completionData, token) => {
    try {
      console.log("📤 Mark Task Complete:", {
        resultId,
        taskId,
        completionData,
      });

      const response = await fetch(
        `${config.BASE_URL}${endpoints.markTaskComplete
          .replace("{resultId}", resultId)
          .replace("{taskId}", taskId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(completionData),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Mark Task Complete failed:", {
          status: response.status,
          errorBody: errText,
        });
        return null;
      }

      const result = await response.json();
      console.log("✅ Task marked complete:", result);
      return result;
    } catch (error) {
      console.error("❌ Mark Task Complete Exception:", error);
      return null;
    }
  },

  /**
   * Bỏ qua task
   * @param {number} resultId - AI Analysis Result ID
   * @param {string} taskId - Task ID
   * @param {string} token - JWT token
   * @returns {Object} { success, message, updated_progress }
   */
  skipTask: async (resultId, taskId, token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.skipTask
          .replace("{resultId}", resultId)
          .replace("{taskId}", taskId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Skip Task failed:", response.status);
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi skip task:", error);
      return null;
    }
  },

  /**
   * Lấy 3 tasks tiếp theo cần làm
   * @param {number} resultId - AI Analysis Result ID
   * @param {string} token - JWT token
   * @returns {Object} { success, next_tasks: [...] }
   */
  getNextTasks: async (resultId, token) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getNextTasks.replace(
          "{resultId}",
          resultId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Get Next Tasks failed:", response.status);
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy next tasks:", error);
      return null;
    }
  },
};

export default aiService;
