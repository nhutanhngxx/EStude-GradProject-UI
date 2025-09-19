import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <AdminHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
