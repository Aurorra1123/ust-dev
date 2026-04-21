import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./ui/app-shell";
import { ActivitiesPage } from "./ui/pages/activities-page";
import { AdminPage } from "./ui/pages/admin-page";
import { HomePage } from "./ui/pages/home-page";
import { LoginPage } from "./ui/pages/login-page";
import { OrderDetailPage } from "./ui/pages/order-detail-page";
import { OrdersPage } from "./ui/pages/orders-page";
import { ServiceRequestsPage } from "./ui/pages/service-requests-page";
import { SpacesPage } from "./ui/pages/spaces-page";
import { SportsPage } from "./ui/pages/sports-page";
import {
  PublicOnlyRoute,
  RequireAdmin,
  RequireStudentPortal
} from "./ui/route-guards";

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
            element: <SpacesPage />
          },
          {
            path: "sports",
            element: <SportsPage />
          },
          {
            path: "activities",
            element: <ActivitiesPage />
          },
          {
            path: "orders",
            element: <OrdersPage />
          },
          {
            path: "service-requests",
            element: <ServiceRequestsPage />
          },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />
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
            element: <AdminPage />
          }
        ]
      }
    ]
  }
]);
