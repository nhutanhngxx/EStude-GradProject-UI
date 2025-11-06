import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminManageSchools from "./pages/admin/ManageSchools";
import AdminManageAccounts from "./pages/admin/ManageUsers";
import AdminManageClasses from "./pages/admin/ManageClasses";
import AdminManageSubjects from "./pages/admin/ManageSubjects";
import AdminManageTopics from "./pages/admin/ManageTopics";
import AdminManageQuestionBank from "./pages/admin/ManageQuestionBank";
// ✅ Ẩn tab Phân tích & Báo cáo
// import AdminReports from "./pages/admin/Reports";
import AdminNotifications from "./pages/admin/Notifications";

import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherManageClasses from "./pages/teacher/ManageClasses";
import TeacherReports from "./pages/teacher/Reports";
import TeacherNotifications from "./pages/teacher/Notifications";
import TeacherManageSchedules from "./pages/teacher/ManageSchedules";
import TeacherSchedule from "./pages/teacher/TeachingSchedule";
import TeacherManageSubjects from "./pages/teacher/ManageSubjects";
import TeacherManageAttendance from "./pages/teacher/ManageAttendance";
import TeacherAITool from "./pages/teacher/AI";
import TeacherMyClasses from "./pages/teacher/MyClasses";
import TeacherHomeroomClass from "./pages/teacher/HomeroomClass";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentManageClasses from "./pages/student/ManageClasses";
import StudentReports from "./pages/student/Reports";
import StudentNotifications from "./pages/student/Notifications";

import ProtectedRoute from "./components/ProtectedRoute";

import "./i18n";
import TeacherGradeInput from "./pages/teacher/TeacherGradeInput";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="schools" element={<AdminManageSchools />} />
            <Route path="users" element={<AdminManageAccounts />} />
            <Route path="classes" element={<AdminManageClasses />} />
            <Route path="subjects" element={<AdminManageSubjects />} />
            <Route path="topics" element={<AdminManageTopics />} />
            <Route path="question-bank" element={<AdminManageQuestionBank />} />
            {/* ✅ Ẩn tab Phân tích & Báo cáo */}
            {/* <Route path="statistics-reports" element={<AdminReports />} /> */}
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherManageClasses />} />
            <Route path="statistics-reports" element={<TeacherReports />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route
              path="manage-schedules"
              element={<TeacherManageSchedules />}
            />
            <Route path="schedules" element={<TeacherSchedule />} />
            <Route path="subjects" element={<TeacherManageSubjects />} />
            <Route path="attendance" element={<TeacherManageAttendance />} />
            <Route path="ai-tools" element={<TeacherAITool />} />
            <Route path="my-classes" element={<TeacherMyClasses />} />
            <Route path="homeroom-class" element={<TeacherHomeroomClass />} />
            <Route path="grades" element={<TeacherGradeInput />} />
          </Route>
        </Route>

        {/* Student */}
        {/* <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="classes" element={<StudentManageClasses />} />
            <Route path="statistics-reports" element={<StudentReports />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>
        </Route> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
