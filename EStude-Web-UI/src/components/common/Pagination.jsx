import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  siblingCount = 1,
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => i + start);

  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPages <= totalPageNumbers) return range(1, totalPages);

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    const pages = [];
    pages.push(1);

    if (showLeftDots) pages.push("LEFT_DOTS");

    const middlePages = range(
      Math.max(2, leftSiblingIndex),
      Math.min(totalPages - 1, rightSiblingIndex)
    );
    pages.push(...middlePages);

    if (showRightDots) pages.push("RIGHT_DOTS");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg z-40">
      <div className="flex flex-col gap-2 items-center justify-center">
        {/* Thông tin trang */}
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {t("pagination.summary", {
            start: (currentPage - 1) * itemsPerPage + 1,
            end: Math.min(currentPage * itemsPerPage, totalItems),
            total: totalItems,
          })}
        </div>

        {/* Điều hướng trang */}
        <div className="flex gap-1 items-center justify-center flex-wrap">
          {/* Nút về trang đầu */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title={t("pagination.first")}
            className="p-1 rounded-md border transition
                       bg-transparent text-gray-600 dark:text-gray-400
                       border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Nút trước */}
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            title={t("pagination.prev")}
            className="p-1 rounded-md border transition
                       bg-transparent text-gray-600 dark:text-gray-400
                       border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Số trang */}
          <div className="flex gap-0.5">
            {pageNumbers.map((page, idx) => {
              if (page === "LEFT_DOTS" || page === "RIGHT_DOTS") {
                return (
                  <span
                    key={idx}
                    className="px-1 text-gray-400 dark:text-gray-600 select-none text-xs"
                  >
                    •••
                  </span>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => onPageChange(page)}
                  disabled={page === currentPage}
                  title={`${t("pagination.page", { page })} ${page}`}
                  className={`w-7 h-7 rounded-md border transition text-xs font-medium
                    ${
                      page === currentPage
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                        : "bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Nút sau */}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            title={t("pagination.next")}
            className="p-1 rounded-md border transition
                       bg-transparent text-gray-600 dark:text-gray-400
                       border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Nút về trang cuối */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title={t("pagination.last")}
            className="p-1 rounded-md border transition
                       bg-transparent text-gray-600 dark:text-gray-400
                       border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
