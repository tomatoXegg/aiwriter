import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("../pages/dashboard/Dashboard"),
  },
  {
    path: "/dashboard",
    lazy: () => import("../pages/dashboard/Dashboard"),
  },
  {
    path: "/accounts",
    lazy: () => import("../pages/accounts/Accounts"),
  },
  {
    path: "/materials",
    lazy: () => import("../pages/materials/Materials"),
  },
  {
    path: "/content",
    lazy: () => import("../pages/content/Content"),
  },
  {
    path: "/topics",
    lazy: () => import("../pages/topics/Topics"),
  },
]);

export default router;