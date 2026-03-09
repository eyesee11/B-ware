import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import ClaimSubmissionPage from "./pages/ClaimSubmissionPage";
import CredibilityResultPage from "./pages/CredibilityResultPage";
import TrendAnalyticsPage from "./pages/TrendAnalyticsPage";
import TrendingRumoursPage from "./pages/TrendingRumoursPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/verify",
    Component: ClaimSubmissionPage,
  },
  {
    path: "/result/:id",
    Component: CredibilityResultPage,
  },
  {
    path: "/analytics",
    Component: TrendAnalyticsPage,
  },
  {
    path: "/trending",
    Component: TrendingRumoursPage,
  },
  {
    path: "/admin",
    Component: AdminDashboardPage,
  },
]);
