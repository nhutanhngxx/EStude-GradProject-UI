import config from "../configs/config";

const endpoints = {
  submission: "/api/submissions",
  getAllSubmissionsByStudentId: "/api/submissions/student/{studentId}",
  getSubmissionByClassSubject:
    "/api/class-subjects/{classSubjectId}/submissions",
  getSubmissionByStudentIdAndAssignmentId:
    "/api/submissions/student/{studentId}/assignment/{assignmentId}",
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

  getAllSubmissionsByStudentId: async (studentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllSubmissionsByStudentId.replace(
          "{studentId}",
          studentId
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

  getSubmissionByStudentIdAndAssignmentId: async (studentId, assignmentId) => {
    try {
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getSubmissionByStudentIdAndAssignmentId
          .replace("{studentId}", studentId)
          .replace("{assignmentId}", assignmentId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Lấy bài nộp thất bại");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Lỗi khi lấy bài nộp:", error);
      return null;
    }
  },
};

export default submissionService;
