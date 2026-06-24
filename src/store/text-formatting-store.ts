import { create } from "zustand"

type TextFormattingStore = {
  activeEditor: HTMLElement | null
  isMultiline: boolean
  isFormattingActive: boolean
  toolbarRef: HTMLElement | null
  register: (editor: HTMLElement, isMultiline: boolean) => void
  unregister: (editor: HTMLElement) => void
  setToolbarRef: (node: HTMLElement | null) => void
}

export const useTextFormattingStore = create<TextFormattingStore>((set, get) => ({
  activeEditor: null,
  isMultiline: false,
  isFormattingActive: false,
  toolbarRef: null,
  register: (editor, isMultiline) => {
    set({ activeEditor: editor, isMultiline, isFormattingActive: true })
  },
  unregister: (editor) => {
    if (get().activeEditor === editor) {
      set({
        activeEditor: null,
        isMultiline: false,
        isFormattingActive: false,
      })
    }
  },
  setToolbarRef: (node) => set({ toolbarRef: node }),
}))
