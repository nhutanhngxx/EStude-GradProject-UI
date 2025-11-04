import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Component hiển thị trend indicator
 * @param {string} trend - "IMPROVING", "STABLE", "DECLINING"
 * @param {string} className - Additional CSS classes
 */
const TrendIndicator = ({ trend, className = "" }) => {
  const trendConfig = {
    IMPROVING: {
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Đang cải thiện",
    },
    STABLE: {
      icon: Minus,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: "Ổn định",
    },
    DECLINING: {
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: "Đang giảm",
    },
  };

  const config = trendConfig[trend] || trendConfig.STABLE;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default TrendIndicator;
