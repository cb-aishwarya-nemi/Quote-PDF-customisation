const PUBLISH_INTERSTITIAL_MS = 1200

export { PUBLISH_INTERSTITIAL_MS }

export function PublishInterstitial({ templateName }: { templateName: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f5f7fa]/90 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label={`Publishing ${templateName}`}
    >
      <div className="relative mb-5 flex size-[52px] items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-blue-100" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-600" />
        <span className="absolute inset-[7px] animate-spin rounded-full border-2 border-transparent border-b-blue-400 [animation-direction:reverse] [animation-duration:1.1s]" />
        <span className="size-2 rounded-full bg-blue-600/80" />
      </div>
      <p className="text-[15px] leading-snug text-gray-800">
        Publishing{" "}
        <span className="font-semibold text-gray-900">{templateName}</span>
      </p>
    </div>
  )
}
