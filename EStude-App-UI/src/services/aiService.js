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
};

export default aiService;
