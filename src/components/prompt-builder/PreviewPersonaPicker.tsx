import { usePromptBuilderStore } from "@/store/prompt-builder-store"

type PreviewPersonaPickerProps = {
  className?: string
}

export function PreviewPersonaPicker({ className }: PreviewPersonaPickerProps) {
  const previewPersona = usePromptBuilderStore((s) => s.previewPersona)
  const setPreviewPersona = usePromptBuilderStore((s) => s.setPreviewPersona)
  const isSales = previewPersona === "sales"

  return (
    <button
      type="button"
      onClick={() => setPreviewPersona(isSales ? "admin" : "sales")}
      className={`shrink-0 text-[11px] font-medium transition-colors ${
        isSales
          ? "text-blue-700 underline decoration-blue-300 underline-offset-2"
          : "text-blue-600 hover:text-blue-700 hover:underline"
      } ${className ?? ""}`}
      aria-pressed={isSales}
    >
      {isSales ? "Back to my view" : "View as Sales"}
    </button>
  )
}
