export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-xs">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="text-body-md font-semibold text-on-surface-variant animate-pulse">Loading Page...</span>
      </div>
    </div>
  );
}
