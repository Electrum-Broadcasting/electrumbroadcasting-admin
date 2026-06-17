"use client";

import { ToastTrigger } from "./ToastTrigger";

export function ToastBoundary({
  toast,
  children,
}: {
  toast?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {toast && <ToastTrigger message={toast} />}
      {children}
    </>
  );
}
