import type {
  GuideInitializeRequest,
  GuideInitializeResponse,
  GuideStatusResponse,
  OpenClawDetectedConfig,
} from './index.d'

/**
 * 为初始化引导页提供本地 Mock 数据。
 * 设为 true 后，前端将不请求后端接口，直接返回模拟结果。
 */
export const GUIDE_USE_MOCK = false

const MOCK_DELAY_MS = 450

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockGetGuideStatus(): Promise<GuideStatusResponse> {
  await wait(MOCK_DELAY_MS)

  return {
    state: 'pending',
    ready: false,
    missing: [
      'envFile',
      'gatewayProtocol',
      'gatewayHost',
      'gatewayPort',
      'gatewayToken',
      'workspaceDir',
      'privateKey',
      'publicKey',
    ],
  }
}

export async function mockGetOpenClawDetectedConfig(): Promise<OpenClawDetectedConfig> {
  await wait(MOCK_DELAY_MS)

  return {
    openclaw_address: 'ws://127.0.0.1:19001',
    openclaw_token: 'mock-token-please-change',
    kweaver_base_url: 'http://bkn-backend-svc:13014',
  }
}

export async function mockInitializeGuide(
  body: GuideInitializeRequest,
): Promise<GuideInitializeResponse> {
  await wait(MOCK_DELAY_MS)

  const openclawAddress = body.openclaw_address?.trim()
  const openclawToken = body.openclaw_token?.trim()

  // 简单校验：避免用户误点导致“看起来成功但其实没做事”
  if (!openclawAddress) {
    throw new Error('Mock 初始化失败：openclaw_address 不能为空')
  }

  if (!openclawToken) {
    throw new Error('Mock 初始化失败：gateway token 不能为空')
  }

  const workspaceDir = '~/.openclaw-dev'

  return {
    initialized: true,
    state: 'ready',
    envFilePath: `${workspaceDir}/.env`,
    assetsDir: `${workspaceDir}/assets`,
    configPath: `${workspaceDir}/openclaw.json`,
    stateDir: `${workspaceDir}/state`,
    workspaceDir,
  } satisfies GuideInitializeResponse
}
