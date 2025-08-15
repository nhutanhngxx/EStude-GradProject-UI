import TeacherSidebar from "../components/teacher/TeacherSidebar";
import TeacherHeader from "../components/teacher/TeacherHeader";
import { Outlet } from "react-router-dom";

export default function TeacherLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <TeacherSidebar />

      <div className="flex flex-col flex-1">
        <TeacherHeader />

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
