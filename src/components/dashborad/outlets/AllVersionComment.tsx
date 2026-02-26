import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardHeader, CardContent } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { useStateStore, type comment } from "@/store/stateStore";

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(date).getTime()) / 1000,
  );

  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return `${Math.floor(diffInSeconds / 604800)}w`;
}

// Get initials from author name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Format full date
function formatFullDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CommentItemProps {
  comment: comment;
  replies: comment[];
}

function CommentItem({ comment, replies }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="mb-4">
      {/* Main Comment */}
      <div className="flex gap-2 sm:gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`}
          />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="font-semibold">{comment.author}</span>{" "}
            <span className="text-muted-foreground break-all">
              {comment.message}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span title={formatFullDate(comment.createdAt)}>
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.page && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                Page {comment.page}
              </Badge>
            )}
            {comment.resolved && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-600"
              >
                Resolved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Replies Toggle */}
      {replies.length > 0 && (
        <div className="ml-9 sm:ml-11 mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="w-6 h-px bg-muted-foreground/50" />
            {showReplies
              ? "Hide replies"
              : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
          </button>

          {/* Replies List */}
          {showReplies && (
            <div className="mt-3 space-y-3">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-2 sm:gap-3">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author}`}
                    />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(reply.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{reply.author}</span>{" "}
                      {reply.replytoUserId && (
                        <span className="text-blue-500">
                          @{reply.replytoUserId}
                        </span>
                      )}{" "}
                      <span className="text-muted-foreground break-all">
                        {reply.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span title={formatFullDate(reply.createdAt)}>
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface VersionCommentsGroupProps {
  versionNumber: number;
  comments: comment[];
  isCurrentVersion: boolean;
  uploadedAt?: Date;
}

function VersionCommentsGroup({
  versionNumber,
  comments,
  isCurrentVersion,
  uploadedAt,
}: VersionCommentsGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Organize comments into threads
  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel: comment[] = [];
    const replies: Record<string, comment[]> = {};

    comments.forEach((c) => {
      if (c.parentCommentId) {
        if (!replies[c.parentCommentId]) {
          replies[c.parentCommentId] = [];
        }
        replies[c.parentCommentId].push(c);
      } else {
        topLevel.push(c);
      }
    });

    // Sort by date (oldest first)
    topLevel.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    Object.values(replies).forEach((replyList) => {
      replyList.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    return { topLevelComments: topLevel, repliesByParent: replies };
  }, [comments]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger asChild>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant={isCurrentVersion ? "default" : "secondary"}>
              v{versionNumber}
            </Badge>
            <span className="text-sm font-medium">
              {topLevelComments.length}{" "}
              {topLevelComments.length === 1 ? "comment" : "comments"}
            </span>
            {isCurrentVersion && (
              <Badge
                variant="outline"
                className="text-[10px] text-green-600 border-green-600"
              >
                Current
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {uploadedAt && (
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                {formatFullDate(uploadedAt)}
              </span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 px-2">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No comments for this version</p>
          </div>
        ) : (
          topLevelComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesByParent[c.id] || []}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

const AllVersionComment = () => {
  const { projectId, documentId } = useParams();
  const navigate = useNavigate();
  const { projects, loadCommentsForDocument } = useStateStore();

  // Get the document from the store
  const document = useMemo(() => {
    if (!projectId || !documentId) return null;
    const project = projects.get(Number(projectId));
    if (!project) return null;
    return project.docs.get(Number(documentId)) || null;
  }, [projectId, documentId, projects]);

  // Load comments when this page is opened so we have up-to-date data
  useEffect(() => {
    if (document?.id != null && document?.projectId != null) {
      loadCommentsForDocument(document.projectId, document.id);
    }
  }, [document?.id, document?.projectId, loadCommentsForDocument]);

  // Group comments by version
  const commentsByVersion = useMemo(() => {
    if (!document) return new Map<number, comment[]>();

    const grouped = new Map<number, comment[]>();

    // Initialize all versions with empty arrays
    document.versions.forEach((version) => {
      grouped.set(version.versionNumber, []);
    });

    // Group comments by version
    document.comments.forEach((comment) => {
      const version = comment.version ?? 1;
      if (!grouped.has(version)) {
        grouped.set(version, []);
      }
      grouped.get(version)!.push(comment);
    });

    return grouped;
  }, [document]);

  // Get sorted version numbers (descending - newest first)
  const sortedVersions = useMemo(() => {
    return Array.from(commentsByVersion.keys()).sort((a, b) => b - a);
  }, [commentsByVersion]);

  // Calculate total comments
  const totalComments = useMemo(() => {
    return document?.comments.filter((c) => !c.parentCommentId).length || 0;
  }, [document]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 text-muted-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <p className="text-lg text-muted-foreground">Document not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background w-full max-w-5xl mx-auto mt-8 px-4 sm:px-6">
      {/* Header */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
          <div className="flex items-start gap-3 sm:items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-semibold">
                {document.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                All version comments
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {totalComments} {totalComments === 1 ? "comment" : "comments"}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {document.versions.length}{" "}
              {document.versions.length === 1 ? "version" : "versions"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden w-full">
        <Tabs defaultValue="grouped" className="h-full flex flex-col">
          <div className="shrink-0 px-4 pt-4 ">
            <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-2">
              <TabsTrigger value="grouped">By Version</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </div>

          {/* Grouped by Version View */}
          <TabsContent value="grouped" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {sortedVersions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 text-muted-foreground mb-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                        />
                      </svg>
                      <p className="text-muted-foreground">No comments yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comments will appear here when added to the document
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sortedVersions.map((versionNumber) => {
                    const version = document.versions.find(
                      (v) => v.versionNumber === versionNumber,
                    );
                    return (
                      <VersionCommentsGroup
                        key={versionNumber}
                        versionNumber={versionNumber}
                        comments={commentsByVersion.get(versionNumber) || []}
                        isCurrentVersion={
                          versionNumber === document.currentVersionNumber
                        }
                        uploadedAt={version?.uploadedAt}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {document.comments.filter((c) => !c.parentCommentId).length ===
                0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 text-muted-foreground mb-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                        />
                      </svg>
                      <p className="text-muted-foreground">No comments yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="py-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        All comments sorted by date (newest first)
                      </span>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      {[...document.comments]
                        .filter((c) => !c.parentCommentId)
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((comment) => {
                          const replies = document.comments.filter(
                            (c) => c.parentCommentId === comment.id,
                          );
                          return (
                            <div key={comment.id} className="mb-4">
                              <div className="flex gap-2 sm:gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(comment.author)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm">
                                    <span className="font-semibold">
                                      {comment.author}
                                    </span>{" "}
                                    <span className="text-muted-foreground break-all">
                                      {comment.message}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                    <span
                                      title={formatFullDate(comment.createdAt)}
                                    >
                                      {formatRelativeTime(comment.createdAt)}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 h-4"
                                    >
                                      v{comment.version ?? 1}
                                    </Badge>
                                    {comment.page && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4"
                                      >
                                        Page {comment.page}
                                      </Badge>
                                    )}
                                    {replies.length > 0 && (
                                      <span className="text-muted-foreground">
                                        {replies.length}{" "}
                                        {replies.length === 1
                                          ? "reply"
                                          : "replies"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {replies.length > 0 && (
                                <div className="ml-9 sm:ml-11 mt-2 pl-3 border-l-2 border-muted space-y-2">
                                  {replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className="flex gap-2 text-sm"
                                    >
                                      <Avatar className="h-5 w-5 shrink-0">
                                        <AvatarImage
                                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author}`}
                                        />
                                        <AvatarFallback className="text-[8px]">
                                          {getInitials(reply.author)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <span className="font-medium">
                                          {reply.author}
                                        </span>{" "}
                                        <span className="text-muted-foreground">
                                          {reply.message}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AllVersionComment;
