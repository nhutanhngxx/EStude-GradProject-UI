import TeacherSidebar from "../components/teacher/TeacherSidebar";
import TeacherHeader from "../components/teacher/TeacherHeader";
import { Outlet } from "react-router-dom";

export default function TeacherLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <TeacherSidebar />
      <div className="flex flex-col flex-1">
        <TeacherHeader />
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
