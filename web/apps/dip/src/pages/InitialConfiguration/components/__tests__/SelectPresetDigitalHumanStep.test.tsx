import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/apis/dip-studio/digital-human', () => ({
  getBuiltInDigitalHumanList: vi.fn().mockResolvedValue([
    {
      id: '__bkn_creator__',
      name: 'BKN Creator',
      description: 'built-in creator',
      created: false,
    },
    {
      id: '__data_analyst__',
      name: '数据分析员',
      description: 'built-in analyst',
      created: false,
    },
  ]),
  createBuiltInDigitalHuman: vi.fn().mockResolvedValue([]),
}))

import SelectPresetDigitalHumanStep from '../SelectPresetDigitalHumanStep'

describe('SelectPresetDigitalHumanStep', () => {
  it('renders every available built-in template instead of only the first one', async () => {
    render(<SelectPresetDigitalHumanStep onSkip={vi.fn()} onConfirmSuccess={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('BKN Creator')).toBeInTheDocument()
      expect(screen.getByText('数据分析员')).toBeInTheDocument()
    })
  })
})
