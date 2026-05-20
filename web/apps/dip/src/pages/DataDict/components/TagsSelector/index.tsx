import React, { useState, useEffect } from 'react'
import { Select, message } from 'antd'
import intl from 'react-intl-universal'
import { getObjectTags } from '@/apis/mdl-data-model'

const TagsSelector: React.FC<any> = (props: any) => {
  const [tagsData, setTagsData] = useState<Array<{ tag: string; count: number }>>([]) // 从标签管理服务中get到的tags数据

  useEffect(() => {
    const getAllTags = async (): Promise<void> => {
      try {
        const params = {
          sort: 'tag', // 根据标签名排序
          direction: 'asc', // 升序
          limit: -1, // 不分页，返回所有标签
        }

        const { entries } = await getObjectTags(params as any)
        setTagsData(entries)
      } catch (ex: any) {
        if (ex.description) {
          message.error(ex.description)
        }
      }
    }

    // 如果是老模块，则不接入新标签管理服务，下拉列表为空
    if (!props.isOld) getAllTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (val: Array<string>): void => {
    // val：组件接收到的用户输入的值
    // newVal：经过处理后的值，传递给外部onChange事件（props.onChange）
    // 外部validator接收到的value即为此处的newVal
    const newVal = val
      .map((i) => i.trim()) // 标签前后不能有空格
      .filter((i) => i) // 标签不能为空字符串
      .sort() // 排序

    if (props.onChange) {
      props.onChange(newVal)
    }
  }

  return (
    <Select
      mode="tags"
      value={props.value} // 组件展示的value，为外部传入的value，即props.onChange接收到的value
      onChange={handleChange}
      placeholder={props.placeholder ?? intl.get('dataDict.addTags')} // placeholder可选，若外部不传入，则为“添加标签”
      allowClear
      style={{ width: '100%' }}
    >
      {tagsData &&
        tagsData.map((item) => (
          <Select.Option value={item.tag} key={item.tag}>
            {item.tag}
          </Select.Option>
        ))}
    </Select>
  )
}

export default TagsSelector

export const tagsSelectorValidator = (rule, value: Array<string> | undefined, callback): void => {
  if (value && value.length > 5) {
    callback(intl.get('dataDict.tagQuantityLimitInfo'))
  }

  if (value && value.length) {
    // 正则规则：标签不能包含 /:?\\\"<>|：？‘’“”！《》,#[]{}%&*$^!=.' 字符
    const regex = /^[^/:?\\"<>|：?“”？！‘’,.'《》[\]%&*$^!=#{}]*$/

    value.forEach((tag) => {
      if (tag.length > 40) callback(intl.get('dataDict.tagLengthLimitInfo'))
      if (!regex.test(tag)) callback(intl.get('dataDict.tagParticularCharacter'))
    })
  }

  callback()
}
