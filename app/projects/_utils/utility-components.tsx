/**
 * Componentes de utilidad para diferentes estados de la página
 */

export function LoadingState() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-gray-600">Cargando proyectos...</p>
      </div>
    </div>
  );
}




