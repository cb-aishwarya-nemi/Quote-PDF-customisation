import { findPreviewCustomer } from "@/data/preview-customers"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

export function useActivePreviewCustomer() {
  const customerId = usePromptBuilderStore((s) => s.activePreviewCustomerId)
  return findPreviewCustomer(customerId)
}

export function useIsViewingCustomerPreview() {
  return usePromptBuilderStore((s) => s.activePreviewCustomerId != null)
}
