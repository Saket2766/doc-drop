import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { useStateStore } from "@/store/stateStore";
import { getApiErrorMessage } from "@/api/client";
import { errorToast } from "../../layout/errorToast";
import { toast } from "sonner";
import type { UserResponse } from "@/api/usersApi";
import { Label } from "@/components/ui/label";

function userIdentifier(u: UserResponse): string {
  return u.email?.trim() || u.username?.trim() || "";
}

export function ManageProject() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : NaN;
  const navigate = useNavigate();
  const { projects, user, refreshProject, grantProjectAccess, revokeProjectAccess, searchUsers } =
    useStateStore();

  const project = projectId ? projects.get(projectId) : undefined;
  const currentUserIdentifier = user?.email?.trim() || user?.username?.trim() || "";
  const isCreator = !!project && project.creator === currentUserIdentifier;
  const { setCurrentPath } = useStateStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId || !Number.isFinite(projectId)) return;
    try {
      await refreshProject(projectId);
    } catch (err) {
      errorToast(getApiErrorMessage(err));
    }
  }, [projectId, refreshProject]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (project) {
      setCurrentPath([
        { label: "Projects", isLink: true, href: "/dashboard" },
        { label: project.name, isLink: true, href: `/dashboard/project/${projectId}` },
        { label: "Manage access", isLink: false },
      ]);
    }
  }, [project, projectId, setCurrentPath]);

  const handleBack = () => {
    navigate(`/dashboard/project/${projectId}`);
  };

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      setSearchResults(users);
    } catch (err) {
      errorToast(getApiErrorMessage(err));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchUsers]);

  const handleAddAccess = async (
    identifier: string,
    role: "editor" | "viewer",
  ) => {
    if (!projectId || !identifier) return;
    try {
      await grantProjectAccess(projectId, identifier, role);
      toast.success(`Added as ${role}`);
      setSearchResults((prev) => prev.filter((u) => userIdentifier(u) !== identifier));
    } catch (err) {
      errorToast(getApiErrorMessage(err));
    }
  };

  const handleRevoke = async (identifier: string) => {
    if (!projectId || !identifier) return;
    try {
      await revokeProjectAccess(projectId, identifier);
      toast.success("Access revoked");
    } catch (err) {
      errorToast(getApiErrorMessage(err));
    }
  };

  if (!Number.isFinite(projectId)) {
    return (
      <div className="p-4">
        <p className="text-destructive">Invalid project.</p>
        <Button variant="link" onClick={() => navigate("/dashboard")}>
          Back to projects
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  const editors = project.editorAccessUsers ?? [];
  const viewers = project.viewerAccessUsers ?? [];

  return (
    <div className="w-full mt-8 md:mt-16 p-4 md:p-6 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleBack}
          aria-label="Back to project"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        </Button>
        <h1 className="text-xl font-semibold">Manage access</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Editors</Label>
          <ScrollArea className="h-auto max-h-32 rounded-md border p-4 mt-1">
            <div className="flex flex-wrap gap-2">
              {editors.map((identifier) => (
                <div
                  key={identifier}
                  className="flex items-center gap-1"
                >
                  <Badge variant="secondary">{identifier}</Badge>
                  {isCreator && identifier !== project.creator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(identifier)}
                      aria-label={`Revoke access for ${identifier}`}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {editors.length === 0 && (
                <p className="text-sm text-muted-foreground">No editors yet.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div>
          <Label className="text-sm font-medium">Viewers</Label>
          <ScrollArea className="h-auto max-h-32 rounded-md border p-4 mt-1">
            <div className="flex flex-wrap gap-2">
              {viewers.map((identifier) => (
                <div
                  key={identifier}
                  className="flex items-center gap-1"
                >
                  <Badge variant="outline">{identifier}</Badge>
                  {isCreator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(identifier)}
                      aria-label={`Revoke access for ${identifier}`}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {viewers.length === 0 && (
                <p className="text-sm text-muted-foreground">No viewers yet.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {isCreator && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserAdd01Icon} className="size-5" />
            <Label className="text-sm font-medium">Add user by email or username</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <ScrollArea className="h-auto max-h-48 rounded-md border p-2">
              <ul className="space-y-2">
                {searchResults.map((u) => {
                  const id = userIdentifier(u);
                  const alreadyEditor = editors.includes(id);
                  const alreadyViewer = viewers.includes(id);
                  const isCurrentUser = id === currentUserIdentifier;
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
                    >
                      <span className="text-sm truncate">
                        {u.email || u.username}
                        {u.username && u.email && (
                          <span className="text-muted-foreground ml-1">
                            ({u.username})
                          </span>
                        )}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={alreadyViewer || isCurrentUser}
                          onClick={() => handleAddAccess(id, "viewer")}
                        >
                          Add as viewer
                        </Button>
                        <Button
                          size="sm"
                          disabled={alreadyEditor || isCurrentUser}
                          onClick={() => handleAddAccess(id, "editor")}
                        >
                          Add as editor
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
