import { TemplateVariablesPanel } from "@/components/prompt-builder/TemplateVariablesPanel"
import { deriveAgentSuggestions } from "@/lib/derive-agent-suggestions"
import { useEditorMode } from "@/hooks/use-builder-editor-mode"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Lightbulb, Send, Sparkles } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export function AgentChatPanel() {
  const template = usePromptBuilderStore((s) => s.template)
  const editorMode = useEditorMode()
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const messages = usePromptBuilderStore((s) => s.messages)
  const isAgentTyping = usePromptBuilderStore((s) => s.isAgentTyping)
  const sendMessage = usePromptBuilderStore((s) => s.sendMessage)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () =>
      deriveAgentSuggestions({
        template,
        selectedBlockId,
        activeScenario,
        messages,
      }),
    [template, selectedBlockId, activeScenario, messages],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isAgentTyping])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput("")
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#012A38]">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">
              Template agent
            </p>
            <p className="text-[11px] text-gray-500">
              {editorMode === "preview"
                ? "Preview mode — changes apply to the template"
                : "Describe changes in plain language"}
            </p>
          </div>
        </div>
      </div>

      <TemplateVariablesPanel />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isAgentTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-[13px] text-gray-500">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        {suggestions.length > 0 && (
          <div className="mb-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="size-3 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Suggested next steps
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={isAgentTyping}
                  onClick={() => sendMessage(s.prompt)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={2}
            placeholder="e.g. Add German VAT clause for EU customers"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isAgentTyping}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
