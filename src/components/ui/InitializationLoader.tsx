// src/components/ui/InitializationLoader.tsx
export function InitializationLoader() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[150]">
      <div className="flex flex-col items-center gap-4">
        {/* Mindmaker logo spinner */}
        <div className="w-12 h-12 border-4 border-[#00D9B6] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
