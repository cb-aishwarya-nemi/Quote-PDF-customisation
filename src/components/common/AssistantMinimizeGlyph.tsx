import { useEffect, useId, useState } from "react"

export function AssistantMinimizeGlyph({
  className,
  flipHorizontal,
}: {
  className?: string
  flipHorizontal?: boolean
}) {
  const maskId = `amg-mask-${useId().replace(/:/g, "")}`
  const flipped = Boolean(flipHorizontal)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <span
      className={[
        "flex shrink-0 origin-center items-center justify-center",
        mounted
          ? "transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
          : "",
        flipped ? "-scale-x-100" : "scale-x-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={13}
        height={13}
        viewBox="0 0 13 13"
        fill="none"
        className="block h-full w-full max-h-[13px] max-w-[13px]"
      >
        <defs>
          <mask
            id={maskId}
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={13}
            height={13}
          >
            <rect width={13} height={13} rx={3} fill="black" />
          </mask>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="12"
          height="12"
          rx="2.5"
          stroke="currentColor"
          fill="none"
        />
        <g mask={`url(#${maskId})`}>
          <path
            d="M4.78485 9.68481L4.05187 8.95814L5.97595 7.03406H2.46747V5.96618H5.97595L4.05187 4.04525L4.78485 3.31543L7.96954 6.50012L4.78485 9.68481Z"
            fill="currentColor"
          />
          <rect x="9" y="0" width="1" height="13" fill="currentColor" />
        </g>
      </svg>
    </span>
  )
}
