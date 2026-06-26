export function PdfVariableMappingCard({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] leading-relaxed text-gray-800">{content}</p>
      <p className="text-[11px] text-gray-500">
        Use thumbs up/down on each row — corrections train the assistant for
        future PDF uploads.
      </p>
    </div>
  )
}
