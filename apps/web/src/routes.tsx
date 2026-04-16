import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./ui/app-shell";
import { ActivitiesPage } from "./ui/pages/activities-page";
import { AdminPage } from "./ui/pages/admin-page";
import { HomePage } from "./ui/pages/home-page";
import { SpacesPage } from "./ui/pages/spaces-page";
import { SportsPage } from "./ui/pages/sports-page";

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
        path: "admin",
        element: <AdminPage />
      }
    ]
  }
]);
