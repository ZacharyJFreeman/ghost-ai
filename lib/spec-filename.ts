// `ProjectSpec` has no filename column, so the name is derived from the spec ID
// (the blob is stored as `{specId}.md`). One place, so the list and the download
// route always agree on what a spec file is called.
export function specFilename(specId: string): string {
  return `spec-${specId}.md`
}
