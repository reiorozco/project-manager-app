function EmptyState({ canCreateProject }: { canCreateProject: boolean }) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-medium text-gray-600">
        No hay proyectos disponibles
      </h2>
      {canCreateProject && (
        <p className="mt-2 text-gray-500">
          Haz clic en &#34;Nuevo Proyecto&#34; para comenzar.
        </p>
      )}
    </div>
  );
}

export default EmptyState;
