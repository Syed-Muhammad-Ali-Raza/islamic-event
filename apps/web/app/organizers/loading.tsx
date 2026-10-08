export default function OrganizersLoading() {
  return (
    <div className="container-page py-10">
      <div className="space-y-3 mb-8">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-glass p-6 space-y-3 animate-pulse">
            <div className="w-12 h-12 bg-surface-200 rounded-full" />
            <div className="h-4 bg-surface-200 rounded w-2/3" />
            <div className="h-3 bg-surface-200 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
