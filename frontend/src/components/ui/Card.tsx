import { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
      bg-card
      rounded-2xl
      p-8
      shadow-2xl
      border border-white/5
      backdrop-blur
    "
    >
      {children}
    </div>
  );
}
