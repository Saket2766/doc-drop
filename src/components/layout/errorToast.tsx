import { toast } from "sonner";

/**
 * Displays an error toast at the top center of the screen.
 * Uses shadcn's sonner Toaster (must be rendered with position="top-center").
 */
export function errorToast(message: string): void {
  toast.error(message, {
    position: "top-center",
  });
}
