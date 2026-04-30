import { Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import archiveDirectoryCardIcon from '../../../../../images/archive_directory_card.png'
import archiveGridIcon from '../../../../../images/archive_grid.png'
import styles from './index.module.less'
import type { ArtifactMessageCardProps } from './types'

const ArtifactMessageCard: React.FC<ArtifactMessageCardProps> = ({
  fileName,
  archiveRoot,
  entryType = 'file',
  onClick,
}) => {
  const resolvedFileName = fileName.trim() || '-'
  const resolvedArchiveRoot = archiveRoot.trim() || '-'
  const cardIcon = entryType === 'directory' ? archiveDirectoryCardIcon : archiveGridIcon

  return (
    <button type="button" className={clsx('ArtifactMessageCard', styles.root)} onClick={onClick}>
      <div className={styles.left}>
        <Tooltip title={resolvedFileName}>
          <span className={clsx(styles.line, styles.fileName)}>{resolvedFileName}</span>
        </Tooltip>
        <Tooltip title={resolvedArchiveRoot}>
          <span className={clsx(styles.line, styles.archiveRoot)}>{resolvedArchiveRoot}</span>
        </Tooltip>
      </div>
      <span className={styles.right}>
        <img src={cardIcon} alt="" aria-hidden className={styles.icon} />
      </span>
    </button>
  )
}

export default ArtifactMessageCard
