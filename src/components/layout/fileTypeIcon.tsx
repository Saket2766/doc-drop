import { cn } from "@/lib/utils";

// File type icon component
export const FileTypeIcon = ({ type }: { type: string; }) => {
  const iconClasses = "w-6 h-6";

  switch (type) {
    case "pdf":
      return (
        <svg
          className={cn(iconClasses, "text-red-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 18h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V8H7v2zm12-8H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H5V4h14v16z" />
        </svg>
      );
    case "docx":
    case "doc":
      return (
        <svg
          className={cn(iconClasses, "text-blue-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case "xlsx":
    case "xls":
    case "csv":
      return (
        <svg
          className={cn(iconClasses, "text-green-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 11h-2v2H9v-2H7v-2h2V9h2v2h2v2zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case "pptx":
    case "ppt":
      return (
        <svg
          className={cn(iconClasses, "text-orange-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 15H8v-5h4a2.5 2.5 0 0 1 0 5zm0-3H10v1h2a.5.5 0 0 0 0-1zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case "image":
      return (
        <svg
          className={cn(iconClasses, "text-purple-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case "video":
      return (
        <svg
          className={cn(iconClasses, "text-pink-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z" />
        </svg>
      );
    case "audio":
      return (
        <svg
          className={cn(iconClasses, "text-cyan-500")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    default:
      return (
        <svg
          className={cn(iconClasses, "text-gray-400")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
  }
};
