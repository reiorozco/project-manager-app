// Formatea una fecha a "yyyy-mm-dd" para inputs type="date"
export const toDateInputValue = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// Formato compacto para mostrar una fecha límite (sin hora).
// Se guarda a medianoche UTC, así que se formatea en UTC para evitar
// desfases de un día según la zona horaria del navegador.
export const formatDueDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Calcula la diferencia en días entre la fecha actual y una fecha dada
export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Verifica si una fecha es reciente (menos de 3 días)
export const isRecentDate = (dateString: string): boolean => {
  return getDaysSince(dateString) <= 3;
};
