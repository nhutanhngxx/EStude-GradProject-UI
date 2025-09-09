import config from "../configs/config";

const endpoints = {
  // Phân tích AI của bài nộp
  getAIAnalysisBySubmission:
    "/api/ai/analyze/{assignmentId}/student/{studentId}",
  // Lấy phân tích AI của bài nộp
  getAIAnalysisResultOfSubmission:
    "/api/ai/student/{studentId}/assignment/{assignmentId}",
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
};

export default aiService;
