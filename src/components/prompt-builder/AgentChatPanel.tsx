import { AssistantMinimizeGlyph } from "@/components/common/AssistantMinimizeGlyph"
import { AssistantProfileIcon } from "@/components/common/AssistantProfileIcon"
import { deriveAgentSuggestions } from "@/lib/derive-agent-suggestions"
import { deriveTemplateValidationIssues } from "@/lib/template-validation"
import { useEditorMode } from "@/hooks/use-builder-editor-mode"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Lightbulb, Send } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const ASSISTANT_COLLAPSED_KEY = "prompt-builder-assistant-collapsed"

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(ASSISTANT_COLLAPSED_KEY) === "true"
  } catch {
    return false
  }
}

export function AgentChatPanel() {
  const template = usePromptBuilderStore((s) => s.template)
  const editorMode = useEditorMode()
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const messages = usePromptBuilderStore((s) => s.messages)
  const isAgentTyping = usePromptBuilderStore((s) => s.isAgentTyping)
  const sendMessage = usePromptBuilderStore((s) => s.sendMessage)
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)
  const [ignoredIssueIds, setIgnoredIssueIds] = useState<Set<string>>(() => new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  const collapseAssistant = () => {
    setCollapsed(true)
    try {
      localStorage.setItem(ASSISTANT_COLLAPSED_KEY, "true")
    } catch {
      /* ignore */
    }
  }

  const expandAssistant = () => {
    setCollapsed(false)
    try {
      localStorage.setItem(ASSISTANT_COLLAPSED_KEY, "false")
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setIgnoredIssueIds(new Set())
  }, [template?.id])

  const validationIssues = useMemo(
    () =>
      deriveTemplateValidationIssues(template).filter(
        (issue) => issue.severity === "warning" && issue.action,
      ),
    [template],
  )

  const visibleValidationIssues = validationIssues.filter(
    (issue) => !ignoredIssueIds.has(issue.id),
  )

  const actionNeeded = editorMode === "edit" && visibleValidationIssues.length > 0

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

  const handleIgnore = (issueId: string) => {
    setIgnoredIssueIds((prev) => new Set(prev).add(issueId))
  }

  if (collapsed) {
    return (
      <aside className="flex w-8 shrink-0 flex-col border-l border-gray-200 bg-white">
        <button
          type="button"
          onClick={expandAssistant}
          className="group flex h-full w-full flex-col items-center gap-3 py-3 transition-colors hover:bg-gray-50"
          aria-label="Expand Chargebee assistant"
          title="Expand Chargebee assistant"
        >
          <AssistantMinimizeGlyph
            flipHorizontal
            className="size-3.5 text-gray-500 transition-colors group-hover:text-gray-800"
          />
          <AssistantProfileIcon className="size-4" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-100 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <AssistantProfileIcon className="size-5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[12px] leading-tight text-gray-900">
                <span className="font-bold">Chargebee</span>{" "}
                <span className="font-normal">assistant</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={collapseAssistant}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-800"
            aria-label="Collapse Chargebee assistant"
            title="Collapse Chargebee assistant"
          >
            <AssistantMinimizeGlyph className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
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
        <div className="mb-2.5">
          {actionNeeded ? (
            <div className="space-y-2">
              {visibleValidationIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
                >
                  <p className="text-[11px] font-medium leading-snug text-amber-950">
                    {issue.messageLines[0]}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-amber-950">
                    {issue.messageLines[1]}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isAgentTyping}
                      onClick={() => sendMessage(issue.action!.prompt)}
                      className="rounded-full bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                    >
                      Fix it
                    </button>
                    <button
                      type="button"
                      disabled={isAgentTyping}
                      onClick={() => handleIgnore(issue.id)}
                      className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="size-3 text-amber-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Suggested next steps
                </p>
              </div>
              <div className="mb-1.5 flex max-h-[52px] flex-wrap content-start gap-1 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isAgentTyping}
                    onClick={() => sendMessage(s.prompt)}
                    className="inline-flex h-6 shrink-0 items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 text-[10px] font-medium leading-none text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
