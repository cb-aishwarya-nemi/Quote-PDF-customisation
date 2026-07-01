import { Routes, Route } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { CanvasEditorPage } from "@/pages/CanvasEditorPage"
import { ConfigureChargebeePage } from "@/pages/ConfigureChargebeePage"
import { CpqSettingsPage } from "@/pages/CpqSettingsPage"
import { PromptBuilderPage } from "@/pages/PromptBuilderPage"
import { CreateQuotePage } from "@/pages/CreateQuotePage"
import { QuotePdfTemplatesPage } from "@/pages/QuotePdfTemplatesPage"
import { QuotePdfPreviewPage } from "@/pages/QuotePdfPreviewPage"
import { PdfMappingViewerPage } from "@/pages/PdfMappingViewerPage"
import { QuotesListPage } from "@/pages/QuotesListPage"

export default function App() {
  return (
    <Routes>
      <Route path="templates/:templateId/build" element={<PromptBuilderPage />} />
      <Route path="quotes/preview" element={<QuotePdfPreviewPage />} />
      <Route path="pdf-mapping/view" element={<PdfMappingViewerPage />} />
      <Route element={<AppShell />}>
        <Route index element={<ConfigureChargebeePage />} />
        <Route path="cpq" element={<CpqSettingsPage />} />
        <Route path="quotes" element={<QuotesListPage />} />
        <Route path="quotes/new" element={<CreateQuotePage />} />
        <Route path="templates">
          <Route index element={<QuotePdfTemplatesPage />} />
          <Route path=":templateId/edit" element={<CanvasEditorPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
