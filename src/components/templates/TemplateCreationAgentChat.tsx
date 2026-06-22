import { Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const OPENING_MESSAGE =
  "What are you creating this template for? Share the deal type, region, customer segment, or layout you have in mind."

const SUGGESTIONS = [
  "Amendment template for existing customers",
  "EU quotes with localized terms",
  "Compact SMB one-pager",
  "Enterprise template with TCV at the bottom",
] as const

function makeAssistantReply(brief: string): string {
  const trimmed = brief.trim()
  return `Got it — I'll shape a draft for:\n\n"${trimmed}"\n\nUse Create from description when you're ready, or switch to Duplicate or From PDF.`
}

type Props = {
  onBriefReady: (brief: string) => void
}

export function TemplateCreationAgentChat({ onBriefReady }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "opening",
      role: "assistant",
      content: OPENING_MESSAGE,
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const pushAssistantReply = (brief: string) => {
    setIsTyping(true)
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: makeAssistantReply(brief),
        },
      ])
      setIsTyping(false)
    }, 650)
  }

  const sendBrief = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    onBriefReady(trimmed)

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      },
    ])
    setInput("")
    pushAssistantReply(trimmed)
  }

  return (
    <div className="flex h-full min-h-[340px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-[12px] text-gray-500">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="mb-2 flex max-h-[52px] flex-wrap content-start gap-1 overflow-hidden">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isTyping}
              onClick={() => sendBrief(suggestion)}
              className="inline-flex h-6 shrink-0 items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 text-[10px] font-medium leading-none text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                sendBrief(input)
              }
            }}
            rows={2}
            placeholder="e.g. Renewal quotes for EU enterprise with Net-60 terms"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-[12px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => sendBrief(input)}
            disabled={!input.trim() || isTyping}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
