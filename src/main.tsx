import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import type { ReactElement } from "react";
import "./index.css";
import App from "./App.tsx";
import Dashboard from "./components/dashborad/dashboard.tsx";
import ProjectView from "./components/dashborad/outlets/projectView.tsx";
import { ItemsView } from "./components/dashborad/outlets/itemsView.tsx";
import { DocumentView } from "./components/dashborad/outlets/documentView.tsx";
import { Toaster } from "./components/ui/sonner";
import { Auth } from "./components/auth/auth.tsx";
import { Home } from "./components/home.tsx";
import AllVersionComment from "./components/dashborad/outlets/AllVersionComment.tsx";
import { ManageProject } from "./components/dashborad/outlets/ManageProject.tsx";
import { setApiTokenGetter, setOnUnauthorized } from "@/api/client";
import { useStateStore } from "./store/stateStore";

// Wire API client to Zustand auth state (token + 401 logout)
setApiTokenGetter(() => useStateStore.getState().user?.token ?? null);
setOnUnauthorized(() => {
  useStateStore.getState().logout();
  window.location.href = "/auth/login";
});

const RedirectRoute = ({ element }: { element: ReactElement }) => {
  const user = useStateStore((s) => s.user);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return element;
};

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route
            path="auth"
            element={
              <RedirectRoute element={<Navigate to="/auth/login" replace />} />
            }
          />
          <Route
            path="auth/:tab"
            element={<RedirectRoute element={<Auth />} />}
          />
        </Route>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<ProjectView />} />
          <Route path="project/manage/:projectId" element={<ManageProject />} />
          <Route path="project/:projectId" element={<ItemsView />} />
          <Route
            path="project/:projectId/document/:documentId"
            element={<DocumentView />}
          />
          <Route
            path="project/:projectId/document/:documentId/comments"
            element={<AllVersionComment />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </>,
);
