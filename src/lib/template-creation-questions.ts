export const TEMPLATE_CREATION_INTRO =
  "You're on Chargebee with Starter, Growth and Enterprise plans, annual and monthly billing, and trial periods configured. Answer 5 quick questions and we'll build your quote template."

export type ChipOption = {
  id: string
  label: string
  suggested?: boolean
}

export type QuestionGroup = {
  id: string
  label: string
  type: "single" | "multi"
  options: ChipOption[]
}

export type TemplateCreationQuestion =
  | {
      id: string
      kind: "single"
      prompt: string
      options: ChipOption[]
    }
  | {
      id: string
      kind: "multi"
      prompt: string
      options: ChipOption[]
    }
  | {
      id: string
      kind: "grouped"
      groups: QuestionGroup[]
    }

export const TEMPLATE_CREATION_QUESTIONS: TemplateCreationQuestion[] = [
  {
    id: "template_scope",
    kind: "single",
    prompt:
      "Your catalog has Starter, Growth and Enterprise tiers — do enterprise deals go out on a different quote than the rest?",
    options: [
      {
        id: "enterprise_own_template",
        label: "Yes, enterprise gets its own template",
        suggested: true,
      },
      {
        id: "one_layout_all_tiers",
        label: "No, one layout covers all tiers",
      },
      {
        id: "new_business_renewals_differ",
        label: "New business and renewals differ more",
      },
    ],
  },
  {
    id: "pricing_presentation",
    kind: "single",
    prompt:
      "You have both monthly and annual plans — should the quote show a side-by-side comparison to nudge buyers toward annual?",
    options: [
      {
        id: "side_by_side_annual_highlighted",
        label: "Yes, show both with annual highlighted",
        suggested: true,
      },
      {
        id: "sales_selection_only",
        label: "No, show only what sales selects",
      },
      {
        id: "annual_savings_callout",
        label: "Show annual savings as a callout only",
      },
    ],
  },
  {
    id: "legal_content",
    kind: "grouped",
    groups: [
      {
        id: "legal_include",
        label: "What to include",
        type: "multi",
        options: [
          { id: "tcs", label: "T&Cs", suggested: true },
          {
            id: "dpa",
            label: "Data processing addendum",
            suggested: true,
          },
          { id: "liability_cap", label: "Liability cap" },
          { id: "aup", label: "Acceptable use policy" },
          {
            id: "legal_separate_doc",
            label: "Nothing — legal is a separate doc",
          },
        ],
      },
      {
        id: "legal_by_plan",
        label: "Should it vary by plan?",
        type: "single",
        options: [
          { id: "same_terms_all", label: "Same terms for all plans" },
          {
            id: "different_enterprise",
            label: "Different terms for Enterprise",
            suggested: true,
          },
          { id: "per_plan_terms", label: "Each plan has its own terms" },
        ],
      },
    ],
  },
  {
    id: "additional_sections",
    kind: "multi",
    prompt:
      "You offer trial periods — should the quote show the trial details before the paid subscription kicks in?",
    options: [
      {
        id: "trial_period_start",
        label: "Yes, show trial period and start date",
        suggested: true,
      },
      {
        id: "trial_end_behavior",
        label: "Show what happens at trial end",
        suggested: true,
      },
      {
        id: "paid_plan_only",
        label: "Keep it simple, just show the paid plan",
      },
      {
        id: "quote_validity",
        label: "Add a validity date for the quote offer",
      },
      {
        id: "signature_block",
        label: "Include a signature block",
      },
    ],
  },
  {
    id: "look_and_feel",
    kind: "multi",
    prompt:
      "SaaS buyers expect clean, modern quotes — how much detail do you want your PDF to carry?",
    options: [
      {
        id: "minimal_pricing_terms",
        label: "Minimal — pricing and key terms only",
        suggested: true,
      },
      {
        id: "feature_highlights",
        label: "Include product feature highlights per tier",
      },
      {
        id: "cover_page_rep",
        label: "Add a short cover page with rep details",
      },
      {
        id: "brand_guidelines",
        label: "Strictly follow our brand guidelines",
      },
    ],
  },
]

export type GuidedSelections = Record<string, string[]>

function optionLabel(question: TemplateCreationQuestion, optionId: string) {
  if (question.kind === "grouped") {
    for (const group of question.groups) {
      const match = group.options.find((option) => option.id === optionId)
      if (match) return match.label
    }
    return optionId
  }
  return (
    question.options.find((option) => option.id === optionId)?.label ?? optionId
  )
}

export function getQuestionFieldIds(question: TemplateCreationQuestion): string[] {
  if (question.kind === "grouped") {
    return question.groups.map((group) => group.id)
  }
  return [question.id]
}

export function isQuestionComplete(
  question: TemplateCreationQuestion,
  selections: GuidedSelections,
): boolean {
  return getQuestionFieldIds(question).every(
    (fieldId) => (selections[fieldId]?.length ?? 0) > 0,
  )
}

export function areAllQuestionsComplete(selections: GuidedSelections): boolean {
  return TEMPLATE_CREATION_QUESTIONS.every((question) =>
    isQuestionComplete(question, selections),
  )
}

export function formatGuidedCreationBrief(
  selections: GuidedSelections,
): string {
  return TEMPLATE_CREATION_QUESTIONS.map((question) => {
    if (question.kind === "grouped") {
      const lines = question.groups
        .map((group) => {
          const selected = selections[group.id] ?? []
          if (selected.length === 0) return null
          const labels = selected.map((id) =>
            group.options.find((option) => option.id === id)?.label ?? id,
          )
          return `${group.label}: ${labels.join(", ")}`
        })
        .filter(Boolean)
      if (lines.length === 0) return null
      return lines.join("\n")
    }

    const selected = selections[question.id] ?? []
    if (selected.length === 0) return null
    const labels = selected.map((id) => optionLabel(question, id))
    return `${question.prompt}\n${labels.join(", ")}`
  })
    .filter(Boolean)
    .join("\n\n")
}
