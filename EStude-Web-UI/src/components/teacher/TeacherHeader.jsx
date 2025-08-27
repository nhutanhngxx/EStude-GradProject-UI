import React from "react";
import SearchBar from "../common/SearchBar";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";

const TeacherHeader = () => {
  return (
    // <header className="flex justify-between items-center bg-white dark:bg-blue-900 px-6 py-3 shadow-md">
    <header className="relative flex justify-between items-center bg-white dark:bg-blue-900 px-4 py-3 shadow-md">
      <SearchBar />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};

export default TeacherHeader;
