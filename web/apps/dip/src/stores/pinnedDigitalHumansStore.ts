import { message } from 'antd'
import intl from 'react-intl-universal'
import { create } from 'zustand'
import type { SidebarPinnedDigitalHuman } from '@/apis/dip-studio/user'
import {
  deleteSidebarPinnedDigitalHuman,
  getSidebarPinnedDigitalHumans,
  postSidebarPinnedDigitalHumans,
} from '@/apis/dip-studio/user/preferences'

/** 与服务端 pinned-digital-humans（参见 MAX_PINNED_DIGITAL_HUMANS）一致 */
export const MAX_PINNED_SIDEBAR_DIGITAL_HUMANS = 8

/** Studio POST pinned-digital-humans 超出上限时的业务错误码 */
const PINNED_DIGITAL_HUMAN_LIMIT_CODE = 'DipStudio.PinnedDigitalHumanLimit'

function resolvePinnedDigitalHumansApiMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const apiCode = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''
  if (apiCode === PINNED_DIGITAL_HUMAN_LIMIT_CODE) {
    return intl.get('sider.pinnedDigitalHumans.pinLimitReached', {
      max: MAX_PINNED_SIDEBAR_DIGITAL_HUMANS,
    })
  }
  if ('description' in error) {
    const raw = (error as { description?: unknown }).description
    const text = typeof raw === 'string' ? raw.trim() : ''
    return text || undefined
  }
  return undefined
}

/** 与微应用钉选域分离：Studio 侧栏数字员工钉选快照（见 issue #167） */
interface PinnedDigitalHumansState {
  pinnedDigitalHumans: SidebarPinnedDigitalHuman[]
  loading: boolean
  /** GET 在同一 token 下单飞，避免并行重复请求 */
  fetchSidebarPinnedDigitalHumans: () => Promise<void>
  pinSidebarDigitalHuman: (digitalHumanId: string) => Promise<boolean>
  unpinSidebarDigitalHuman: (digitalHumanId: string) => Promise<boolean>
  isPinned: (digitalHumanId: string) => boolean
  /** 清空本地快照（可选在登出等非整页跳转场景使用） */
  resetPinnedDigitalHumans: () => void
}

let fetchSidebarPinnedDigitalHumansPromise: Promise<void> | null = null

export const usePinnedDigitalHumansStore = create<PinnedDigitalHumansState>()((set, get) => ({
  pinnedDigitalHumans: [],
  loading: false,

  resetPinnedDigitalHumans: () => {
    set({ pinnedDigitalHumans: [], loading: false })
  },

  fetchSidebarPinnedDigitalHumans: async () => {
    if (fetchSidebarPinnedDigitalHumansPromise) {
      return fetchSidebarPinnedDigitalHumansPromise
    }

    fetchSidebarPinnedDigitalHumansPromise = (async () => {
      set({ loading: true })
      try {
        const body = await getSidebarPinnedDigitalHumans()
        set({
          pinnedDigitalHumans: body.pinned_digital_humans ?? [],
          loading: false,
        })
      } catch {
        set({ loading: false })
      } finally {
        fetchSidebarPinnedDigitalHumansPromise = null
      }
    })()

    return fetchSidebarPinnedDigitalHumansPromise
  },

  pinSidebarDigitalHuman: async (digitalHumanId: string) => {
    try {
      const body = await postSidebarPinnedDigitalHumans({
        pinned_digital_human_id: digitalHumanId,
      })
      set({ pinnedDigitalHumans: body.pinned_digital_humans ?? [] })
      message.success(intl.get('sider.pinnedDigitalHumans.pinSuccess'))
      return true
    } catch (error: unknown) {
      const text = resolvePinnedDigitalHumansApiMessage(error)
      if (text) {
        message.error(text)
      }
      return false
    }
  },

  unpinSidebarDigitalHuman: async (digitalHumanId: string) => {
    try {
      const body = await deleteSidebarPinnedDigitalHuman(digitalHumanId)
      set({ pinnedDigitalHumans: body.pinned_digital_humans ?? [] })
      message.success(intl.get('sider.pinnedDigitalHumans.unpinSuccess'))
      return true
    } catch (error: unknown) {
      const text = resolvePinnedDigitalHumansApiMessage(error)
      if (text) {
        message.error(text)
      }
      return false
    }
  },

  isPinned: (digitalHumanId: string) => {
    return get().pinnedDigitalHumans.some((row) => row.id === digitalHumanId)
  },
}))
