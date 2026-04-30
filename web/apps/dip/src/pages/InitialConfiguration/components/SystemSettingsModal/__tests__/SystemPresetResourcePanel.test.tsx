import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/apis/dip-studio/digital-human', () => ({
  getBuiltInDigitalHumanList: vi.fn().mockResolvedValue([
    {
      id: '__bkn_creator__',
      name: 'BKN Creator',
      description: 'built-in creator',
      created: true,
    },
    {
      id: '__data_analyst__',
      name: '数据分析员',
      description: 'built-in analyst',
      created: false,
    },
  ]),
  getDigitalHumanList: vi.fn().mockResolvedValue([]),
  createBuiltInDigitalHuman: vi.fn().mockResolvedValue([]),
}))

import SystemPresetResourcePanel from '../SystemPresetResourcePanel'

describe('SystemPresetResourcePanel', () => {
  it('renders all built-in digital human templates from the API list', async () => {
    render(<SystemPresetResourcePanel onConfirmSuccess={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('BKN Creator')).toBeInTheDocument()
      expect(screen.getByText('数据分析员')).toBeInTheDocument()
    })

    expect(screen.getByText('initialConfiguration.selectPreset.installed')).toBeInTheDocument()
    expect(screen.getByText('initialConfiguration.selectPreset.installNow')).toBeInTheDocument()
  })
})
