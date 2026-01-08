import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg";

  const variants = {
    primary:
      "bg-indigo-500 hover:bg-indigo-400 text-white focus:ring-indigo-400",
    secondary:
      "bg-card border border-border hover:bg-[#1F2937] text-gray-200",
    danger:
      "bg-red-500 hover:bg-red-400 text-white focus:ring-red-400",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
