import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter,Routes,Route, Navigate } from "react-router";
import "./index.css"
import App from "./App.tsx"
import Dashboard from "./components/dashboard.tsx";
import ProjectView from "./components/projectView.tsx";
import { ItemsView } from "./components/itemsView.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" />}/>
        </Route>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<ProjectView />}/>
          <Route path="project/:projectId" element={<ItemsView />}/>
        </Route>     
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
