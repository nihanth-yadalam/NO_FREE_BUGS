import { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card border border-[#1F2937] rounded-2xl p-6 shadow-xl">
      {children}
    </div>
  );
}
