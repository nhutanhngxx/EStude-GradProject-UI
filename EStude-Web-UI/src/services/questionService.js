import config from "../config/config.js";

const endpoints = {
  addQuestionToAssignment: "/api/questions/assignments/{assignmentId}",
};

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
};

export default questionService;
