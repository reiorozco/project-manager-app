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
  labelText = "Archivos",
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

    // Validar tamaño de archivos
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setFileError(
        `Algunos archivos exceden el tamaño máximo de 5 MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    // Comprobar si supera el límite de archivos
    const totalFiles = [...selectedFiles, ...newFiles];
    if (totalFiles.length > MAX_FILES) {
      setFileError(
        `Solo puedes seleccionar un máximo de ${MAX_FILES} archivos`,
      );
      return;
    }

    // Combinar archivos evitando duplicados
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

    // Importante: resetear el valor del input para permitir seleccionar el mismo archivo de nuevo
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
          {/* Área para seleccionar archivos */}
          <div
            className={`border-2 ${isDragging ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-300"} 
                      rounded-md text-center cursor-pointer transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Agregamos un div interno que maneja el clic */}
            <div onClick={handleClickArea} className="p-6">
              <p className="text-sm font-medium mb-1">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500">
                Formatos permitidos: PDF, Office, imágenes, ZIP (máx. 5 MB por
                archivo)
              </p>
            </div>
          </div>

          {/* Input oculto para la selección de archivos */}
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

          {/* Mostrar error si existe */}
          {fileError && <p className="text-sm text-red-500">{fileError}</p>}

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  Archivos seleccionados ({selectedFiles.length}/{MAX_FILES})
                </p>
                {selectedFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilesChange([])}
                    className="text-red-500 text-xs h-6 px-2"
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>

              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-2 bg-white rounded"
                  >
                    <div className="truncate max-w-[250px]">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 h-6 w-6 p-0"
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
