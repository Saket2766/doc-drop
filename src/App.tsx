import { Outlet } from "react-router";
import { Navbar } from "./components/navbar";

export function App() {
  return (
    <>
      <Navbar />
      <Outlet/>   
    </>
  );
}

export default App;
