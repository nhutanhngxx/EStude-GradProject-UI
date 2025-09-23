import { useContext, useEffect, useState } from "react";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";
import { Sun, Moon, Globe } from "lucide-react";
import i18n from "../../i18n";
import { useTranslation } from "react-i18next";

import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";
import { ThemeContext } from "../../contexts/ThemeContext";

const AdminHeader = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const { i18n: i18next } = useTranslation(); // lấy i18n instance
  const currentLang = i18next.language || "vi"; // luôn đọc từ i18n

  useEffect(() => {
    // const savedTheme = localStorage.getItem("theme");
    const savedLang = localStorage.getItem("language");

    // if (savedTheme === "dark") {
    //   setDarkMode(true);
    //   document.documentElement.classList.add("dark");
    // }
    if (savedLang) {
      i18next.changeLanguage(savedLang);
    }
  }, [i18next]);

  // const toggleDarkMode = () => {
  //   const newMode = !darkMode;
  //   setDarkMode(newMode);
  //   if (newMode) {
  //     document.documentElement.classList.add("dark");
  //     localStorage.setItem("theme", "dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //     localStorage.setItem("theme", "light");
  //   }
  // };

  const toggleLanguage = () => {
    const newLang = currentLang === "vi" ? "en" : "vi";
    i18next.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <header className="flex justify-end items-center bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* <div className="flex items-center">
        <img
          src={darkMode ? bannerDark : bannerLight}
          alt="EStude Banner"
          className="w-[100px] sm:w-[130px]"
        />
      </div> */}

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

export default AdminHeader;
