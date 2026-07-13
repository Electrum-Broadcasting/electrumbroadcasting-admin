"use client";

import React from "react";

export type ColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="color"
        className="mt-1 h-10 w-20 cursor-pointer rounded border border-slate-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
};

export function SelectInput({
  label,
  value,
  onChange,
  options,
}: SelectInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TextInput({ label, value, onChange }: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
