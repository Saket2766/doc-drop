import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel} from "./ui/sidebar";

const WorkingTree = () => {
  return (
    <Sidebar collapsible="offcanvas" >
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>    
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default WorkingTree;
