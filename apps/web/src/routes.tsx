import {
  Suspense,
  lazy,
  type ComponentType,
  createElement
} from "react";
import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./ui/app-shell";
import { HomePage } from "./ui/pages/home-page";
import { LoginPage } from "./ui/pages/login-page";
import { RouteLoadingState } from "./ui/route-loading-state";
import {
  PublicOnlyRoute,
  RequireAdmin,
  RequireStudentPortal
} from "./ui/route-guards";

const ActivitiesPage = lazy(async () => {
  const module = await import("./ui/pages/activities-page");

  return {
    default: module.ActivitiesPage
  };
});
const AdminPage = lazy(async () => {
  const module = await import("./ui/pages/admin-page");

  return {
    default: module.AdminPage
  };
});
const OrderDetailPage = lazy(async () => {
  const module = await import("./ui/pages/order-detail-page");

  return {
    default: module.OrderDetailPage
  };
});
const OrdersPage = lazy(async () => {
  const module = await import("./ui/pages/orders-page");

  return {
    default: module.OrdersPage
  };
});
const ServiceRequestsPage = lazy(async () => {
  const module = await import("./ui/pages/service-requests-page");

  return {
    default: module.ServiceRequestsPage
  };
});
const SpacesPage = lazy(async () => {
  const module = await import("./ui/pages/spaces-page");

  return {
    default: module.SpacesPage
  };
});
const SportsPage = lazy(async () => {
  const module = await import("./ui/pages/sports-page");

  return {
    default: module.SportsPage
  };
});

function renderLazyRoute(Component: ComponentType) {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      {createElement(Component)}
    </Suspense>
  );
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        element: <RequireStudentPortal />,
        children: [
          {
            path: "spaces",
            element: renderLazyRoute(SpacesPage)
          },
          {
            path: "sports",
            element: renderLazyRoute(SportsPage)
          },
          {
            path: "activities",
            element: renderLazyRoute(ActivitiesPage)
          },
          {
            path: "orders",
            element: renderLazyRoute(OrdersPage)
          },
          {
            path: "service-requests",
            element: renderLazyRoute(ServiceRequestsPage)
          },
          {
            path: "orders/:orderId",
            element: renderLazyRoute(OrderDetailPage)
          }
        ]
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: "login",
            element: <LoginPage />
          }
        ]
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            path: "admin",
            element: renderLazyRoute(AdminPage)
          }
        ]
      }
    ]
  }
]);
