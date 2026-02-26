import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import UploadButton from "@rpldy/upload-button";
import UploadDropZone from "@rpldy/upload-drop-zone";
import { useBatchAddListener } from "@rpldy/uploady";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { useStateStore, type doc, type DocTag } from "@/store/stateStore";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/types";
import {
  formatFileSize,
  getFileTypeName,
} from "@/lib/utils";
import { getApiErrorMessage } from "@/api/client";
import { errorToast } from "../../layout/errorToast";
import { FileTypeIcon } from "../../layout/fileTypeIcon";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Document,
  StarIcon,
  Delete02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const TAG_COLORS: Record<DocTag, string> = {
  red: "bg-red-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};

// Document card with preview capability and footer actions
const DocumentListItem = ({
  document,
  projectId,
  onPreview,
}: {
  document: doc;
  projectId: number;
  onPreview: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toggleDocFavorite, setDocTag, deleteDocFromProject } =
    useStateStore();

  const handleSetTag = (e: React.MouseEvent, tag: DocTag | null) => {
    e.stopPropagation();
    if (isDeleting) return;
    setDocTag(projectId, document.id, tag);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteDocFromProject(projectId, document.id);
      toast.success("Document deleted");
    } catch (err) {
      errorToast(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      size="sm"
      className={cn(
        "h-fit min-w-44 md:min-w-50 md:w-1/6 transition-colors",
        isDeleting
          ? "cursor-progress opacity-70"
          : "cursor-pointer hover:bg-gray-50",
      )}
      onClick={() => {
        if (isDeleting) return;
        onPreview();
      }}
    >
      <CardHeader className="flex-row items-center gap-3">
        <FileTypeIcon type={document.documentType} />
        <CardTitle className="truncate text-xs md:text-sm">
          {document.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {getFileTypeName(document.documentType)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(document.fileSize)}
        </p>
      </CardContent>
      <CardFooter className="gap-1" onClick={(e) => e.stopPropagation()}>
        <Toggle
          size="sm"
          pressed={document.isFavorite}
          disabled={isDeleting}
          onPressedChange={() => toggleDocFavorite(projectId, document.id)}
          aria-label="Toggle favorite"
          className="h-8 w-8 p-0"
        >
          <HugeiconsIcon
            icon={StarIcon}
            className={cn(
              "size-4",
              document.isFavorite && "fill-amber-400 text-amber-500",
            )}
          />
        </Toggle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
            >
              <HugeiconsIcon icon={Tag01Icon} className="size-4" />
              {document.tag && (
                <span
                  className={cn(
                    "absolute bottom-0.5 right-0.5 size-2 rounded-full ring-1 ring-background",
                    TAG_COLORS[document.tag],
                  )}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => handleSetTag(e, "red")}
              className="flex items-center gap-2"
            >
              <span className="size-3 rounded-full bg-red-500" />
              Red
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleSetTag(e, "green")}
              className="flex items-center gap-2"
            >
              <span className="size-3 rounded-full bg-green-500" />
              Green
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleSetTag(e, "yellow")}
              className="flex items-center gap-2"
            >
              <span className="size-3 rounded-full bg-yellow-500" />
              Yellow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleSetTag(e, null)}
              className="text-muted-foreground"
            >
              Remove tag
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          aria-label={isDeleting ? "Deleting document" : "Delete document"}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Spinner className="size-4 text-destructive" />
          ) : (
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

const ItemViewEmpty = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Document} />
        </EmptyMedia>
        <EmptyTitle>No Documents Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t uploaded any documents yet. Get started by uploading
          your first document.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

// Filter bar with toggles for favorites and tag colors; renders filtered DocumentListItems
const FilteredItemsList = ({
  documents,
  projectId,
  onPreview,
}: {
  documents: doc[];
  projectId: number;
  onPreview: (doc: doc) => void;
}) => {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterRed, setFilterRed] = useState(false);
  const [filterGreen, setFilterGreen] = useState(false);
  const [filterYellow, setFilterYellow] = useState(false);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchFavorites = !filterFavorites || doc.isFavorite;
      const anyTagFilter = filterRed || filterGreen || filterYellow;
      const matchTag =
        !anyTagFilter ||
        (filterRed && doc.tag === "red") ||
        (filterGreen && doc.tag === "green") ||
        (filterYellow && doc.tag === "yellow");
      return matchFavorites && matchTag;
    });
  }, [documents, filterFavorites, filterRed, filterGreen, filterYellow]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          Filters:
        </span>
        <Toggle
          size="sm"
          pressed={filterFavorites}
          onPressedChange={setFilterFavorites}
          aria-label="Filter by favorites"
        >
          <HugeiconsIcon
            icon={StarIcon}
            className="size-4 group-data-[state=on]/toggle:fill-amber-400"
          />
          Favorites
        </Toggle>
        <Toggle
          size="sm"
          pressed={filterRed}
          onPressedChange={setFilterRed}
          aria-label="Filter by red tag"
          className={cn(
            filterRed &&
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          )}
        >
          <span className="size-2.5 rounded-full bg-red-500 mr-1.5" />
          Red
        </Toggle>
        <Toggle
          size="sm"
          pressed={filterGreen}
          onPressedChange={setFilterGreen}
          aria-label="Filter by green tag"
          className={cn(
            filterGreen &&
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          )}
        >
          <span className="size-2.5 rounded-full bg-green-500 mr-1.5" />
          Green
        </Toggle>
        <Toggle
          size="sm"
          pressed={filterYellow}
          onPressedChange={setFilterYellow}
          aria-label="Filter by yellow tag"
          className={cn(
            filterYellow &&
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          )}
        >
          <span className="size-2.5 rounded-full bg-yellow-500 mr-1.5" />
          Yellow
        </Toggle>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {filteredDocuments.map((doc) => (
          <DocumentListItem
            key={doc.id}
            document={doc}
            projectId={projectId}
            onPreview={() => onPreview(doc)}
          />
        ))}
      </div>
    </div>
  );
};

const ItemsList = () => {
  const { currentProject, setCurrentPath } = useStateStore();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Upload files to API, then add to project only on success
  useBatchAddListener((batch) => {
    if (currentProject) {
      (async () => {
        for (const item of batch.items) {
          if (!item.file) continue;
          const file = item.file as unknown as File;
          if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            errorToast("File size must be 100 MB or less.");
            continue;
          }
          try {
            await useStateStore
              .getState()
              .uploadDocToProject(currentProject.id, file);
          } catch (err) {
            errorToast(getApiErrorMessage(err));
          }
        }
      })();
    }
  });

  const handlePreview = useCallback(
    (doc: doc) => {
      if (!projectId || !currentProject) return;

      // Update path and navigate
      setCurrentPath([
        { label: "Projects", isLink: true, href: "/dashboard" },
        {
          label: currentProject.name,
          isLink: true,
          href: `/dashboard/project/${projectId}`,
        },
        { label: doc.title, isLink: false },
      ]);
      navigate(`/dashboard/project/${projectId}/document/${doc.id}`);
    },
    [navigate, projectId, currentProject, setCurrentPath],
  );

  // Get documents from currentProject
  const documents = currentProject
    ? Array.from(currentProject.docs.values())
    : [];

  return (
    <div className="w-full flex">
      {documents.length > 0 ? (
        <FilteredItemsList
          documents={documents}
          projectId={currentProject!.id}
          onPreview={handlePreview}
        />
      ) : (
        <div className="w-full flex justify-center items-center">
          <ItemViewEmpty />
        </div>
      )}
    </div>
  );
};

export const ItemsView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    setCurrentPath,
    setCurrentProject,
    loadProjectDocuments,
    projects,
  } = useStateStore();
  const currentProjectId = currentProject?.id;
  const uploadInProgressCount = useStateStore(
    (s) => s.uploadInProgressCount,
  );
  const isUploading = uploadInProgressCount > 0;

  // Sync currentProject from store when URL has projectId (e.g. after refresh)
  const pid = projectId ? parseInt(projectId, 10) : NaN;
  useEffect(() => {
    if (!Number.isFinite(pid)) return;
    const project = projects.get(pid);
    if (project && (!currentProject || currentProject.id !== pid)) {
      setCurrentProject(project);
    }
  }, [pid, projects, currentProject, setCurrentProject]);

  // Update path when component mounts or project changes
  useEffect(() => {
    if (currentProject && projectId) {
      setCurrentPath([
        { label: "Projects", isLink: true, href: "/dashboard" },
        { label: currentProject.name, isLink: false },
      ]);
    }
  }, [currentProject, projectId, setCurrentPath]);

  // Load documents for the current project when navigating to this view
  useEffect(() => {
    if (!Number.isFinite(pid) || currentProjectId !== pid) return;
    loadProjectDocuments(pid);
  }, [pid, currentProjectId, loadProjectDocuments]);

  // Only render if there's a current project
  if (!currentProject) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <p>No project selected</p>
      </div>
    );
  }

  return (
    <div className="w-full flex p-4 md:p-8 relative">
      <UploadDropZone
        className={cn("w-full flex", isUploading && "pointer-events-none opacity-60")}
      >
        <ItemsList />
      </UploadDropZone>
      <div className="absolute bottom-4 left-[50%] translate-x-[-50%] flex flex-col gap-2 justify-center items-center">
        <UploadButton
          extraProps={{ disabled: isUploading }}
          className="p-2 bg-blue-700 hover:bg-blue-900 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-28"
        >
          {isUploading ? (
            <>
              <Spinner className="size-4 text-white" />
              Uploading…
            </>
          ) : (
            "Upload Files"
          )}
        </UploadButton>

        <div className="flex flex-col gap-1 justify-center items-center">
          <p className="text-xs text-center md:text-sm text-muted-foreground">
            Drag and drop files here or click to upload
          </p>
          <p className="hidden md:block text-xs text-center md:text-sm text-muted-foreground">
            Supported files: PDF, DOC, XLS, PPT, IMG, MP4
          </p>
        </div>
      </div>
    </div>
  );
};
