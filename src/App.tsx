import { Routes, Route } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { CanvasEditorPage } from "@/pages/CanvasEditorPage"
import { ConfigureChargebeePage } from "@/pages/ConfigureChargebeePage"
import { CpqSettingsPage } from "@/pages/CpqSettingsPage"
import { PromptBuilderPage } from "@/pages/PromptBuilderPage"
import { QuotePdfTemplatesPage } from "@/pages/QuotePdfTemplatesPage"

export default function App() {
  return (
    <Routes>
      <Route path="templates/:templateId/build" element={<PromptBuilderPage />} />
      <Route element={<AppShell />}>
        <Route index element={<ConfigureChargebeePage />} />
        <Route path="cpq" element={<CpqSettingsPage />} />
        <Route path="templates">
          <Route index element={<QuotePdfTemplatesPage />} />
          <Route path=":templateId/edit" element={<CanvasEditorPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
