import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "../../ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { useStateStore, type project, type doc, type docVersion } from "@/store/stateStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder, Document, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CreateProjectDialog } from "./createProjectDialog";
import { NewVersionButton } from "./newVersionButton";

const FileTree = () => {
  const navigate = useNavigate();
  const { projectId, documentId } = useParams<{ projectId?: string; documentId?: string }>();
  const projects = useStateStore((state) => state.projects);
  const currentProject = useStateStore((state) => state.currentProject);
  const { setCurrentProject, setCurrentDoc, setCurrentPath } = useStateStore();
  
  // Track which projects are open using a map for easier management
  const [openProjects, setOpenProjects] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    if (projectId) {
      initial[parseInt(projectId)] = true;
    }
    return initial;
  });

  // Auto-expand current project when route changes
  // This is necessary to sync UI state (collapsible open/closed) with route changes
  useEffect(() => {
    if (projectId) {
      const projId = parseInt(projectId);
      setOpenProjects((prev) => {
        if (prev[projId]) return prev; // Avoid unnecessary update
        return {
          ...prev,
          [projId]: true,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Auto-expand current project from store
  // This is necessary to sync UI state (collapsible open/closed) with store changes
  useEffect(() => {
    if (currentProject) {
      setOpenProjects((prev) => {
        if (prev[currentProject.id]) return prev; // Avoid unnecessary update
        return {
          ...prev,
          [currentProject.id]: true,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject]);

  // Clear currentDoc when documentId param is not present
  useEffect(() => {
    if (!documentId) {
      setCurrentDoc(null);
    }
  }, [documentId, setCurrentDoc]);

  const handleProjectClick = (project: project) => {
    setCurrentProject(project);
    setCurrentPath([
      { label: "Projects", isLink: true, href: "/dashboard" },
      { label: project.name, isLink: false },
    ]);
    navigate(`/dashboard/project/${project.id}`);
  };

  const handleDocumentClick = (project: project, doc: doc) => {
    setCurrentProject(project);
    setCurrentDoc(doc);
    setCurrentPath([
      { label: "Projects", isLink: true, href: "/dashboard" },
      { label: project.name, isLink: true, href: `/dashboard/project/${project.id}` },
      { label: doc.title, isLink: false },
    ]);
    navigate(`/dashboard/project/${project.id}/document/${doc.id}`);
  };

  return (
    <SidebarMenu>
      {Array.from(projects.values()).map((project) => {
        const isOpen = openProjects[project.id] ?? false;
        const isActiveProject = projectId === project.id.toString();
        const docs = Array.from(project.docs.values());

        return (
          <Collapsible
            key={project.id}
            open={isOpen}
            onOpenChange={(open) => {
              setOpenProjects((prev) => ({
                ...prev,
                [project.id]: open,
              }));
            }}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  onClick={() => handleProjectClick(project)}
                  isActive={isActiveProject && !documentId}
                  className="w-full"
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                  <HugeiconsIcon icon={Folder} className="w-4 h-4" />
                  <span className="truncate">{project.name}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {docs.length > 0 && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {docs.map((doc) => {
                      const isActiveDoc =
                        documentId === doc.id.toString() &&
                        projectId === project.id.toString();

                      return (
                        <SidebarMenuSubItem key={doc.id}>
                          <SidebarMenuSubButton
                            onClick={() => handleDocumentClick(project, doc)}
                            isActive={isActiveDoc}
                          >
                            <HugeiconsIcon icon={Document} />
                            <span className="truncate">{doc.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  );
};

const VersionsGroup = () => {
  const currentDoc = useStateStore((state) => state.currentDoc);
  const currentProject = useStateStore((state) => state.currentProject);
  const { switchDocVersion } = useStateStore();

  const handleVersionClick = useCallback((versionNumber: number) => {
    if (currentDoc && currentProject) {
      switchDocVersion(currentProject.id, currentDoc.id, versionNumber);
    }
  }, [currentDoc, currentProject, switchDocVersion]);

  if (!currentDoc) {
    return null;
  }

  // Sort versions in descending order (latest first)
  const sortedVersions = [...(currentDoc.versions || [])].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Versions</SidebarGroupLabel>
      <SidebarMenu>
        {sortedVersions.map((version: docVersion) => {
          const isActive = version.versionNumber === currentDoc.currentVersionNumber;
          return (
            <SidebarMenuItem key={version.id}>
              <SidebarMenuButton
                onClick={() => handleVersionClick(version.versionNumber)}
                isActive={isActive}
                className="w-full"
              >
                <HugeiconsIcon icon={Document} className="w-4 h-4" />
                <span className="truncate">
                  Version {version.versionNumber}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      <div className="px-2 mt-2">
          <NewVersionButton/>
      </div>
    </SidebarGroup>
  );
};

const WorkingTree = () => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <FileTree />
          <div className="mx-auto mt-4">
            <CreateProjectDialog/>
          </div>
        </SidebarGroup>
        <VersionsGroup />
      </SidebarContent>
    </Sidebar>
  );
};

export default WorkingTree;
