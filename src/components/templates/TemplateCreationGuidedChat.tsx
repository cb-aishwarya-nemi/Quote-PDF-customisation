import { AssistantProfileIcon } from "@/components/common/AssistantProfileIcon"
import {
  areAllQuestionsComplete,
  formatGuidedCreationBrief,
  isQuestionComplete,
  TEMPLATE_CREATION_INTRO,
  TEMPLATE_CREATION_QUESTIONS,
  type ChipOption,
  type GuidedSelections,
  type QuestionGroup,
  type TemplateCreationQuestion,
} from "@/lib/template-creation-questions"
import { ArrowLeft, Send, Sparkles } from "lucide-react"
import { useCallback, useEffect, useId, useRef, useState } from "react"

type Props = {
  onBack: () => void
  onComplete: (brief: string) => void
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const INITIAL_BOOT_MS = 2000
const TYPING_MS = 450
const AUTO_SEND_MS = 300

function Chip({
  option,
  selected,
  disabled,
  onClick,
}: {
  option: ChipOption
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-left text-[12px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "scale-[1.02] border-2 border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
          : option.suggested
            ? "border border-dashed border-blue-300 bg-blue-50/40 text-gray-800 hover:border-blue-400 hover:bg-blue-50/70"
            : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {option.label}
    </button>
  )
}

function questionPrompt(question: TemplateCreationQuestion): string {
  if (question.kind === "grouped") {
    return "What legal content should appear on the quote?"
  }
  return question.prompt
}

function answerLabel(
  question: TemplateCreationQuestion,
  selections: GuidedSelections,
): string {
  if (question.kind === "grouped") {
    return question.groups
      .map((group) => {
        const selected = selections[group.id] ?? []
        if (selected.length === 0) return null
        const labels = selected.map(
          (id) => group.options.find((option) => option.id === id)?.label ?? id,
        )
        return labels.join(", ")
      })
      .filter(Boolean)
      .join(" · ")
  }

  const selected = selections[question.id] ?? []
  return selected
    .map(
      (id) =>
        question.options.find((option) => option.id === id)?.label ?? id,
    )
    .join(", ")
}

function shouldAutoSend(question: TemplateCreationQuestion): boolean {
  return question.kind !== "multi"
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 guided-chat-msg-in-left">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
        <AssistantProfileIcon className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200/80">
        <span className="flex items-center gap-1" aria-label="Assistant is typing">
          <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:140ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:280ms]" />
        </span>
      </div>
    </div>
  )
}

function QuestionChips({
  question,
  selections,
  disabled,
  onSelectSingle,
  onToggleMulti,
  onSelectGroup,
}: {
  question: TemplateCreationQuestion
  selections: GuidedSelections
  disabled?: boolean
  onSelectSingle: (fieldId: string, optionId: string) => void
  onToggleMulti: (fieldId: string, optionId: string) => void
  onSelectGroup: (group: QuestionGroup, optionId: string) => void
}) {
  if (question.kind === "grouped") {
    return (
      <div className="space-y-3">
        {question.groups.map((group) => (
          <div key={group.id}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {group.label}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {group.options.map((option) => (
                <Chip
                  key={option.id}
                  option={option}
                  disabled={disabled}
                  selected={(selections[group.id] ?? []).includes(option.id)}
                  onClick={() => onSelectGroup(group, option.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const fieldSelections = selections[question.id] ?? []
  const isSingle = question.kind === "single"

  return (
    <div className="flex flex-wrap gap-1.5">
      {question.options.map((option) => (
        <Chip
          key={option.id}
          option={option}
          disabled={disabled}
          selected={fieldSelections.includes(option.id)}
          onClick={() =>
            isSingle
              ? onSelectSingle(question.id, option.id)
              : onToggleMulti(question.id, option.id)
          }
        />
      ))}
    </div>
  )
}

export function TemplateCreationGuidedChat({ onBack, onComplete }: Props) {
  const uid = useId()
  const messageId = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const autoSendTimer = useRef<number | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selections, setSelections] = useState<GuidedSelections>({})
  const [awaitingIndex, setAwaitingIndex] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(true)
  const [input, setInput] = useState("")
  const [composerPulse, setComposerPulse] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [flowComplete, setFlowComplete] = useState(false)

  const nextMessageId = useCallback(() => {
    messageId.current += 1
    return `${uid}-${messageId.current}`
  }, [uid])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(
    () => () => {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current)
    },
    [],
  )

  const revealAssistantMessage = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: "assistant", text },
      ])
    },
    [nextMessageId],
  )

  const revealNextQuestion = useCallback(
    (index: number) => {
      setIsTyping(true)
      window.setTimeout(() => {
        revealAssistantMessage(questionPrompt(TEMPLATE_CREATION_QUESTIONS[index]))
        setIsTyping(false)
        setAwaitingIndex(index)
      }, TYPING_MS)
    },
    [revealAssistantMessage],
  )

  const finishFlow = useCallback(() => {
    setIsTyping(true)
    setAwaitingIndex(null)
    window.setTimeout(() => {
      revealAssistantMessage(
        "Got it — I have enough to draft your quote template. Hit Generate when you're ready.",
      )
      setIsTyping(false)
      setFlowComplete(true)
    }, TYPING_MS)
  }, [revealAssistantMessage])

  useEffect(() => {
    let cancelled = false

    const bootTimer = window.setTimeout(() => {
      if (cancelled) return
      revealAssistantMessage(TEMPLATE_CREATION_INTRO)
      revealAssistantMessage(questionPrompt(TEMPLATE_CREATION_QUESTIONS[0]))
      setIsTyping(false)
      setAwaitingIndex(0)
    }, INITIAL_BOOT_MS)

    return () => {
      cancelled = true
      clearTimeout(bootTimer)
    }
  }, [revealAssistantMessage])

  const fillComposer = useCallback((text: string) => {
    setInput(text)
    setComposerPulse(true)
    window.setTimeout(() => setComposerPulse(false), 450)
  }, [])

  const sendAnswer = useCallback(
    (questionIndex: number, answerText: string) => {
      if (autoSendTimer.current) {
        clearTimeout(autoSendTimer.current)
        autoSendTimer.current = null
      }

      const trimmed = answerText.trim()
      if (!trimmed) return

      setIsSending(true)
      setAwaitingIndex(null)

      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: nextMessageId(), role: "user", text: trimmed },
        ])
        setInput("")
        setIsSending(false)

        const nextIndex = questionIndex + 1
        if (nextIndex < TEMPLATE_CREATION_QUESTIONS.length) {
          revealNextQuestion(nextIndex)
        } else {
          finishFlow()
        }
      }, 180)
    },
    [finishFlow, nextMessageId, revealNextQuestion],
  )

  const scheduleAutoSend = useCallback(
    (questionIndex: number, text: string) => {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current)
      autoSendTimer.current = window.setTimeout(() => {
        sendAnswer(questionIndex, text)
      }, AUTO_SEND_MS)
    },
    [sendAnswer],
  )

  const handleSelectionChange = useCallback(
    (nextSelections: GuidedSelections, questionIndex: number) => {
      const question = TEMPLATE_CREATION_QUESTIONS[questionIndex]
      if (!question) return

      const text = answerLabel(question, nextSelections)
      fillComposer(text)

      if (
        isQuestionComplete(question, nextSelections) &&
        shouldAutoSend(question)
      ) {
        scheduleAutoSend(questionIndex, text)
      }
    },
    [fillComposer, scheduleAutoSend],
  )

  const selectSingle = (fieldId: string, optionId: string) => {
    if (awaitingIndex === null) return
    const questionIndex = awaitingIndex
    setSelections((prev) => {
      const next = { ...prev, [fieldId]: [optionId] }
      queueMicrotask(() => handleSelectionChange(next, questionIndex))
      return next
    })
  }

  const toggleMulti = (fieldId: string, optionId: string) => {
    if (awaitingIndex === null) return
    const questionIndex = awaitingIndex
    setSelections((prev) => {
      const current = prev[fieldId] ?? []
      const fieldNext = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      const next = { ...prev, [fieldId]: fieldNext }
      queueMicrotask(() => handleSelectionChange(next, questionIndex))
      return next
    })
  }

  const selectGroup = (group: QuestionGroup, optionId: string) => {
    if (group.type === "single") {
      selectSingle(group.id, optionId)
      return
    }
    toggleMulti(group.id, optionId)
  }

  const activeQuestion =
    awaitingIndex !== null
      ? TEMPLATE_CREATION_QUESTIONS[awaitingIndex]
      : null

  const canSend =
    !isTyping &&
    !isSending &&
    awaitingIndex !== null &&
    activeQuestion !== null &&
    isQuestionComplete(activeQuestion, selections) &&
    input.trim().length > 0

  const handleSend = () => {
    if (!canSend || awaitingIndex === null) return
    sendAnswer(awaitingIndex, input)
  }

  const allComplete = areAllQuestionsComplete(selections) && flowComplete

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">
            Help me create one
          </p>
          <p className="text-[11px] text-gray-500">
            {allComplete
              ? "Ready to generate"
              : isTyping
                ? "Assistant is typing…"
                : "Pick an option or type your reply"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] px-6 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="flex max-w-[92%] gap-3 guided-chat-msg-in-left">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                    <AssistantProfileIcon className="size-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[13px] leading-relaxed text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-blue-50 px-4 py-2.5 text-[13px] leading-relaxed text-blue-900/80 ring-1 ring-blue-100 guided-chat-msg-in-right">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {activeQuestion && !isTyping && !isSending && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Quick replies
              </p>
              <QuestionChips
                question={activeQuestion}
                selections={selections}
                disabled={isSending}
                onSelectSingle={selectSingle}
                onToggleMulti={toggleMulti}
                onSelectGroup={selectGroup}
              />
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              disabled={isTyping || isSending || awaitingIndex === null}
              placeholder={
                flowComplete
                  ? "All questions answered"
                  : isTyping
                    ? "Waiting for the next question…"
                    : activeQuestion?.kind === "multi" ||
                        (activeQuestion?.kind === "grouped" &&
                          activeQuestion.groups.some(
                            (group) => group.type === "multi",
                          ))
                      ? "Select options above, then send your reply"
                      : "Your answer will appear here when you pick an option"
              }
              className={`min-h-[48px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-[13px] transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                composerPulse ? "guided-chat-composer-fill" : ""
              } ${isSending ? "opacity-70" : ""}`}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400">
              {activeQuestion && !shouldAutoSend(activeQuestion)
                ? "Multi-select — send when you're done"
                : "Your pick fills the reply and sends automatically"}
            </p>
            <button
              type="button"
              onClick={() => onComplete(formatGuidedCreationBrief(selections))}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              <Sparkles className="size-4" />
              Generate template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
