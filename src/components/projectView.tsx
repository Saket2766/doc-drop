import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { HugeiconsIcon } from "@hugeicons/react";
import { Folder, FolderAddIcon } from "@hugeicons/core-free-icons";
import { useStateStore, type project } from "@/store/stateStore";
import { CreateProjectDialog } from "./createProjectDialog";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useNavigate } from "react-router";

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

const ProjectsPane = ({projects}: {projects: Map<number, project>}) => {
    const navigate = useNavigate();

    const handleProjectClick = (projectId: number) => {
        useStateStore.getState().setCurrentProject(projects.get(projectId)!);
        navigate(`/dashboard/project/${projectId}`);
    }
  return (
    <div className="w-full h-full min-h-[80vh] p-4 flex flex-wrap gap-4">
      {Array.from(projects.values()).map((project) => (
        <Card className="cursor-pointer h-fit min-w-40 w-1/6 max-w-2xs hover:bg-gray-100" key={project.id} onClick={() => handleProjectClick(project.id)}>
          <CardHeader>
            <HugeiconsIcon icon={Folder}/>
            <div>
                <CardTitle>
                {project.name}
                </CardTitle>
                <CardDescription>
                    {project.description}
                    <p className="text-xs text-slate-300">Created: {project.createdAt.toLocaleDateString()}</p>
                    <p className="text-xs text-slate-300">Updated: {project.updatedAt.toLocaleDateString()}</p>
                </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

const ProjectView = () => {
  const projects = useStateStore<Map<number, project>>(
    (state) => state.projects,
  );
  return (
    <div className="w-full h-full min-h-[80vh] p-4 flex justify-center items-center">
      {projects.size === 0 ? <EmptyProjectView /> : <ProjectsPane projects={projects} />}
    </div>
  );
};

export default ProjectView;
