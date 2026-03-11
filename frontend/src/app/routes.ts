import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ClaimSubmissionPage from "./pages/ClaimSubmissionPage";
import CredibilityResultPage from "./pages/CredibilityResultPage";
import TrendAnalyticsPage from "./pages/TrendAnalyticsPage";
import TrendingRumoursPage from "./pages/TrendingRumoursPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AnalyzePage from "./pages/AnalyzePage";
import SourcesPage from "./pages/SourcesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
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
  {
    path: "/analyze",
    Component: AnalyzePage,
  },
  {
    path: "/sources",
    Component: SourcesPage,
  },
]);
