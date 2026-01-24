import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter,Routes,Route } from "react-router";
import "./index.css"
import App from "./App.tsx"
import { Navbar } from "./components/navbar.tsx";
import Dashboard from "./components/dashboard.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />}/>     
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
