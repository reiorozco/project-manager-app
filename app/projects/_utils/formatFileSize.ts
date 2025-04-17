export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} bytes`;

  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;

  return `${(bytes / 1048576).toFixed(2)} MB`;
};
