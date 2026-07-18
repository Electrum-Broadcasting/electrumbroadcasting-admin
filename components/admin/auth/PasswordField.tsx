"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>

      <input
        type={visible ? "text" : "password"}
        name="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10"
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-700"
        aria-label="Toggle password visibility"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
