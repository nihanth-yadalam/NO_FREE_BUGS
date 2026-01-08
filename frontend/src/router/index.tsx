import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import TwoFA from "../pages/auth/twoFA";
import Dashboard from "../pages/dashboard/dashboard";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/2fa", element: <TwoFA /> },
  { path: "/dashboard", element: <Dashboard /> },
]);
