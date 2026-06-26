import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MAX_FILE_SIZE, MAX_FILES } from "@/app/projects/_utils/types";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";

interface Props {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  labelText?: string;
}

export function FileUploader({
  selectedFiles,
  onFilesChange,
  labelText = "Files",
  ...fieldProps
}: Props) {
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedFormats =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip";

  const processFiles = (newFiles: File[]) => {
    setFileError(null);

    if (newFiles.length === 0) return;

    // Validate file size
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setFileError(
        `Some files exceed the 5 MB maximum: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    // Check whether the file limit is exceeded
    const totalFiles = [...selectedFiles, ...newFiles];
    if (totalFiles.length > MAX_FILES) {
      setFileError(`You can select a maximum of ${MAX_FILES} files`);
      return;
    }

    // Merge files, avoiding duplicates
    const combinedFiles = [...selectedFiles];
    newFiles.forEach((newFile) => {
      if (!combinedFiles.some((file) => file.name === newFile.name)) {
        combinedFiles.push(newFile);
      }
    });

    onFilesChange(combinedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    // Important: reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  const handleClickArea = (e: React.MouseEvent) => {
    e.preventDefault();

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  return (
    <FormItem>
      <FormLabel>{labelText}</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {/* Area to select files */}
          <div
            className={`rounded-md border-2 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-dashed border-input hover:border-primary/40 hover:bg-accent/40"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Inner div that handles the click */}
            <div onClick={handleClickArea} className="p-6">
              <p className="text-sm font-medium mb-1">
                Drag files here or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Allowed formats: PDF, Office, images, ZIP (max 5 MB per
                file)
              </p>
            </div>
          </div>

          {/* Hidden input for file selection */}
          <Input
            type="file"
            multiple
            accept={acceptedFormats}
            onChange={handleFileChange}
            className="hidden"
            disabled={selectedFiles.length >= MAX_FILES}
            {...fieldProps}
            ref={fileInputRef}
          />

          {/* Show error if any */}
          {fileError && (
            <p className="text-sm text-destructive">{fileError}</p>
          )}

          {/* List of selected files */}
          {selectedFiles.length > 0 && (
            <div className="bg-muted rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  Selected files ({selectedFiles.length}/{MAX_FILES})
                </p>
                {selectedFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilesChange([])}
                    className="text-destructive text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-2 bg-background rounded border"
                  >
                    <div className="truncate max-w-[250px]">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-destructive h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
