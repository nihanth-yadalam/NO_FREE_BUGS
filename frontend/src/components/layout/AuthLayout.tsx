import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-cyan-400/10 pointer-events-none" />

      {/* Auth Card Wrapper */}
      <div
        className="
          relative
          w-full
          max-w-md
          animate-fade-in
        "
      >
        {children}
      </div>
    </div>
  );
}
