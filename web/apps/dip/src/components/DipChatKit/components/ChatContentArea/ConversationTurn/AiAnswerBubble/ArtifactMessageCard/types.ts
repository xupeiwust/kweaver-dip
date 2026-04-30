export interface ArtifactMessageCardProps {
  fileName: string
  archiveRoot: string
  entryType?: 'file' | 'directory'
  onClick: () => void
}
