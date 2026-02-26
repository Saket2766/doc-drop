import UploadButton from "@rpldy/upload-button";
import { useStateStore } from "@/store/stateStore";
import { Spinner } from "@/components/ui/spinner";

export const NewVersionButton = () => {
  const uploadInProgressCount = useStateStore((s) => s.uploadInProgressCount);
  const isUploading = uploadInProgressCount > 0;

  return (
    <UploadButton
      extraProps={{ disabled: isUploading }}
      className="w-full px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isUploading ? (
        <>
          <Spinner className="size-4" />
          Uploading…
        </>
      ) : (
        "Add New Version"
      )}
    </UploadButton>
  );
};
