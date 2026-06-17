"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
      <div className="bg-slate-900/90 text-white text-sm px-4 py-2 rounded-md shadow-lg">
        {message}
      </div>
    </div>
  );
}
