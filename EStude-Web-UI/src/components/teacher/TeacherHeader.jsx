import React, { useContext, useEffect, useState } from "react";
import SearchBar from "../common/SearchBar";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";
import { Sun, Moon, Globe } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

const TeacherHeader = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "vi");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      setCurrentLang(savedLang);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = currentLang === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    setCurrentLang(newLang); // cập nhật state để re-render
  };

  return (
    <header className="flex justify-end items-center bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center w-8 h-8 rounded-lg border bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Toggle Language */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-1 w-8 sm:w-auto h-8 px-2 rounded-lg border bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline uppercase">{currentLang}</span>
        </button>

        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};

export default TeacherHeader;
