import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import Uploady from "@rpldy/uploady";
import { PathBar } from "./layout/pathbar";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import WorkingTree from "./layout/workingTree";
import { Outlet } from "react-router";
import { AppLogoSmall } from "../layout/appLogo";
import { NewVersionUploadHandler } from "./layout/newVersionUploadHandler";
import { useStateStore } from "@/store/stateStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useStateStore((s) => s.user);
  const loadProjects = useStateStore((s) => s.loadProjects);

  useEffect(() => {
    if (user == null) {
      navigate("/auth/login", { replace: true });
      return;
    }
    loadProjects().catch(() => {});
  }, [user, loadProjects, navigate]);

  return (
    <Uploady
      debug
      destination={{ url: "https://your-upload-endpoint.com" }}
      autoUpload={false}
    >
      <NewVersionUploadHandler />
      <SidebarProvider>
        <WorkingTree />
        <main className="w-full h-full min-h-svh flex flex-col">
          <div className="w-full px-4 py-2 space-x-8 flex flex-col gap-4 md:gap-0 md:flex-row flex-wrap items-center border-y border-gray-200">
            <div className="flex space-x-8 w-fit">
              <SidebarTrigger />
              <Link to="/"><AppLogoSmall /></Link>
            </div>
            <PathBar />
          </div>
          <div className="w-full grow flex">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </Uploady>
  );
};

export default Dashboard;
