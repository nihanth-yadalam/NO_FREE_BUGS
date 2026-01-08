import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-card p-8 shadow-2xl border border-border">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to manage your real liquidity
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="
                w-full rounded-lg
                border border-border
                bg-bg
                px-4 py-3
                text-white
                placeholder-gray-500
                focus:outline-none
                focus:ring-2
                focus:ring-primary
              "
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="
                w-full rounded-lg
                border border-border
                bg-bg
                px-4 py-3
                text-white
                placeholder-gray-500
                focus:outline-none
                focus:ring-2
                focus:ring-primary
              "
            />
          </div>
        </div>

        {/* CTA */}
        <button
          className="
            mt-8 w-full rounded-lg
            bg-primary py-3
            font-semibold text-white
            transition
            hover:brightness-110
            animate-subtle-glow
          "
        >
          Sign In
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
