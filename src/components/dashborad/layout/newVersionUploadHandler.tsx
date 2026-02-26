import { errorToast } from "@/components/layout/errorToast";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/types";
import { detectDocumentType } from "@/lib/utils";
import { useStateStore } from "@/store/stateStore";
import { useBatchAddListener } from "@rpldy/uploady";
import { getApiErrorMessage } from "@/api/client";

/**
 * Single handler for "Add New Version" uploads. Rendered once in the dashboard
 * so that useBatchAddListener runs only once and addVersionToDoc is not called twice
 * when NewVersionButton is shown in multiple places.
 */
export const NewVersionUploadHandler = () => {
  const currentDoc = useStateStore((state) => state.currentDoc);
  const currentProject = useStateStore((state) => state.currentProject);
  const { uploadNewVersionToDoc } = useStateStore();

  useBatchAddListener((batch) => {
    if (currentDoc && currentProject) {
      batch.items.forEach((item) => {
        if (item.file) {
          const file = item.file as unknown as File;
          if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            errorToast("File size must be 100 MB or less.");
            return;
          }
          const newDocType = detectDocumentType(file);
          if (newDocType !== currentDoc.documentType) {
            errorToast(
              "New version must be the same file type as the current document.",
            );
            return;
          }
          uploadNewVersionToDoc(currentProject.id, currentDoc.id, file).catch(
            (err) => {
              errorToast(getApiErrorMessage(err));
            },
          );
        }
      });
    }
  });

  return null;
};
