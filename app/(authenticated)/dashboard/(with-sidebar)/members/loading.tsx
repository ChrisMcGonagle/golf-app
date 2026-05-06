export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="h-9 w-52 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="min-w-[760px] divide-y divide-gray-100">
          <div className="flex gap-6 bg-gray-50 px-4 py-3">
            {[80, 120, 120, 64, 160, 100, 100, 120].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-gray-200" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-4">
              {[80, 120, 120, 64, 160, 100, 100, 120].map((w, j) => (
                <div key={j} className="h-4 animate-pulse rounded bg-gray-100" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
