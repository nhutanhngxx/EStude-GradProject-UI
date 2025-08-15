import React from "react";

const SearchBar = () => {
  return (
    <input
      type="text"
      placeholder="Tìm kiếm"
      className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
};

export default SearchBar;
