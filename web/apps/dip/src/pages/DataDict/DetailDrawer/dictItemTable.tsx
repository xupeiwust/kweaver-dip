import { Table, Input, InputNumber, Form, Button, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import intl from 'react-intl-universal'
import { createDataDictItem, editDataDictItem } from '@/apis/mdl-data-model'
import type { TableProps } from 'antd/lib/table'
import styles from './index.module.less'
import { getRules } from './utils'

export type DataDictItemInf = {
  key: string
  value: string
  comment: string
  id: number | string
}

interface TProps {
  dataDictInfo: any
  handleItemDeleteClick: (itemIds: string | Array<string>) => Promise<void>
  tableDataOffset: number
  tableDataSize: number
  dictItemTotalCount: number
  dataSource: DataDictItemInf[]
  dictId: string
  dictItemOperation?: 'create'
  setDictItemOperation: (val?: 'create' | 'edit') => void
  loading: boolean
  onChange: (pagination, filters, sorter) => void
  againRequest: (isCreate?: boolean) => void
  rowSelection: TableProps['rowSelection']
}

const EditableTable = ({
  dataDictInfo,
  handleItemDeleteClick,
  tableDataOffset,
  tableDataSize,
  dictItemTotalCount,
  dataSource,
  dictId,
  dictItemOperation,
  setDictItemOperation,
  againRequest,
  loading,
  onChange,
  rowSelection,
}: TProps): JSX.Element => {
  const [form] = Form.useForm()
  const [editingKey, setEditingKey] = useState<string>('')

  const cancel = (): void => {
    form.resetFields()
    setEditingKey('')
    setDictItemOperation(undefined)
  }

  useEffect(() => {
    if (dictItemOperation === 'create') {
      form.resetFields()
      setEditingKey(dictItemOperation)
    }
  }, [dictItemOperation, form])

  const save = async (record): void => {
    try {
      const row = await form.validateFields()
      if (dataDictInfo.type === 'dimensionDict') {
        const dimensionKeys = (dataDictInfo.dimension?.keys || []).map((item) => item.name)
        const isValue = dimensionKeys.some((val) => row[val])

        if (!isValue) {
          message.error(intl.get('dataDict.dimensionKeyNotAllEmpty'))

          return
        }
      }
      let res

      try {
        if (record.id === 'create') {
          res = await createDataDictItem(dictId, row)
        } else {
          res = await editDataDictItem(dictId, record?.id, row)
        }

        if (record.id === 'create') {
          againRequest(true)
          message.success(intl.get('dataDict.createSuccess'))
        } else {
          againRequest()
          message.success(intl.get('dataDict.editSuccess'))
        }
        form.resetFields()
        setEditingKey('')
        setDictItemOperation(undefined)
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description)
        }
      }
    } catch {}
  }

  const edit = (record): void => {
    form.setFieldsValue(record)
    setEditingKey(record.id)
    setDictItemOperation('edit')
  }

  const dimensionKeys = dataDictInfo.dimension?.keys || []
  const dimensionValues = dataDictInfo.dimension?.values || []

  // 知识条目项 Table 列中不确定的列
  const uncertainColumns: any =
    dataDictInfo.type === 'dimensionDict'
      ? [
          {
            title: intl.get('dataDict.dimensionKey'),
            align: 'left',
            children: dimensionKeys.map((item) => ({
              title: item.name,
              dataIndex: item.name,
              key: item.name,
              editable: true,
              width: 172,
              render: (text): string => text || '--',
            })),
          },
          {
            title: intl.get('dataDict.dimensionValue'),
            align: 'left',
            children: dimensionValues.map((item) => ({
              title: item.name,
              dataIndex: item.name,
              key: item.name,
              editable: true,
              width: 172,
              render: (text): string => text || '--',
            })),
          },
          {
            title: intl.get('dataDict.comment'),
            dataIndex: 'comment',
            key: 'comment',
            width: 200,
            editable: true,
            // 此处不固定宽度而设置最小宽度，以适应Table弹性布局
            render: (text): JSX.Element => text || '--',
          },
        ]
      : [
          {
            title: intl.get('dataDict.key'),
            dataIndex: 'key',
            key: 'key',
            editable: true,
            width: 200,
          },
          {
            title: intl.get('dataDict.value'),
            dataIndex: 'value',
            key: 'value',
            editable: true,
            width: 200,
          },
          {
            title: intl.get('dataDict.comment'),
            dataIndex: 'comment',
            key: 'comment',
            width: 200,
            editable: true,
            // 此处不固定宽度而设置最小宽度，以适应Table弹性布局
            render: (text): JSX.Element => text || '--',
          },
        ]

  // 知识条目项 Table 列中确定的列
  const certainColumns = [
    {
      title: intl.get('dataDict.operation'),
      dataIndex: 'operate',
      key: 'operate',
      width: 120,
      fixed: 'right',
      render: (text, record): JSX.Element => {
        return record.id === editingKey ? (
          <span style={{ marginTop: '10px' }}>
            <Button type="link" onClick={(): void => save(record)} style={{ marginRight: 12 }}>
              {intl.get('dataDict.save')}
            </Button>
            <Button type="link" onClick={(): void => cancel()}>
              {intl.get('dataDict.cancel')}
            </Button>
          </span>
        ) : (
          <div>
            <Button
              disabled={editingKey !== ''}
              onClick={(): void => edit(record)}
              type="link"
              style={{ marginRight: 12 }}
            >
              {intl.get('dataDict.edit')}
            </Button>
            <Button
              disabled={editingKey !== ''}
              onClick={(): Promise<void> => handleItemDeleteClick(record.id)}
              type="link"
            >
              {intl.get('dataDict.delete')}
            </Button>
          </div>
        )
      },
    },
  ]

  const dictItemColumns = [...uncertainColumns, ...certainColumns]

  const columns: any = dictItemColumns.map((col) => {
    const renderItem = (text, record, colProps, field): JSX.Element => {
      const { inputType, dataIndex } = colProps
      const getInput = (key: string): JSX.Element => {
        if (inputType === 'number') {
          return <InputNumber key={key} />
        }

        return <Input key={key} />
      }

      if (record.id === editingKey) {
        return (
          <Form.Item
            style={{ margin: 0 }}
            name={dataIndex as string}
            rules={getRules({
              field,
              dictType: dataDictInfo.type,
            })}
            initialValue={record[dataIndex]}
          >
            {getInput(record.id + dataIndex)}
          </Form.Item>
        )
      }

      return text || '--'
    }

    if (col.editable) {
      return {
        ...col,
        render: (text: string, record): JSX.Element => renderItem(text, record, col, col.dataIndex),
      }
    }

    if (col.children && col.children.length > 0) {
      return {
        ...col,
        children: col.children.map((colChild) => ({
          ...colChild,
          render: (text: string, record): JSX.Element =>
            renderItem(
              text,
              record,
              colChild,
              col.title === intl.get('dataDict.dimensionKey') ? 'dimensionKey' : 'dimensionValue'
            ),
        })),
      }
    }

    return col
  })

  const curData = useMemo(() => {
    if (dictItemOperation === 'create') {
      return [
        {
          id: 'create',
        } as DataDictItemInf,
        ...dataSource,
      ]
    }

    return dataSource
  }, [dictItemOperation, dataSource])

  return (
    <Form form={form} component={false}>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={curData}
        onChange={onChange}
        rowSelection={rowSelection}
        className={styles['dict-box']}
        scroll={{ x: 'max-content' }}
        pagination={
          editingKey === 'create'
            ? false
            : {
                current: tableDataOffset / tableDataSize + 1,
                total: dictItemTotalCount,
                size: 'small',
                pageSizeOptions: ['10', '20', '50'],
                showSizeChanger: true,
                showQuickJumper: true,
                disabled: !!editingKey,
                onChange: cancel,
              }
        }
      />
    </Form>
  )
}

export default EditableTable
