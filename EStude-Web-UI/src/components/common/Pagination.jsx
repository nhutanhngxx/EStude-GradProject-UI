import React from "react";
import { useTranslation } from "react-i18next";

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
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-10">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {/* Nút về trang đầu */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label={t("pagination.first")}
          className="px-3 py-1 rounded-lg border transition
                     bg-transparent text-gray-700 dark:text-gray-100
                     border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("pagination.first") || "First"}
        </button>

        {/* Nút trước */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          aria-label={t("pagination.prev")}
          className="px-3 py-1 rounded-lg border transition
                     bg-transparent text-gray-700 dark:text-gray-100
                     border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("pagination.prev")}
        </button>

        {/* Số trang */}
        {pageNumbers.map((page, idx) => {
          if (page === "LEFT_DOTS" || page === "RIGHT_DOTS") {
            return (
              <span
                key={idx}
                className="px-3 py-1 text-gray-500 dark:text-gray-400 select-none"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              aria-label={t("pagination.page", { page })}
              aria-current={page === currentPage ? "page" : undefined}
              className={`px-3 py-1 rounded-lg border transition
                ${
                  page === currentPage
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-transparent text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          );
        })}

        {/* Nút sau */}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          aria-label={t("pagination.next")}
          className="px-3 py-1 rounded-lg border transition
                     bg-transparent text-gray-700 dark:text-gray-100
                     border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("pagination.next")}
        </button>

        {/* Nút về trang cuối */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label={t("pagination.last")}
          className="px-3 py-1 rounded-lg border transition
                     bg-transparent text-gray-700 dark:text-gray-100
                     border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("pagination.last") || "Last"}
        </button>
      </div>

      {/* Hiển thị tổng số phần tử */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        {t("pagination.summary", {
          start: (currentPage - 1) * itemsPerPage + 1,
          end: Math.min(currentPage * itemsPerPage, totalItems),
          total: totalItems,
        })}
      </div>
    </div>
  );
}
