import { useCanvasLayoutBanners } from "@/hooks/use-block-layout-hints"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { TriangleAlert } from "lucide-react"

export function CanvasLayoutBanner() {
  const banners = useCanvasLayoutBanners()
  const sendMessage = usePromptBuilderStore((s) => s.sendMessage)
  const isAgentTyping = usePromptBuilderStore((s) => s.isAgentTyping)

  if (banners.length === 0) return null

  return (
    <div className="space-y-3">
      {banners.map((banner) => (
        <div
          key={banner.issueId}
          className="flex items-start gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/90 px-4 py-3"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium leading-snug text-amber-950">
              {banner.message}
            </p>
            {banner.action && (
              <button
                type="button"
                disabled={isAgentTyping}
                onClick={() => sendMessage(banner.action!.prompt)}
                className="mt-2 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {banner.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
