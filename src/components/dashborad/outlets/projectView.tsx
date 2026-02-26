import { useEffect, useState } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder,
  FolderAddIcon,
  UserAdd01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { useStateStore, type project } from "@/store/stateStore";
import { CreateProjectDialog } from "../layout/createProjectDialog";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";
import { useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import { errorToast } from "../../layout/errorToast";
import { toast } from "sonner";

const EmptyProjectView = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={FolderAddIcon} />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <CreateProjectDialog />
      </EmptyContent>
    </Empty>
  );
};

const ProjectDeleteDialog = ({
  project,
  onConfirm,
}: {
  project: project;
  onConfirm: (projectId: number) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const handleConfirm = async () => {
    try {
      await onConfirm(project.id);
      setOpen(false);
    } catch {
      // Error already shown by onConfirm
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive rounded-full ease-in-out duration-200 hover:text-destructive hover:border  hover:border-destructive"
          aria-label="Delete project"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the project &quot;{project.name}&quot;
            and all its documents. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ProjectsPane = ({ projects }: { projects: Map<number, project> }) => {
  const navigate = useNavigate();
  const { setCurrentProject, setCurrentPath, deleteProject } = useStateStore();

  const handleProjectClick = (projectId: number) => {
    const project = projects.get(projectId);
    if (project) {
      setCurrentProject(project);
      setCurrentPath([
        { label: "Projects", isLink: true, href: "/dashboard" },
        { label: project.name, isLink: false },
      ]);
      navigate(`/dashboard/project/${projectId}`);
    }
  };

  const handleManageAccess = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    const project = projects.get(projectId);
    if (project) {
      setCurrentProject(project);
      setCurrentPath([
        { label: "Projects", isLink: true, href: "/dashboard" },
        {
          label: project.name,
          isLink: true,
          href: `/dashboard/project/${projectId}`,
        },
        { label: "Manage access", isLink: false },
      ]);
      navigate(`/dashboard/project/manage/${projectId}`);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
      navigate("/dashboard");
    } catch (err) {
      errorToast(getApiErrorMessage(err));
    }
  };

  return (
    <div className="w-full p-0 md:p-4 flex flex-wrap gap-4">
      {Array.from(projects.values()).map((project) => (
        <Card
          className="cursor-pointer h-fit min-w-40 w-1/6 max-w-2xs hover:bg-gray-100"
          key={project.id}
          onClick={() => handleProjectClick(project.id)}
        >
          <CardHeader>
            <CardAction>
              <HugeiconsIcon icon={Folder} />
            </CardAction>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              <p className="my-2 md:my-4 line-clamp-2 md:line-clamp-3 text-sm">
                {project.description}
              </p>
              <div className="hidden md:block text-[10px] leading-tight text-muted-foreground">
                <p>Created: {project.createdAt.toLocaleDateString()}</p>
                <p>Updated: {project.updatedAt.toLocaleDateString()}</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardFooter
            className="gap-2 flex justify-end py-2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full ease-in-out duration-200 hover:border hover:border-green-400"
              onClick={(e) => handleManageAccess(e, project.id)}
              aria-label="Manage user access"
            >
              <HugeiconsIcon icon={UserAdd01Icon} className="size-4" />
            </Button>
            <ProjectDeleteDialog
              project={project}
              onConfirm={handleDeleteProject}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const ProjectView = () => {
  const projects = useStateStore<Map<number, project>>(
    (state) => state.projects,
  );
  const { setCurrentPath } = useStateStore();

  // Update path when component mounts
  useEffect(() => {
    setCurrentPath([{ label: "Projects", isLink: false }]);
  }, [setCurrentPath]);

  return (
    <div className="w-full p-8 md:p-4 flex justify-center items-stretch relative">
      {projects.size === 0 ? (
        <EmptyProjectView />
      ) : (
        <ProjectsPane projects={projects} />
      )}
      {projects.size > 0 && (
        <div className="absolute bottom-0 left-[50%] translate-x-[-50%] flex flex-col gap-2 justify-center items-center pb-8">
          <CreateProjectDialog triggerClassName="p-4" />
        </div>
      )}
    </div>
  );
};

export default ProjectView;
