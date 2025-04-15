'use client'

import { RedocStandalone } from 'redoc'

export default function DocsPage() {
  return (
    <RedocStandalone
      specUrl="/openapi.yaml"
      options={{
        theme: { colors: { primary: { main: '#0D6EFD' } } },
        hideDownloadButton: false,
        hideHostname: true,
      }}
    />
  )
}
