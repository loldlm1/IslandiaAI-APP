import React from "react";

export default function ResponsiveImage() {
  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-center text-gray-500 dark:border-gray-700 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <span className="text-sm font-semibold uppercase tracking-wide">
            Image Placeholder
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Add your own responsive asset
          </span>
        </div>
      </div>
    </div>
  );
}
