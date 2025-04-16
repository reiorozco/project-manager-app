function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6 bg-red-50 text-red-600 rounded-lg max-w-3xl mx-auto my-8">
      <h2 className="text-lg font-semibold">Error</h2>
      <p>{error}</p>
    </div>
  );
}

export default ErrorState;
