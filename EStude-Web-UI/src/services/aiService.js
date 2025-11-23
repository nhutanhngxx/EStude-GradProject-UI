import config from "../config/config";

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

  // Layer 1-5 từ mobile app
  layer1: "/api/ai/learning-feedback",
  layer2: "/api/ai/learning-recommendation",
  layer3: "/api/ai/generate-practice-quiz",
  layer4: "/api/ai/improvement-evaluation",
  getLayer1: "/api/ai/me/feedback/latest",
  getAIFeedbackByAssignmentId: "/api/ai/me/feedback/assignment/{assignmentId}",
  getAIRecommendationByAssignmentId:
    "/api/ai/me/recommendation/assignment/{assignmentId}",
  getAIPracticeReviewByAssignmentId:
    "/api/ai/me/practice-review/assignment/{assignmentId}",
  submitPracticeReview: "/api/ai/review-practice-results",
  getAIImprovementByAssignmentId:
    "/api/ai/me/improvement/assignment/{assignmentId}",
  getAllUserImprovements: "/api/ai/me/improvement",
  getFeedbackLatest: "/api/ai/me/feedback/latest",
  getImprovementLatest: "/api/ai/me/improvement/latest",
  generateLearningRoadmap: "/api/ai/generate-learning-roadmap",
  getRoadmapLatest: "/api/ai/me/roadmap/latest",
  getAllRoadmaps: "/api/ai/me/roadmap",
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
        throw new Error("Lấy phân tích AI thất bại");
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
        throw new Error("Lấy kết quả phân tích AI thất bại");
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
        throw new Error("Dự đoán môn học thất bại");
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
        throw new Error("Lấy kết quả dự đoán môn học thất bại");
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
        throw new Error("Dự đoán học lực thất bại");
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
        throw new Error("Lấy kết quả dự đoán học lực thất bại");
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
   */
  layer1: async (payload, token) => {
    try {
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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi phân tích chi tiết từng câu hỏi:", error);
      return null;
    }
  },

  /**
   * Layer 2: Đưa ra gợi ý học tập cá nhân hóa
   */
  layer2: async (payload, token) => {
    try {
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
      return await response.json();
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
   */
  layer3: async (payload, token) => {
    try {
      if (!payload.submission_id) {
        console.error("❌ Layer3: submission_id is required");
        return null;
      }
      const response = await fetch(`${config.BASE_URL}${endpoints.layer3}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Layer3 request failed:", response.status, errText);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Layer3 Exception:", error);
      return null;
    }
  },

  /**
   * Layer 4: Đánh giá tiến bộ sau luyện tập
   */
  layer4: async (payload, token) => {
    try {
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
      return await response.json();
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
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy kết quả phân tích AI:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy feedback AI:", error);
      return null;
    }
  },

  getAIRecommendationByAssignmentId: async (assignmentId, token) => {
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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy recommendation AI:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy practice review AI:", error);
      return null;
    }
  },

  submitPracticeReview: async (payload, token) => {
    try {
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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi gửi kết quả bài luyện tập (Layer 3.5):", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy improvement AI:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy tất cả improvement của user:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy feedback mới nhất:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy improvement mới nhất:", error);
      return null;
    }
  },

  generateLearningRoadmap: async (payload, token) => {
    try {
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
      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Generate Roadmap failed:", response.status, errText);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Generate Roadmap Exception:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy roadmap mới nhất:", error);
      return null;
    }
  },

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
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách roadmaps:", error);
      return [];
    }
  },

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
      return result.data || result;
    } catch (error) {
      console.error("Lỗi khi lấy roadmap summary:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy roadmap progress:", error);
      return null;
    }
  },

  markTaskComplete: async (resultId, taskId, completionData, token) => {
    try {
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
        console.error(
          "❌ Mark Task Complete failed:",
          response.status,
          errText
        );
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Mark Task Complete Exception:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi skip task:", error);
      return null;
    }
  },

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
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy next tasks:", error);
      return null;
    }
  },

  // Assessment & Competency methods (giữ lại để tương thích)
  getAssessmentHistory: async (userId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/ai/assessment/history/${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đánh giá:", error);
      return [];
    }
  },

  generateAssessmentQuestions: async (subjectId, topicId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/ai/assessment/generate?subjectId=${subjectId}&topicId=${topicId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Không thể tạo câu hỏi");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi tạo câu hỏi:", error);
      throw error;
    }
  },

  submitAssessment: async (assessmentData) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/ai/assessment/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assessmentData),
        }
      );
      if (!response.ok) throw new Error("Nộp bài thất bại");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      throw error;
    }
  },

  getAssessmentResult: async (assessmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/ai/assessment/result/${assessmentId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Không thể lấy kết quả");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy kết quả:", error);
      throw error;
    }
  },

  getCompetencyMap: async (userId, subjectId = null) => {
    try {
      const url = subjectId
        ? `${config.BASE_URL}/api/ai/competency/${userId}?subjectId=${subjectId}`
        : `${config.BASE_URL}/api/ai/competency/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.warn("Bản đồ năng lực chưa có dữ liệu:", response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy bản đồ năng lực:", error);
      return null;
    }
  },

  getLearningRoadmap: async (userId, subjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/ai/roadmap/${userId}?subjectId=${subjectId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy lộ trình:", error);
      return null;
    }
  },
};

export default aiService;
