import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PreviewArtifact from '..'
import { getSessionArchiveSubpath } from '../../../../apis'
import type { DipChatKitPreviewPayload } from '../../../../types'

vi.mock('../../../../apis', () => ({
  getSessionArchiveSubpath: vi.fn(),
}))

vi.mock('react-intl-universal', () => ({
  default: {
    get: (_key: string) => ({
      d: (fallback: string) => fallback,
    }),
  },
}))

const mockedGetSessionArchiveSubpath = vi.mocked(getSessionArchiveSubpath)

const baseProps = {
  onClose: vi.fn(),
  fullscreen: false,
  onToggleFullscreen: vi.fn(),
}

const renderPreviewArtifact = (payload: DipChatKitPreviewPayload) =>
  render(<PreviewArtifact {...baseProps} payload={payload} />)

describe('PreviewArtifact', () => {
  it('loads directory entries via json and keeps the list visible while previewing a file', async () => {
    mockedGetSessionArchiveSubpath.mockResolvedValueOnce({
      path: '2026-03-25-03-04-05/output',
      contents: [
        { name: 'reports', type: 'directory' },
        { name: 'summary.md', type: 'file' },
      ],
    })
    mockedGetSessionArchiveSubpath.mockResolvedValueOnce('# summary')

    renderPreviewArtifact({
      title: '目录预览：output',
      content: '2026-03-25-03-04-05/output',
      sourceType: 'artifact',
      artifact: {
        sessionKey: 'session-1',
        subpath: '2026-03-25-03-04-05/output',
        fileName: 'output',
        archiveRoot: 'archives/chat-1',
        entryType: 'directory',
      },
    })

    await waitFor(() => {
      expect(mockedGetSessionArchiveSubpath).toHaveBeenCalledWith(
        'session-1',
        '2026-03-25-03-04-05/output',
        { responseType: 'json' },
      )
    })

    expect(await screen.findByText('reports')).toBeInTheDocument()
    expect(screen.getByText('summary.md')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetSessionArchiveSubpath).toHaveBeenLastCalledWith(
        'session-1',
        '2026-03-25-03-04-05/output/summary.md',
        { responseType: 'text' },
      )
    })

    expect(await screen.findByRole('heading', { name: 'summary' })).toBeInTheDocument()
    expect(screen.getByText('reports')).toBeInTheDocument()
    expect(screen.getAllByText('summary.md')).not.toHaveLength(0)
  })
})
