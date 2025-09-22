import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full animate-fadeIn">
        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-3">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white 
                     hover:bg-red-700 transition-colors shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
