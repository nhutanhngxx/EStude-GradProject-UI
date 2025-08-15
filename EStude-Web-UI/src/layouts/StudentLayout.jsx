import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import { Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <StudentSidebar />
      <div className="flex flex-col flex-1">
        <StudentHeader />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
