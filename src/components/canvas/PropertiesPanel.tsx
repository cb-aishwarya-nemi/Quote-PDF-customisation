import { getBlockLabel } from "@/lib/block-catalog"
import { useCanvasStore } from "@/store/canvas-store"
import type { Block } from "@/types/template"
import { X } from "lucide-react"

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span className="text-[13px] text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  )
}

function BlockProperties({ block }: { block: Block }) {
  const updateBlockLayout = useCanvasStore((s) => s.updateBlockLayout)
  const updateBlockContent = useCanvasStore((s) => s.updateBlockContent)
  const setSelectedBlockId = useCanvasStore((s) => s.setSelectedBlockId)

  const c = block.content

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-gray-900">
            {getBlockLabel(block.type)}
          </p>
          <p className="text-[11px] text-gray-500">Block properties</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedBlockId(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close properties"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <section className="mb-6">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Layout
          </h3>
          <label className="block">
            <span className="text-[12px] text-gray-600">Top padding</span>
            <input
              type="range"
              min={0}
              max={48}
              step={4}
              value={block.layout.topPadding}
              onChange={(e) =>
                updateBlockLayout(block.id, {
                  topPadding: Number(e.target.value),
                })
              }
              className="mt-1 w-full accent-blue-600"
            />
            <span className="text-[11px] text-gray-400">
              {block.layout.topPadding}px
            </span>
          </label>
          <ToggleRow
            label="Show border"
            checked={block.layout.showBorder}
            onChange={(showBorder) =>
              updateBlockLayout(block.id, { showBorder })
            }
          />
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Content
          </h3>
          {block.type === "header" && (
            <>
              <ToggleRow
                label="Show quote number"
                checked={!!c.showQuoteNumber}
                onChange={(v) =>
                  updateBlockContent(block.id, { showQuoteNumber: v })
                }
              />
              <ToggleRow
                label="Show date"
                checked={!!c.showDate}
                onChange={(v) => updateBlockContent(block.id, { showDate: v })}
              />
              <ToggleRow
                label="Show valid until"
                checked={!!c.showValidUntil}
                onChange={(v) =>
                  updateBlockContent(block.id, { showValidUntil: v })
                }
              />
            </>
          )}
          {block.type === "pricing" && (
            <>
              <label className="mb-3 block">
                <span className="text-[12px] text-gray-600">Section label</span>
                <input
                  type="text"
                  value={(c.labelOverride as string) ?? ""}
                  onChange={(e) =>
                    updateBlockContent(block.id, {
                      labelOverride: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <ToggleRow
                label="Show subtotal"
                checked={!!c.showSubtotal}
                onChange={(v) =>
                  updateBlockContent(block.id, { showSubtotal: v })
                }
              />
              <ToggleRow
                label="Show discounts"
                checked={!!c.showDiscounts}
                onChange={(v) =>
                  updateBlockContent(block.id, { showDiscounts: v })
                }
              />
            </>
          )}
          {block.type === "tcv_billing" && (
            <>
              <ToggleRow
                label="Show TCV"
                checked={!!c.showTCV}
                onChange={(v) => updateBlockContent(block.id, { showTCV: v })}
              />
              <ToggleRow
                label="Show ACV"
                checked={!!c.showACV}
                onChange={(v) => updateBlockContent(block.id, { showACV: v })}
              />
              <label className="mt-3 block">
                <span className="text-[12px] text-gray-600">TCV placement</span>
                <select
                  value={(c.tcvPlacement as string) ?? "bottom"}
                  onChange={(e) =>
                    updateBlockContent(block.id, {
                      tcvPlacement: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px]"
                >
                  <option value="bottom">Bottom</option>
                  <option value="top">Top</option>
                </select>
              </label>
            </>
          )}
          {block.type === "terms" && (
            <label className="block">
              <span className="text-[12px] text-gray-600">Terms text</span>
              <textarea
                rows={5}
                value={(c.text as string) ?? ""}
                onChange={(e) =>
                  updateBlockContent(block.id, { text: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-2 text-[13px] leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-2 text-[11px] text-gray-400">
                Open the rule builder to add conditional spans.
              </p>
            </label>
          )}
          {!["header", "pricing", "tcv_billing", "terms"].includes(
            block.type,
          ) && (
            <p className="text-[12px] text-gray-500">
              Display options for this block use default quote data at render
              time.
            </p>
          )}
        </section>
      </div>
    </>
  )
}

export function PropertiesPanel() {
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId)
  const blocks = useCanvasStore((s) => s.template?.blocks ?? [])
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)
  const open = !!selectedBlock

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white transition-[width,opacity] duration-200 ease-out ${
        open ? "w-[280px] opacity-100" : "w-0 border-l-0 opacity-0"
      }`}
    >
      {selectedBlock ? <BlockProperties block={selectedBlock} /> : null}
    </aside>
  )
}
