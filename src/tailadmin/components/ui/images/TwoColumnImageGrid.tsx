import React from "react";

const placeholders = [
  {
    title: "Marketing Hero",
    description: "Wide format banner",
  },
  {
    title: "Product Detail",
    description: "Feature highlight",
  },
];

export default function TwoColumnImageGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {placeholders.map((item) => (
        <div
          key={item.title}
          className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-center text-gray-500 dark:border-gray-700 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
        >
          <span className="text-sm font-semibold uppercase tracking-wide">
            {item.title}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {item.description}
          </span>
        </div>
      ))}
    </div>
  );
}
