import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DipChatKitMessageTurn, DipChatKitPreviewPayload } from '../../../../../../types'
import AiAnswerBubble from '../index'

vi.mock('react-intl-universal', () => ({
  default: {
    get: (_key: string, vars?: Record<string, unknown>) => ({
      d: (fallback: string) => {
        if (!vars) return fallback
        return Object.entries(vars).reduce(
          (text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value)),
          fallback,
        )
      },
    }),
  },
}))

const createTurn = (): DipChatKitMessageTurn => ({
  id: 'turn-1',
  sessionKey: 'session-1',
  question: 'q',
  questionAttachments: [],
  answerMarkdown: '归档完成',
  answerEvents: [
    {
      id: 'archive-event-1',
      type: 'toolCall',
      role: 'assistant',
      text: '',
      resultText:
        '```json\n{"type":"archive_grid","data":{"type":"directory","archive_root":"archives/chat-1","subpath":"2026-03-25-03-04-05/output","name":"output"}}\n```',
      toolName: 'archive',
      toolCallId: 'archive-tool-1',
      details: { status: 'completed' },
    },
  ],
  answerTimeline: [],
  answerLoading: false,
  answerStreaming: false,
  createdAt: '2026-04-30T00:00:00Z',
})

describe('AiAnswerBubble archive artifacts from answerEvents', () => {
  it('renders final archive cards from tool result events and opens preview on click', () => {
    const onOpenPreview = vi.fn<(payload: DipChatKitPreviewPayload) => void>()

    render(
      <AiAnswerBubble
        turn={createTurn()}
        isLatestAnswerTurn
        onCopy={vi.fn()}
        onRegenerate={vi.fn()}
        onOpenPreview={onOpenPreview}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /output/i }))

    expect(onOpenPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'artifact',
        artifact: expect.objectContaining({
          entryType: 'directory',
          archiveRoot: 'archives/chat-1',
          subpath: '2026-03-25-03-04-05/output',
        }),
      }),
    )
  })
})
