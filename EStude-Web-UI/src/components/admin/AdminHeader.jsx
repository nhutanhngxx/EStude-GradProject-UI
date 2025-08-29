import React, { useState } from "react";
import SearchBar from "../common/SearchBar";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";
import { FaSearch } from "react-icons/fa";

const AdminHeader = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    // <header className="flex justify-between items-center bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 shadow-md flex-wrap">
    <header className="relative flex justify-between items-center bg-white dark:bg-blue-900 px-4 py-3 shadow-md">
      {/* Left: Search */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Mobile search icon */}
        <button
          className="sm:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setShowSearch(!showSearch)}
        >
          <FaSearch className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* SearchBar desktop */}
        <div className="hidden sm:block">
          <SearchBar />
        </div>

        {/* SearchBar mobile toggle */}
        {showSearch && (
          <div className="w-full mt-2 sm:hidden">
            <SearchBar />
          </div>
        )}
      </div>

      {/* Right: Notification + User */}
      <div className="flex items-center gap-3 mt-2 sm:mt-0">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};

export default AdminHeader;
