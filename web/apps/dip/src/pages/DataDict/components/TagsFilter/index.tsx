import React, { useState, useEffect } from 'react'
import { Select, message } from 'antd'
import intl from 'react-intl-universal'
import { getObjectTags } from '@/apis/mdl-data-model'

interface PropsType {
  module: string // 当前模块名称
  placeholder?: string
  className?: string
  onChange: (val: string) => void
}

const TagsFilter: React.FC<PropsType> = (props: PropsType) => {
  const [tagsData, setTagsData] = useState<{ tag: string; count: number }[]>([]) // 从标签管理服务中get到的tags数据

  useEffect(() => {
    // 从标签管理服务中get当前模块已经使用过的tag
    const getMetricModelTags = async (): Promise<void> => {
      try {
        const params = {
          sort: 'tag',
          direction: 'asc',
          limit: -1,
          module: props.module, // 当前模块名称
        }
        const res = await getObjectTags(params as any)

        setTagsData(res.entries)
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description)
        }
      }
    }

    getMetricModelTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Select
      showSearch
      placeholder={props.placeholder ?? intl.get('dataDict.allTags')}
      className={props.className}
      onChange={props.onChange}
      style={{ width: '200px' }}
    >
      <Select.Option value={''}>{intl.get('dataDict.allTags')}</Select.Option>
      {tagsData &&
        tagsData.map((item) => (
          <Select.Option value={item.tag} key={item.tag}>
            {item.tag}
          </Select.Option>
        ))}
    </Select>
  )
}

export default TagsFilter
