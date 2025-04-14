import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ControllerRenderProps } from "react-hook-form";
import { MAX_FILE_SIZE, MAX_FILES, ProjectFormValues } from "./types";

interface FileSelectorProps {
  field: Omit<
    ControllerRenderProps<ProjectFormValues, "files">,
    "value" | "onChange"
  >;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onFilesChange: (files: File[]) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  field,
  selectedFiles,
  setSelectedFiles,
  setError,
  onFilesChange,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);

    if (newFiles.length === 0) return;

    // Validar tamaño de archivos
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(
        `Algunos archivos exceden el tamaño máximo de 5 MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    // Comprobar si supera el límite de archivos
    const totalFiles = [...selectedFiles, ...newFiles];
    if (totalFiles.length > MAX_FILES) {
      setError(`Solo puedes seleccionar un máximo de ${MAX_FILES} archivos`);
      return;
    }

    // Agregar nuevos archivos al conjunto existente, evitando duplicados por nombre
    const combinedFiles = [...selectedFiles];

    newFiles.forEach((newFile) => {
      // Verificar si ya existe un archivo con el mismo nombre
      const fileExists = combinedFiles.some(
        (existingFile) => existingFile.name === newFile.name,
      );

      // Si no existe, añadirlo al array
      if (!fileExists) {
        combinedFiles.push(newFile);
      }
    });

    setSelectedFiles(combinedFiles);
    onFilesChange(combinedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    onFilesChange([]);
  };

  return (
    <FormItem>
      <FormLabel>Archivos</FormLabel>
      <FormControl>
        <div className="flex flex-col space-y-2">
          <div className="space-y-1">
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={selectedFiles.length >= MAX_FILES}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
              {...field}
            />
            <p className="text-xs text-gray-500">
              Formatos permitidos: PDF, Office, imágenes, ZIP (máx. {MAX_FILES}{" "}
              archivos)
            </p>
          </div>

          {/* Previsualización de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  Archivos seleccionados ({selectedFiles.length}/{MAX_FILES}):
                </p>
                {selectedFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-red-500 text-xs h-6 px-2"
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>
              <ul className="text-sm space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center truncate">
                      <span className="truncate max-w-[250px]">
                        {file.name}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 text-xs h-6 px-2"
                    >
                      Eliminar
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
};
