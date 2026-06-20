import type { ConditionOperator } from "@/types/prompt-builder"

export type ConditionValueOption = {
  value: string
  label: string
}

export type ConditionFieldDef = {
  field: string
  label: string
  operators: ConditionOperator[]
  values: ConditionValueOption[]
  allowCustomValue?: boolean
}

export const CONDITION_FIELDS: ConditionFieldDef[] = [
  {
    field: "deal_type",
    label: "Deal type",
    operators: ["is", "is_not"],
    values: [
      { value: "new_business", label: "New business" },
      { value: "expansion", label: "Expansion" },
      { value: "amendment", label: "Amendment" },
      { value: "termination", label: "Termination" },
    ],
  },
  {
    field: "customer_region",
    label: "Region",
    operators: ["is", "is_not"],
    values: [
      { value: "EU", label: "EU" },
      { value: "US", label: "United States" },
      { value: "DE", label: "Germany" },
      { value: "APAC", label: "APAC" },
    ],
  },
  {
    field: "item_type",
    label: "Item type",
    operators: ["is", "is_not"],
    values: [
      { value: "software", label: "Software" },
      { value: "service", label: "Service" },
      { value: "usage", label: "Usage" },
      { value: "support", label: "Support" },
      { value: "addon", label: "Add-on" },
    ],
  },
  {
    field: "item_name",
    label: "Item name",
    operators: ["is", "is_not", "contains"],
    values: [
      { value: "Enterprise Platform", label: "Enterprise Platform" },
      { value: "Premium Support", label: "Premium Support" },
      { value: "Implementation services", label: "Implementation services" },
    ],
    allowCustomValue: true,
  },
  {
    field: "metered",
    label: "Metered",
    operators: ["is"],
    values: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
  },
  {
    field: "quantity",
    label: "Quantity",
    operators: ["is", "is_not"],
    values: [
      { value: "1", label: "1" },
      { value: "5", label: "5" },
      { value: "10+", label: "10+" },
      { value: "100+", label: "100+" },
    ],
    allowCustomValue: true,
  },
  {
    field: "frequency",
    label: "Frequency",
    operators: ["is", "is_not"],
    values: [
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" },
      { value: "annual", label: "Annual" },
      { value: "one_time", label: "One-time" },
    ],
  },
  {
    field: "payment_terms",
    label: "Payment terms",
    operators: ["is", "is_not"],
    values: [
      { value: "Net-30", label: "Net-30" },
      { value: "Net-60", label: "Net-60" },
      { value: "Prepaid", label: "Prepaid" },
      { value: "Due on receipt", label: "Due on receipt" },
    ],
  },
]

export function getConditionField(field: string): ConditionFieldDef | undefined {
  return CONDITION_FIELDS.find((f) => f.field === field)
}

export function getConditionValueLabel(
  field: string,
  value: string,
  fallbackLabel?: string,
): string {
  if (fallbackLabel) return fallbackLabel
  const def = getConditionField(field)
  return def?.values.find((v) => v.value === value)?.label ?? value
}

export function operatorLabel(operator: ConditionOperator): string {
  switch (operator) {
    case "is":
      return "is"
    case "is_not":
      return "is not"
    case "contains":
      return "contains"
    default:
      return operator
  }
}

export function createDefaultRule(
  fieldKey = CONDITION_FIELDS[0]?.field ?? "customer_region",
): {
  field: string
  operator: ConditionOperator
  value: string
  label: string
} {
  const def = getConditionField(fieldKey) ?? CONDITION_FIELDS[0]
  const firstValue = def.values[0]
  return {
    field: def.field,
    operator: def.operators[0],
    value: firstValue?.value ?? "",
    label: firstValue?.label ?? "",
  }
}
