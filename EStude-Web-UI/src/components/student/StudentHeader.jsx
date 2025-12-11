import React, { useEffect, useState } from "react";
import UserMenu from "../common/UserMenu";
import studentService from "../../services/studentService";

const StudentHeader = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [schoolName, setSchoolName] = useState(
    user?.school?.schoolName || "Trường học"
  );

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        if (user.userId) {
          const studentData = await studentService.getStudentById(user.userId);
          if (studentData?.school?.name) {
            setSchoolName(studentData.school.name);
          }
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
      }
    };
    fetchSchoolInfo();
  }, [user.userId]);

  return (
    <header className="flex justify-between items-center bg-white dark:bg-gray-800 px-6 py-3 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {schoolName}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};

export default StudentHeader;
