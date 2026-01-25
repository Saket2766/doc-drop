import { ItemsView } from "./itemsView";
import { PathBar } from "./pathbar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import WorkingTree from "./workingTree";

const Dashboard = () => {
  return (
    <SidebarProvider>
        <WorkingTree />
        <main className="w-full h-full min-h-[80vh]">
        <h3 className=" w-full text-center pt-8 pb-4 scroll-m-20 text-2xl text-blue-500 font-extrabold tracking-tight">
            DocDrop
        </h3>
        <div className="w-full px-4 py-2 space-x-8 flex items-center border-t border-gray-200">
            <SidebarTrigger />
            <PathBar />
        </div>
            <ItemsView />
        </main>
    </SidebarProvider>
  );
};

export default Dashboard;
