import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import { Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <StudentSidebar />
      <div className="flex flex-col flex-1">
        <StudentHeader />
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
