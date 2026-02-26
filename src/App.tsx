import { Outlet } from "react-router";
import { Navbar } from "./components/layout/navbar";

export function App() {
  return (
    <div className="min-h-svh flex flex-col py-6 bg-sky-50">
      <Navbar />
      <Outlet />
      
    </div>
  );
}

export default App;
