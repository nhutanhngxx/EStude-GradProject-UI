import config from "../configs/config";

const endpoints = {
  submission: "/api/submissions",
  getSubmissionByClassSubject:
    "/api/class-subjects/{classSubjectId}/submissions",
};

const submissionService = {
  addSubmission: async (submission, files = []) => {
    try {
      const formData = new FormData();

      // Truyền object submission dưới dạng JSON string
      formData.append("submission", JSON.stringify(submission));

      // Nếu có file thì append vào
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `${config.BASE_URL}${endpoints.submission}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Thêm bài nộp thất bại");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi thêm bài nộp:", error);
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
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài nộp:", error);
      return null;
    }
  },
};

export default submissionService;
