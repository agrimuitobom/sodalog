export function RecordCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 skeleton flex-shrink-0" />
        <div className="p-3 flex-1 space-y-2">
          <div className="h-4 w-28 skeleton" />
          <div className="h-3 w-20 skeleton" />
          <div className="h-3 w-full skeleton" />
          <div className="flex gap-1">
            <div className="h-5 w-12 skeleton rounded" />
            <div className="h-5 w-10 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <RecordCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-center space-y-2">
            <div className="h-7 w-10 skeleton mx-auto" />
            <div className="h-3 w-12 skeleton mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
        <div className="h-3 w-24 skeleton" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-16 skeleton" />
            <div className="flex-1 h-2 skeleton" />
            <div className="h-3 w-6 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 skeleton rounded-full" />
        <div className="h-6 w-40 skeleton" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-32 skeleton" />
        <div className="h-4 w-20 skeleton" />
      </div>
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <div className="h-3 w-12 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-3/4 skeleton" />
      </div>
    </div>
  );
}
