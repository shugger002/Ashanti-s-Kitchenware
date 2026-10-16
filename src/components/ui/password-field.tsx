"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: string;
};

export function PasswordField({ label, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className="input pr-16"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 text-sm text-muted"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((open) => !open)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
