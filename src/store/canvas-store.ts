import { createBlock } from "@/lib/block-catalog"
import type { Block, BlockType, Template } from "@/types/template"
import { create } from "zustand"

type CanvasStore = {
  template: Template | null
  selectedBlockId: string | null
  initTemplate: (template: Template) => void
  setTemplateName: (name: string) => void
  setSelectedBlockId: (id: string | null) => void
  addBlock: (type: BlockType, atIndex?: number) => void
  removeBlock: (id: string) => void
  reorderBlocks: (from: number, to: number) => void
  updateBlockLayout: (
    id: string,
    layout: Partial<Block["layout"]>,
  ) => void
  updateBlockContent: (
    id: string,
    content: Record<string, unknown>,
  ) => void
  saveAsDraft: () => void
  publish: () => void
}

function normalizeOrders(blocks: Block[]): Block[] {
  return blocks.map((b, i) => ({ ...b, order: i }))
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  template: null,
  selectedBlockId: null,

  initTemplate: (template) =>
    set({ template, selectedBlockId: null }),

  setTemplateName: (name) =>
    set((s) =>
      s.template
        ? {
            template: {
              ...s.template,
              name,
              updatedAt: new Date().toISOString(),
            },
          }
        : s,
    ),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  addBlock: (type, atIndex) => {
    const { template } = get()
    if (!template) return
    const blocks = [...template.blocks]
    const insertAt =
      atIndex === undefined ? blocks.length : Math.max(0, atIndex)
    const newBlock = createBlock(type, insertAt)
    blocks.splice(insertAt, 0, newBlock)
    set({
      template: {
        ...template,
        blocks: normalizeOrders(blocks),
        updatedAt: new Date().toISOString(),
      },
      selectedBlockId: newBlock.id,
    })
  },

  removeBlock: (id) =>
    set((s) => {
      if (!s.template) return s
      const blocks = normalizeOrders(
        s.template.blocks.filter((b) => b.id !== id),
      )
      return {
        template: {
          ...s.template,
          blocks,
          updatedAt: new Date().toISOString(),
        },
        selectedBlockId:
          s.selectedBlockId === id ? null : s.selectedBlockId,
      }
    }),

  reorderBlocks: (from, to) =>
    set((s) => {
      if (!s.template) return s
      const blocks = [...s.template.blocks]
      const [moved] = blocks.splice(from, 1)
      blocks.splice(to, 0, moved)
      return {
        template: {
          ...s.template,
          blocks: normalizeOrders(blocks),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  updateBlockLayout: (id, layout) =>
    set((s) => {
      if (!s.template) return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) =>
            b.id === id ? { ...b, layout: { ...b.layout, ...layout } } : b,
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  updateBlockContent: (id, content) =>
    set((s) => {
      if (!s.template) return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) =>
            b.id === id
              ? { ...b, content: { ...b.content, ...content } }
              : b,
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  saveAsDraft: () =>
    set((s) =>
      s.template
        ? {
            template: {
              ...s.template,
              status: "draft",
              updatedAt: new Date().toISOString(),
            },
          }
        : s,
    ),

  publish: () =>
    set((s) =>
      s.template
        ? {
            template: {
              ...s.template,
              status: "published",
              updatedAt: new Date().toISOString(),
            },
          }
        : s,
    ),
}))
