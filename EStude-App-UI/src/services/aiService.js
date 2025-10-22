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
  layer4: "/api/ai/generate-practice-quiz",

  getLayer1: "/api/ai/me/feedback/latest",
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

  layer1: async (payload, token) => {
    try {
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

  layer2: async (payload, token) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.layer2}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // throw new Error("Đưa ra gợi ý học tập cá nhân hóa thất bại");
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

  layer3: async (payload, token) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.layer3}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // throw new Error("Sinh ra câu hỏi luyện tập thất bại");
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Sinh ra câu hỏi luyện tập hiện không khả dụng:", error);
      return null;
    }
  },

  layer4: async (payload, token) => {
    try {
      const response = await fetch(`${config.BASE_URL}${endpoints.layer4}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // throw new Error("Đánh giá tiện ích sau luyện tập thất bại");
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
        headers: { "Content-Type": "application/json" },
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
};

export default aiService;
