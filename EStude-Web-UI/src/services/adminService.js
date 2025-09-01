import config from "../config/config.js";

const endpoints = {
  addStudent: "/api/admin/create-student",
  addTeacher: "/api/admin/create-teacher",
  getAllUsers: "/api/users",
};

const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toISOString();
};

const adminService = {
  addStudent: async (student) => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("schoolId", student.schoolId);
      formData.append("studentCode", student.studentCode);
      formData.append("fullName", student.fullName);
      formData.append("email", student.email);
      formData.append("phone", student.numberPhone);
      formData.append("password", student.password);
      formData.append("dob", formatDateTime(student.dob));

      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch(
        `${config.BASE_URL}${endpoints.addStudent}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Thêm học sinh thất bại");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm học sinh:", error);
      return null;
    }
  },

  addTeacher: async (teacher) => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("schoolId", teacher.schoolId);
      formData.append("teacherCode", teacher.teacherCode);
      formData.append("fullName", teacher.fullName);
      formData.append("email", teacher.email);
      formData.append("phone", teacher.numberPhone);
      formData.append("password", teacher.password);
      formData.append("dob", formatDateTime(teacher.dob));
      formData.append("isAdmin", teacher.isAdmin.toString());
      formData.append(
        "isHomeroomTeacher",
        teacher.isHomeroomTeacher.toString()
      );

      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch(
        `${config.BASE_URL}${endpoints.addTeacher}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Thêm giáo viên thất bại");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thêm giáo viên:", error);
      return null;
    }
  },

  getAllUsers: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${config.BASE_URL}${endpoints.getAllUsers}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Lấy danh sách người dùng thất bại");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      return null;
    }
  },
};

export default adminService;
