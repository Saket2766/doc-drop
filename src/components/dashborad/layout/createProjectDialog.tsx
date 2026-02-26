import { useState } from "react";
import { useStateStore } from "@/store/stateStore";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/api/client";
import { toast } from "sonner";

export const CreateProjectDialog = ({
  triggerClassName
}: {
  triggerClassName?: string
} = {}) => {
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const createProject = useStateStore((s) => s.createProject);

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleProjectDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectDescription(e.target.value);
  };

  const handleCreateProject = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject(projectName, projectDescription);
      toast.success("Project created");
      setOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <Button className={triggerClassName}>Create Project</Button>
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
            <Button type="button" onClick={handleCreateProject} disabled={loading}>
              {loading ? "Creating…" : "Create Project"}
            </Button>
            
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};