export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <div className="h-12 w-12 rounded-full border-4 border-forest-700 border-t-transparent animate-spin" />
        <p className="text-warm-500 font-bold text-xs uppercase tracking-wider">
          Loading SchooMA…
        </p>
      </div>
    </div>
  );
}
