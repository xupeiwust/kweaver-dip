import { useState, useEffect, type ReactNode } from 'react'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import styles from './index.module.less'

interface Props {
  title: string
  children: JSX.Element | Array<JSX.Element>
  isOpen?: boolean
  deleteDom?: ReactNode // 右边删除dom
  childrenErrorCount?: number // 子节点存在错误的次数
  className?: string
}

/**
 * 表单折叠面板
 *
 * @param {*} props
 * @return {*}  {JSX.Element}
 */
const CollapseCard = (props: Props): JSX.Element => {
  const { title, children, isOpen, deleteDom, childrenErrorCount, className } = props

  const [open, setOpen] = useState(true)

  useEffect(() => {
    childrenErrorCount !== 0 && childrenErrorCount !== undefined && setOpen(true)
  }, [childrenErrorCount])

  useEffect(() => {
    isOpen !== undefined && setOpen(isOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`${styles['form-fold']} ar-form-fold ${className}`}>
      <div className={styles.contianer}>
        <div
          className={`${styles['form-fold-label']} ar-form-fold-label`}
          onClick={(): void => {
            setOpen(!open)
          }}
        >
          {open ? <CaretDownOutlined /> : <CaretRightOutlined />}
          <strong className={styles.text}>{title}</strong>
        </div>
        <div>{deleteDom}</div>
      </div>
      <div className={open ? '' : styles.hidden}>{children}</div>
    </div>
  )
}

export default CollapseCard
