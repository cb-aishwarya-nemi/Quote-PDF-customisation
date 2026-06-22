import {
  CANVAS_DOCUMENT_MAX_WIDTH,
  CANVAS_DOCUMENT_PADDING_PX,
} from "@/lib/canvas-constants"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className ?? ""}`}
    />
  )
}

export function PromptBuilderSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col bg-[#e8eaed]">
          <div className="flex-1 overflow-hidden p-6">
            <div
              className="mx-auto w-full rounded-xl bg-white shadow-md ring-1 ring-black/5"
              style={{
                maxWidth: CANVAS_DOCUMENT_MAX_WIDTH,
                padding: CANVAS_DOCUMENT_PADDING_PX,
              }}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Bone className="h-5 w-2/5" />
                  <Bone className="h-3 w-3/5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Bone className="h-16" />
                  <Bone className="h-16" />
                </div>
                <Bone className="h-28 w-full" />
                <Bone className="h-20 w-full" />
                <Bone className="h-24 w-full" />
                <Bone className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>

        <aside className="flex w-[340px] shrink-0 flex-col border-l border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bone className="size-7 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-24" />
                <Bone className="h-2.5 w-36" />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 px-4 py-3">
            <Bone className="mb-2 h-3 w-28" />
            <div className="flex flex-wrap gap-1.5">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
            <Bone className="ml-0 h-24 w-[88%] rounded-lg" />
            <Bone className="ml-auto h-14 w-[72%] rounded-lg" />
            <Bone className="ml-0 h-20 w-[85%] rounded-lg" />
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <Bone className="h-10 w-full rounded-lg" />
          </div>
        </aside>
    </div>
  )
}
