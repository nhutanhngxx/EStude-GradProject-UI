import config from "../config/config.js";

const endpoints = {
  addStudent: "/api/admin/create-student",
  addTeacher: "/api/admin/create-teacher",
};

const adminService = {
  addStudent: async (student) => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        schoolId: student.schoolId,
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        password: student.password,
        dob: student.dob.toISOString().split("T")[0],
      });

      const response = await fetch(
        `${config.BASE_URL}${endpoints.addStudent}?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams({
      schoolId: teacher.schoolId,
      teacherCode: teacher.teacherCode,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      password: teacher.password,
      dob: teacher.dob.toISOString().split("T")[0],
      isAdmin: teacher.isAdmin,
      isHomeroomTeacher: teacher.isHomeroomTeacher,
    });

    const response = await fetch(
      `${config.BASE_URL}${endpoints.addTeacher}?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Thêm giáo viên thất bại");
    return await response.json();
  },
};

export default adminService;
