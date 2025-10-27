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
};

export default aiService;
