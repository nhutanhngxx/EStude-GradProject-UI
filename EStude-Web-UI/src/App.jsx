import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminManageAccounts from "./pages/admin/ManageUsers";
import AdminManageClasses from "./pages/admin/ManageClasses";
import AdminReports from "./pages/admin/Reports";
import AdminNotifications from "./pages/admin/Notifications";

import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherManageClasses from "./pages/teacher/ManageClasses";
import TeacherReports from "./pages/teacher/Reports";
import TeacherNotifications from "./pages/teacher/Notifications";
import TeacherSchedule from "./pages/teacher/TeachingSchedule";
import TeacherManageSubjects from "./pages/teacher/ManageSubjects";
import TeacherManageAttendance from "./pages/teacher/ManageAttendance";
import TeacherAITool from "./pages/teacher/AI";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentManageClasses from "./pages/student/ManageClasses";
import StudentReports from "./pages/student/Reports";
import StudentNotifications from "./pages/student/Notifications";

// thêm
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminManageAccounts />} />
            <Route path="classes" element={<AdminManageClasses />} />
            <Route path="statistics-reports" element={<AdminReports />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherManageClasses />} />
            <Route path="statistics-reports" element={<TeacherReports />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="schedules" element={<TeacherSchedule />} />
            <Route path="subjects" element={<TeacherManageSubjects />} />
            <Route path="attendance" element={<TeacherManageAttendance />} />
            <Route path="ai-tools" element={<TeacherAITool />} />
          </Route>
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="classes" element={<StudentManageClasses />} />
            <Route path="statistics-reports" element={<StudentReports />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
