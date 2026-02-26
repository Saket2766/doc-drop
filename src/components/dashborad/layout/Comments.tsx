import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { ScrollArea } from "../../ui/scroll-area";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  useStateStore,
  type doc,
  type comment,
  type CommentFilterMode,
} from "@/store/stateStore";

interface CommentsProps {
  document: doc;
  currentPage?: number;
  totalPages?: number;
  onClose?: () => void;
}

// Helper to format relative time like Instagram
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

// Skeleton component for loading comments
function CommentSkeleton() {
  return (
    <div className="mb-4">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: comment;
  replies: comment[];
  onReply: (commentId: string, authorId: string) => void;
  isNewestVersion: boolean;
  showPageBadge?: boolean;
}

function CommentItem({
  comment,
  replies,
  onReply,
  isNewestVersion,
  showPageBadge = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="mb-4">
      {/* Main Comment */}
      <div className="flex gap-3">
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
            <span
              className="text-muted-foreground warp-break-words break-all whitespace-pre-wrap
"
            >
              {comment.message}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            {showPageBadge && comment.page && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                Page {comment.page}
              </Badge>
            )}
            {isNewestVersion && (
              <button
                onClick={() => onReply(comment.id, comment.author)}
                className="font-semibold hover:text-foreground transition-colors"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies Toggle */}
      {replies.length > 0 && (
        <div className="ml-11 mt-2">
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
                <div key={reply.id} className="flex gap-3">
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
                      <span className="text-muted-foreground warp-break-words break-all whitespace-pre-wrap">
                        {reply.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(reply.createdAt)}</span>
                      {isNewestVersion && (
                        <button
                          onClick={() => onReply(comment.id, reply.author)}
                          className="font-semibold hover:text-foreground transition-colors"
                        >
                          Reply
                        </button>
                      )}
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

export const Comments = ({
  document: initialDocument,
  currentPage = 1,
  totalPages = 1,
  onClose,
}: CommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorId: string;
  } | null>(null);
  const {
    addComment,
    loadCommentsForDocument,
    previewDoc,
    user,
    commentFilterMode,
    setCommentFilterMode,
    toggleComments,
    setDocCurrentPage,
  } = useStateStore();

  // Load comments for this document when the panel is shown
  useEffect(() => {
    if (initialDocument?.id != null && initialDocument?.projectId != null) {
      loadCommentsForDocument(initialDocument.projectId, initialDocument.id);
    }
  }, [initialDocument?.id, initialDocument?.projectId, loadCommentsForDocument]);

  // Infinite scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true); // TODO: Set based on backend response
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use previewDoc from store if available and matches, otherwise use prop
  // This ensures we get live updates when comments are added
  const document =
    previewDoc && previewDoc.id === initialDocument.id
      ? previewDoc
      : initialDocument;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      toggleComments();
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setDocCurrentPage(initialDocument.id, currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setDocCurrentPage(initialDocument.id, currentPage + 1);
    }
  };

  // TODO: Implement this function when backend is ready
  // This is a skeleton function for loading more comments
  const loadMoreComments = useCallback(async () => {
    if (isLoadingMore || !hasMoreComments) return;

    setIsLoadingMore(true);

    // TODO: Replace with actual API call
    // Example:
    // const response = await fetchComments({
    //   documentId: document.id,
    //   versionNumber: document.currentVersionNumber,
    //   cursor: lastCommentId,
    //   limit: 20,
    // });
    //
    // if (response.comments.length < 20) {
    //   setHasMoreComments(false);
    // }
    //
    // appendComments(response.comments);

    // Simulate loading delay for skeleton preview
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoadingMore(false);
    // For now, set hasMoreComments to false since we don't have backend
    setHasMoreComments(false);
  }, [isLoadingMore, hasMoreComments]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreComments && !isLoadingMore) {
          loadMoreComments();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMoreComments, isLoadingMore, loadMoreComments]);

  // Check if this is the newest version
  const isNewestVersion = useMemo(() => {
    if (!document.versions || document.versions.length === 0) return true;
    const maxVersion = Math.max(
      ...document.versions.map((v) => v.versionNumber),
    );
    return document.currentVersionNumber === maxVersion;
  }, [document.versions, document.currentVersionNumber]);

  // Organize comments into threads (top-level and replies)
  // Filter comments by current version and optionally by page
  const {
    topLevelComments,
    repliesByParent,
    totalCommentsCount,
    pageCommentsCount,
  } = useMemo(() => {
    const topLevel: comment[] = [];
    const replies: Record<string, comment[]> = {};

    // Filter comments by current version
    // If version is undefined (for backward compatibility), treat as version 1
    const versionComments = (document.comments || []).filter(
      (c) => (c.version ?? 1) === document.currentVersionNumber,
    );

    // Count comments for current page (excluding replies)
    const pageComments = versionComments.filter(
      (c) => !c.parentCommentId && c.page === currentPage,
    );
    const allTopLevel = versionComments.filter((c) => !c.parentCommentId);

    // Apply page filter if mode is 'page'
    const filteredComments =
      commentFilterMode === "page"
        ? versionComments.filter((c) => {
            // Include if it's a top-level comment on the current page
            if (!c.parentCommentId) {
              return c.page === currentPage;
            }
            // Include replies if their parent is on the current page
            const parentComment = versionComments.find(
              (p) => p.id === c.parentCommentId,
            );
            return parentComment?.page === currentPage;
          })
        : versionComments;

    filteredComments.forEach((c) => {
      if (c.parentCommentId) {
        if (!replies[c.parentCommentId]) {
          replies[c.parentCommentId] = [];
        }
        replies[c.parentCommentId].push(c);
      } else {
        topLevel.push(c);
      }
    });

    // Sort by date (oldest first for top-level, oldest first for replies)
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

    return {
      topLevelComments: topLevel,
      repliesByParent: replies,
      totalCommentsCount: allTopLevel.length,
      pageCommentsCount: pageComments.length,
    };
  }, [
    document.comments,
    document.currentVersionNumber,
    commentFilterMode,
    currentPage,
  ]);

  const handleReply = (commentId: string, authorId: string) => {
    setReplyingTo({ commentId, authorId });
    setNewComment(`@${authorId} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedComment = newComment.trim();
    if (!trimmedComment || !isNewestVersion) return;

    // Extract message without the @mention prefix if replying
    let message = trimmedComment;
    let replytoUserId: string | undefined;

    if (replyingTo) {
      const mentionMatch = trimmedComment.match(/^@(\S+)\s*/);
      if (mentionMatch) {
        replytoUserId = mentionMatch[1];
        message = trimmedComment.slice(mentionMatch[0].length);
      }
    }

    if (!message) return;

    setIsSubmittingComment(true);
    try {
      await addComment(
        document.projectId,
        document.id,
        {
          message,
          author: user?.username ?? "Current User",
          parentCommentId: replyingTo?.commentId,
          replytoUserId,
        },
        currentPage,
      );
      setNewComment("");
      setReplyingTo(null);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Card className="rounded-none h-full flex flex-col ">
      <CardHeader className="shrink-0 py-2 sm:py-3 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-bold text-sm sm:text-base">Comments</span>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {/* Filter dropdown */}
            <Select
              value={commentFilterMode}
              onValueChange={(value) =>
                setCommentFilterMode(value as CommentFilterMode)
              }
            >
              <SelectTrigger className="h-7 text-xs w-auto min-w-[80px] sm:min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({totalCommentsCount})</SelectItem>
                <SelectItem value="page">
                  Page {currentPage} ({pageCommentsCount})
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Page navigation buttons - only show in page mode with multiple pages */}
            {commentFilterMode === "page" && totalPages > 1 && (
              <div className="flex items-center gap-0.5 sm:gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Button>
                <span className="text-[10px] sm:text-xs text-muted-foreground min-w-[32px] sm:min-w-[40px] text-center">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  title="Next page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Button>
              </div>
            )}
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7"
              onClick={handleClose}
              title="Hide comments"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3 h-3 sm:w-4 sm:h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator className="shrink-0" />

      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-4">
            {topLevelComments.length === 0 && !isLoadingMore ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 mb-3 opacity-50"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
                <p className="text-sm">
                  {commentFilterMode === "page"
                    ? `No comments on this page`
                    : "No comments yet"}
                </p>
                <p className="text-xs mt-1">
                  {commentFilterMode === "page" && totalCommentsCount > 0
                    ? 'Switch to "All" to see other comments'
                    : "Start the conversation"}
                </p>
              </div>
            ) : (
              <>
                {topLevelComments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    replies={repliesByParent[c.id] || []}
                    onReply={handleReply}
                    isNewestVersion={isNewestVersion}
                    showPageBadge={
                      commentFilterMode === "all" && totalPages > 1
                    }
                  />
                ))}

                {/* Loading skeletons for infinite scroll */}
                {isLoadingMore && (
                  <div className="mt-2">
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {hasMoreComments && <div ref={loadMoreRef} className="h-4" />}

                {/* End of comments indicator */}
                {!hasMoreComments && topLevelComments.length > 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No more comments
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="shrink-0 flex-col gap-2 border-t bg-card p-2 sm:p-4">
        {!isNewestVersion ? (
          <div className="w-full text-center py-2 text-xs sm:text-sm text-muted-foreground">
            Comments can only be added to the newest version
          </div>
        ) : (
          <>
            {replyingTo && (
              <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
                <span>
                  Replying to{" "}
                  <span className="font-semibold">@{replyingTo.authorId}</span>
                </span>
                <button
                  onClick={handleCancelReply}
                  className="hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="w-full flex gap-1.5 sm:gap-2"
            >
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser" />
                <AvatarFallback className="text-[10px] sm:text-xs">
                  CU
                </AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 h-8 sm:h-10 text-sm"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={!newComment.trim() || isSubmittingComment}
                className="text-blue-500 font-semibold hover:text-blue-600 disabled:text-muted-foreground disabled:opacity-50 px-2 sm:px-3 h-8 sm:h-10 text-xs sm:text-sm"
              >
                Post
              </Button>
            </form>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
