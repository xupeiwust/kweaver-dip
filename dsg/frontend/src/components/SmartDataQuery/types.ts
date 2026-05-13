export interface IAgentInfo {
    id: string
    version: string
    adp_agent_key: string
    adp_business_domain_id: string
}

export interface ISceneAgent {
    id: string
    key: string
    name: string
    business_domain_id?: string
    avatar?: string
    version?: string
}

export interface ISceneMoreDropdownProps {
    agents: ISceneAgent[]
    selectedKey?: string
    onSelect: (agent: ISceneAgent) => void
    onViewMore: () => void
}

export interface ISceneTagsRowProps {
    visibleSceneAgents: ISceneAgent[]
    overflowSceneAgents: ISceneAgent[]
    selectedSceneAgentKey?: string
    onSceneTagClick: (agent: ISceneAgent) => void
    onViewMore: () => void
    moreOpen: boolean
    setMoreOpen: (open: boolean) => void
}

export interface ICurrentAgent {
    id?: string
    version?: string
    name: string
    key: string
    business_domain_id: string
}

export interface IPresetQuestion {
    question: string
}
