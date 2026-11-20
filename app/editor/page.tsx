import { Suspense } from "react"

import { EditorLoader } from "@/components/editor/editor-loader"

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorLoader />
    </Suspense>
  )
}
