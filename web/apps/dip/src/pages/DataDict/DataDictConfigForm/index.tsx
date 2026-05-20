import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Divider, Select, Switch, Modal, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import intl from 'react-intl-universal'
import {
  getDataDictInfo as getDataDictInfoReq,
  createDataDict,
  editDataDict,
} from '@/apis/mdl-data-model'
import IconFont from '@/components/IconFont'
import CollapseCard from '../components/CollapseCard'
import Back from '../components/Back'
import TagsSelector, { tagsSelectorValidator } from '../components/TagsSelector'
import styles from './index.module.less'

const TraceModelConfigForm: React.FC<any> = (props) => {
  const navigate = useNavigate()
  const { isNew } = props
  const { id: urlTail } = useParams()
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const [dictType, setDictType] = useState<string>()
  // 用于遍历生成 维度键 字段中的FormItem
  const [dimensionKeyFormItemKeys, setDimensionKeyFormItemKeys] = useState<Array<number>>([0])
  // 用于遍历生成 维度属性 字段中的FormItem
  const [dimensionValueFormItemKeys, setDimensionValueFormItemKeys] = useState<Array<number>>([0])
  const [existingDimension, setExistingDimension] = useState<{
    keys: Array<{ id: string; name: string }>
    values: Array<{ id: string; name: string }>
  }>()
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    const getDataDictInfo = async (): Promise<void> => {
      try {
        const infos = await getDataDictInfoReq(urlTail as string)
        const dictInfo = infos[0] ?? {}
        const res = {
          name: dictInfo.name,
          type: dictInfo.type?.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()),
          tags: dictInfo.tags,
          comment: dictInfo.comment,
          uniqueKey: dictInfo.unique_key,
          dimension: {
            keys: dictInfo.dimension?.keys,
            values: dictInfo.dimension?.values,
          },
          updateTime: dictInfo.update_time,
        }

        setFieldsValue(res)
        setDictType(res.type)

        if (res.type === 'dimensionDict') {
          setExistingDimension(res.dimension)

          // 编辑时，设置维度键FormItem的keys数组，用于生成多个维度键FormItem
          const dimensionKeyFormItemKeys: Array<number> = []

          for (let i = 0; i < res.dimension.keys.length; i++) {
            dimensionKeyFormItemKeys.push(i)
          }
          setDimensionKeyFormItemKeys(dimensionKeyFormItemKeys)

          // 编辑时，设置维度属性FormItem的keys数组，用于生成多个维度属性FormItem
          const dimensionValueFormItemKeys: Array<number> = []

          for (let i = 0; i < res.dimension.values.length; i++) {
            dimensionValueFormItemKeys.push(i)
          }
          setDimensionValueFormItemKeys(dimensionValueFormItemKeys)

          setFieldsValue({
            dimensionKeys: res.dimension.keys.map((item) => item.name),
            dimensionValues: res.dimension.values.map((item) => item.name),
          })
        }
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description)
        }
      }
    }

    if (!isNew) getDataDictInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e): void => {
    e.preventDefault()
    setIsDuplicate(false)

    try {
      const values = await form.validateFields()
      const hasDuplicates = (array: Array<string>): boolean => {
        const newArr = array.filter((i) => i) // 去除数组中的undefined

        return new Set(newArr).size !== newArr.length
      }

      if (
        values.type === 'dimensionDict' &&
        hasDuplicates([...values.dimensionKeys, ...values.dimensionValues])
      ) {
        setIsDuplicate(true)

        return
      }

      const data: any = {
        name: values.name,
        tags: values.tags,
        comment: values.comment,
        type: isNew ? values.type.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() : undefined,
        unique_key: !!values.uniqueKey,
        dimension:
          values.type === 'dimensionDict'
            ? {
                keys: values.dimensionKeys
                  .map((item: string, index: number) => ({
                    name: item,
                    id: existingDimension?.keys[index]?.id ?? '',
                  }))
                  .filter((i) => i), // 用于移除数组中的empty项
                values: values.dimensionValues
                  .map((item: string, index: number) => ({
                    name: item,
                    id: existingDimension?.values[index]?.id ?? '',
                  }))
                  .filter((i) => i), // 用于移除数组中的empty项
              }
            : (undefined as any),
      }

      if (isNew) {
        try {
          await createDataDict([data])
          goBack()
        } catch (ex) {
          if (ex.description) {
            message.error(ex.description)
          }
        }
      } else {
        Modal.confirm({
          centered: true,
          content: intl.get('dataDict.modifyDataConfirm'),
          getContainer: () => document.getElementById('dataManagerRoot') as HTMLElement, // 指定挂载节点
          icon: <IconFont type="icon-about" />,
          onOk: async () => {
            try {
              await editDataDict(urlTail as string, data)
              goBack()
            } catch (ex) {
              if (ex.description) {
                message.error(ex.description)
              }
            }
          },
          footer: (_, { OkBtn, CancelBtn }) => (
            <>
              <OkBtn />
              <CancelBtn />
            </>
          ),
        })
      }
    } catch (err) {}
  }

  // 自定义 validator
  const dimensionFormItemValidator = (rule, value: string, callback): void => {
    if (value === 'id' || value === 'comment') {
      callback(intl.get('dataDict.currentNotIdOrComment'))
    }

    // 正则规则校验是否只包含中文、英文大小写、数字、下划线（_）和短横线（-）
    const regex = /^[\u4e00-\u9fa5A-Za-z0-9_-]+$/ // \u4e00-\u9fa5 匹配任何一个中文字符

    if (value && !regex.test(value)) {
      callback(intl.get('dataDict.dimensionFormItemRegularRule'))
    }

    callback()
  }

  const dimensionKeyFormItems = dimensionKeyFormItemKeys.map((k: number) => (
    <div className={styles['dimension-form-item']} key={k}>
      <div>
        <Form.Item
          key={k}
          name={['dimensionKeys', k]}
          rules={[
            {
              required: dictType === 'dimensionDict',
              message: intl.get('dataDict.dimensionKeyNotEmpty'),
            },
            {
              max: 40,
              message: intl.get('dataDict.dimensionKeyMaximumCharacterLimit0'),
            },
            { validator: dimensionFormItemValidator },
          ]}
        >
          <Input placeholder={intl.get('dataDict.pleaseInput')} className={styles['input-box']} />
        </Form.Item>
      </div>
      {dimensionKeyFormItemKeys.length > 1 ? (
        // 删除按钮
        <div
          className={styles['delete-button']}
          onClick={(): void => {
            Modal.confirm({
              centered: true,
              content: intl.get('dataDict.deleteDataConfirm'),
              getContainer: () => document.getElementById('dataManagerRoot') as HTMLElement, // 指定挂载节点
              icon: <IconFont type="icon-about" />,
              onOk: async () => {
                if (dimensionKeyFormItemKeys.length === 1) {
                  return
                }
                setDimensionKeyFormItemKeys(dimensionKeyFormItemKeys.filter((key) => key !== k))
              },
              footer: (_, { OkBtn, CancelBtn }) => (
                <>
                  <OkBtn />
                  <CancelBtn />
                </>
              ),
            })
          }}
        >
          <IconFont type="icon-trash" />
        </div>
      ) : null}
    </div>
  ))

  const dimensionValueFormItems = dimensionValueFormItemKeys.map((k: number) => (
    <div className={styles['dimension-form-item']} key={k}>
      <div>
        <Form.Item
          key={k}
          name={['dimensionValues', k]}
          rules={[
            {
              required: dictType === 'dimensionDict',
              message: intl.get('dataDict.dimensionValueNotEmpty'),
            },
            {
              max: 40,
              message: intl.get('dataDict.dimensionValueMaximumCharacterLimit0'),
            },
            { validator: dimensionFormItemValidator },
          ]}
        >
          <Input placeholder={intl.get('dataDict.pleaseInput')} className={styles['input-box']} />
        </Form.Item>
      </div>
      {dimensionValueFormItemKeys.length > 1 ? (
        // 删除按钮
        <div
          className={styles['delete-button']}
          onClick={(): void => {
            Modal.confirm({
              centered: true,
              content: intl.get('dataDict.deleteDataConfirm'),
              getContainer: () => document.getElementById('dataManagerRoot') as HTMLElement, // 指定挂载节点
              icon: <IconFont type="icon-about" />,
              onOk: async () => {
                if (dimensionValueFormItemKeys.length === 1) {
                  return
                }
                setDimensionValueFormItemKeys(dimensionValueFormItemKeys.filter((key) => key !== k))
              },
              footer: (_, { OkBtn, CancelBtn }) => (
                <>
                  <OkBtn />
                  <CancelBtn />
                </>
              ),
            })
          }}
        >
          <IconFont type="icon-trash" />
        </div>
      ) : null}
    </div>
  ))

  const formLayout = {
    labelCol: {
      span: 6,
    },
    wrapperCol: {
      span: 18,
    },
    colon: false,
  }

  const goBack = () => {
    navigate('../.')
  }

  return (
    <div className={styles.container}>
      <Back
        title={isNew ? intl.get('dataDict.createDataDict') : intl.get('dataDict.editDataDict')}
        onClick={goBack}
      />

      <Form {...formLayout} form={form}>
        {/* 基本配置 */}
        <CollapseCard title={intl.get('dataDict.basicConfig')} className={styles['collapse-card']}>
          <Form.Item required label={intl.get('dataDict.dataDictName')}>
            <Form.Item
              name="name"
              rules={[
                {
                  required: true,
                  message: intl.get('dataDict.nameNotEmpty'),
                },
                {
                  max: 40,
                  message: intl.get('dataDict.jobNameMaximumCharacterLimit'),
                },
              ]}
            >
              <Input placeholder={intl.get('dataDict.pleaseInput')} />
            </Form.Item>
          </Form.Item>
          <Form.Item
            label={intl.get('dataDict.tag')}
            name="tags"
            rules={[{ validator: tagsSelectorValidator }]}
          >
            <TagsSelector />
          </Form.Item>
          <Form.Item
            label={intl.get('dataDict.type')}
            name="type"
            required
            rules={[
              {
                required: true,
                message: intl.get('dataDict.typeNotEmpty'),
              },
            ]}
          >
            <Select
              placeholder={intl.get('dataDict.pleaseSelect')}
              onChange={(val: string): void => {
                setDictType(val)
              }}
              disabled={!isNew} // 编辑时不可更改
            >
              <Select.Option key="kvDict" value="kvDict">
                {intl.get('dataDict.kvDict')}
              </Select.Option>
              <Select.Option key="dimensionDict" value="dimensionDict">
                {intl.get('dataDict.dimensionDict')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.get('dataDict.comment')}
            name="comment"
            rules={[
              {
                max: 3000,
                message: intl.get('dataDict.commentMaximumCharacterLimit'),
              },
            ]}
          >
            <Input.TextArea rows={4} maxLength={3000} />
          </Form.Item>
        </CollapseCard>
        <Divider />

        {/* 知识条目配置 */}
        <CollapseCard title={intl.get('dataDict.dictConfig')} className={styles['collapse-card']}>
          {dictType === 'dimensionDict' ? (
            <>
              <Form.Item label={intl.get('dataDict.dimensionKey')} required>
                <div className={styles['dimension-form-item-wrapper']}>
                  <div>{dimensionKeyFormItems}</div>

                  {/* 添加按钮 */}
                  {dimensionKeyFormItems.length + dimensionValueFormItemKeys.length < 15 && (
                    <div
                      className={styles['add-button']}
                      onClick={(): void => {
                        setDimensionKeyFormItemKeys(
                          dimensionKeyFormItemKeys.concat(
                            dimensionKeyFormItemKeys[dimensionKeyFormItemKeys.length - 1] + 1
                          )
                        )
                      }}
                    >
                      <IconFont type="icon-add" />
                      &nbsp; {intl.get('dataDict.add')}
                    </div>
                  )}
                </div>
              </Form.Item>
              <Form.Item label={intl.get('dataDict.dimensionValue')} required>
                <div className={styles['dimension-form-item-wrapper']}>
                  <div>{dimensionValueFormItems}</div>

                  {/* 添加按钮 */}
                  {dimensionKeyFormItems.length + dimensionValueFormItemKeys.length < 15 && (
                    <div
                      className={styles['add-button']}
                      onClick={(): void => {
                        setDimensionValueFormItemKeys(
                          dimensionValueFormItemKeys.concat(
                            dimensionValueFormItemKeys[dimensionValueFormItemKeys.length - 1] + 1
                          )
                        )
                      }}
                    >
                      <IconFont type="icon-add" />
                      &nbsp; {intl.get('dataDict.add')}
                    </div>
                  )}
                </div>
              </Form.Item>
              {isDuplicate && (
                <Form.Item label=" ">
                  <span style={{ color: 'red' }}>{intl.get('dataDict.isDuplicate')}</span>
                </Form.Item>
              )}
            </>
          ) : (
            <></>
          )}

          <Form.Item
            label={intl.get('dataDict.uniqueKeyOrNot')}
            name="uniqueKey"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch disabled={!isNew} size="small" />
          </Form.Item>
        </CollapseCard>
        <Divider />

        {/* 保存、取消 按钮 */}
        <div className={styles['button-group']}>
          <Button type="primary" onClick={handleSubmit}>
            {intl.get('dataDict.save')}
          </Button>
          <Button onClick={goBack}>{intl.get('dataDict.cancel')}</Button>
        </div>
      </Form>
    </div>
  )
}

export default TraceModelConfigForm
