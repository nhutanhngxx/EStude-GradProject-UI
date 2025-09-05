import config from "../config/config.js";

const endpoints = {
  submission: "/api/submissions",
  getSubmissionByClassSubject:
    "/api/class-subjects/{classSubjectId}/submissions",
};

const submissionService = {
  getAllSubmissions: async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.submission}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách bài nộp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài nộp:", error);
      return null;
    }
  },
  getSubmissionByClassSubject: async (classSubjectId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSubmissionByClassSubject.replace(
          "{classSubjectId}",
          classSubjectId
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy danh sách bài nộp thất bại");
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài nộp:", error);
      return null;
    }
  },
};

export default submissionService;
