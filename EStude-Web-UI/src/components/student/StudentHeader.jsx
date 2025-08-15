import React from "react";
import SearchBar from "../common/SearchBar";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";

const StudentHeader = () => {
  return (
    <header className="flex justify-between items-center bg-green-100 dark:bg-green-900 px-6 py-3 shadow-md">
      <SearchBar />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};

export default StudentHeader;
