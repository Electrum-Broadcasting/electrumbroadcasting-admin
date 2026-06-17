import { ToastProvider } from "@/components/ui/ToastProvider";
import "@/app/globals.css"; // ensure global styles load

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

