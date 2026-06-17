"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";

export function ToastTrigger({ message }: { message: string }) {
  const showToast = useToast();

  useEffect(() => {
  console.log("ToastTrigger fired with:", message);
  if (message) showToast(message);
}, [message, showToast]);


  return null;
}
