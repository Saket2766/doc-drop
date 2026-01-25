import { useState } from "react";
import { useStateStore, type project, type doc } from "@/store/stateStore";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export const CreateProjectDialog = () => {

    const [projectName, setProjectName] = useState<string>("Untitled Project");
    const [projectDescription, setProjectDescription] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);

    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectName(e.target.value);
    }

    const handleProjectDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setProjectDescription(e.target.value);
    }

    const handleCreateProject = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Creating Project");
        const newProject: project = {
            id: Date.now(),
            name: projectName,
            description: projectDescription,
            docs: new Map<number, doc>(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        useStateStore.getState().addProject(newProject);
        console.log(useStateStore.getState());
        setOpen(false);
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <Button>Create Project</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to get started. Click create when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="projectname-1">Project Name</Label>
              <Input id="projectname-1" name="projectname" value={projectName} onChange={handleProjectNameChange} />
            </div> 
            <div className="grid gap-3">
              <Label htmlFor="projectdescription-1">Project Description</Label>
              <Textarea id="projectdescription-1" name="projectdescription" value={projectDescription} onChange={handleProjectDescriptionChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreateProject}>Create Project</Button>
            
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};