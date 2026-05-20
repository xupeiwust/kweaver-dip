import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Table, Modal, Upload, Tooltip, Tag, message } from 'antd'
import dayjs from 'dayjs'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import TagsFilter from './components/TagsFilter'
import { downloadFile } from './utils'
import {
  getDataDictList,
  deleteDataDict,
  exportDataDict,
  importDataDict,
} from '@/apis/mdl-data-model'
import { getResourceTypeOperation } from '@/apis/resource-type-operation'
import DetailDrawer from './DetailDrawer'
import styles from './index.module.less'

const PERMISSION_CODES = {
  CREATE: 'create',
  DELETE: 'delete',
  VIEW: 'view_detail',
  QUERY: 'data_query',
  MODIFY: 'modify',
  AUTHORIZE: 'authorize',
  IMPORT: 'import',
  EXPORT: 'export',
  MOVE: 'move',
}

const DataDict: React.FC = () => {
  type JobListType = Array<{
    id: string
    name: string
    tags: Array<string>
    type: string
    updateTime: string
  }>
  const navigate = useNavigate()

  const [jobList, setJobList] = useState<JobListType>([])
  const [selectedTableRowKeys, setSelectedTableRowKeys] = useState<Array<any>>([])
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState<boolean>(false)
  const [currentOperateJobId, setCurrentOperateJobId] = useState<string>('')
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false) // Table是否处于loading状态
  const [searchValue, setSearchValue] = useState<string>('') // 搜索框中输入进行搜索的内容
  const [tableDataOffset, setTableDataOffset] = useState<number>(0) // 表格数据偏移量，默认0
  const [tableDataSize, setTableDataSize] = useState<number>(10) // 表格每页数据条数
  const [tableDataDirection, setTableDataDirection] = useState<'desc' | 'asc'>('desc') // 表格数据按照更新时间排序方向，默认降序
  const [dictType, setDictType] = useState<string>('') // 知识条目中数据类别
  const [dataTotalAmount, setDataTotalAmount] = useState<number>() // 后端数据总数，用于Table分页器
  const [perm, setPerm] = useState<string[]>([])

  const getJobsList = useCallback(async () => {
    setIsTableLoading(true)
    try {
      const { total_count: totalCount, entries } = await getDataDictList({
        sort: 'update_time',
        direction: tableDataDirection,
        limit: tableDataSize,
        offset: tableDataOffset,
        type: dictType,
        name_pattern: searchValue,
        tag: selectedTag,
      })
      const dataDictListData = entries?.map((item) => {
        const { id, name, tags, type, update_time: updateTime } = item

        return {
          id,
          name,
          type,
          tags,
          updateTime,
        }
      })

      // 删除table当前页最后一条数据，重新设置offset，重新加载
      if (tableDataOffset !== 0 && tableDataOffset === totalCount) {
        setTableDataOffset(tableDataOffset - tableDataSize)
      }

      setJobList(dataDictListData)
      setDataTotalAmount(totalCount)
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }
    } finally {
      setIsTableLoading(false)
    }
  }, [tableDataSize, tableDataOffset, tableDataDirection, dictType, searchValue, selectedTag])

  useEffect(() => {
    getJobsList()
  }, [getJobsList])

  useEffect(() => {
    // 获取权限
    const getPerm = async () => {
      try {
        const resourceTypeOperation = await getResourceTypeOperation(['data_dict'])
        setPerm(resourceTypeOperation[0]?.operation || [])
      } catch {}
    }

    getPerm()
  }, [])

  const handleViewClick = (e, record): void => {
    setCurrentOperateJobId(record.id)
    setIsDetailDrawerVisible(true)
  }

  const handleEditClick = (e, record): void => {
    navigate(`./edit/${record.id}`)
  }

  const handleDeleteClick = (dictIds: string | Array<string>): void => {
    Modal.confirm({
      centered: true,
      content: intl.get('dataDict.deleteConfirmContent'),
      getContainer: () => document.getElementById('dataManagerRoot') as HTMLElement, // 指定挂载节点
      icon: <IconFont type="icon-about" />,
      onOk: async () => {
        try {
          await deleteDataDict(dictIds)
          message.success(intl.get('dataDict.deleteSuccess'))
          setSelectedTableRowKeys([]) // 将 selectedTableRowKeys 置空
          getJobsList()
        } catch (ex: any) {
          if (ex?.description) {
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

  // 导出所选项或导出全部
  const handleExportClick = async (dictIds: Array<string> | 'all'): Promise<void> => {
    try {
      const res = await exportDataDict(dictIds)

      // 下载文件
      downloadFile(JSON.stringify(res, null, 2), 'data-dicts', 'json')
      message.success(intl.get('dataDict.exportSuccess'))
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }
    }
  }

  const handleTagsFilterChange = (val: string): void => {
    setSelectedTag(val)
    setTableDataOffset(0)
  }

  const handleSearchValueChange = (value: string): void => {
    setSearchValue(value)
    setTableDataOffset(0)
  }

  const handleTableChange = (pagination, filters, sorter): void => {
    const dataDirection = sorter.order === 'ascend' ? 'asc' : 'desc' // 排序方向

    setTableDataDirection(dataDirection)

    const dictType = filters.type?.join() // 知识条目类别

    setDictType(dictType)

    const dataSize = pagination.pageSize // 每页数据量
    const dataOffset = (pagination.current - 1) * pagination.pageSize // 偏移量

    setTableDataSize(dataSize)
    setTableDataOffset(dataOffset)
  }

  const columns = [
    {
      title: intl.get('dataDict.name'),
      dataIndex: 'name',
      width: 350,
      render: (text: string): string => text,
    },
    {
      title: intl.get('dataDict.tag'),
      dataIndex: 'tags',
      width: 200,
      render: (tags: string[]): React.ReactNode => {
        return tags?.length
          ? tags?.map((tag) => (
              <Tag key={tag} className={styles.tag} title={tag}>
                {tag}
              </Tag>
            ))
          : '--'
      },
    },
    {
      title: intl.get('dataDict.type'),
      dataIndex: 'type',
      render: (text: 'kv_dict' | 'dimension|dict'): string =>
        text === 'kv_dict' ? intl.get('dataDict.kvDict') : intl.get('dataDict.dimensionDict'),
      filters: [
        {
          text: intl.get('dataDict.kvDict'),
          value: 'kv_dict',
        },
        {
          text: intl.get('dataDict.dimensionDict'),
          value: 'dimension_dict',
        },
      ],
    },
    {
      title: intl.get('dataDict.updateTime'),
      sorter: true,
      dataIndex: 'updateTime',
      render: (text: number): string => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('dataDict.operation'),
      render: (_, record): JSX.Element => (
        <div className={styles['job-actions']}>
          <Button
            className={styles['text-btn']}
            type="link"
            onClick={(e): void => handleViewClick(e, record)}
          >
            {intl.get('dataDict.viewDetails')}
          </Button>
          <Button
            className={styles['text-btn']}
            type="link"
            onClick={(e): void => handleEditClick(e, record)}
          >
            {intl.get('dataDict.edit')}
          </Button>
          <Button
            className={styles['text-btn']}
            type="link"
            onClick={(): void => handleDeleteClick(record.id)}
          >
            {intl.get('dataDict.delete')}
          </Button>
        </div>
      ),
    },
  ]

  const tableRowSelection = {
    selectedRowKeys: selectedTableRowKeys,
    onChange: (selectedRowKeys): void => {
      setSelectedTableRowKeys(selectedRowKeys)
    },
  }

  const uploadProps = {
    customRequest: ({ file }): void => {
      // file 为文件对象，代表所选择的文件
      const reader = new FileReader()

      reader.readAsText(file)

      reader.onload = async (e): Promise<void> => {
        const fileContent = e.target?.result // 这是文件的内容
        const data = JSON.parse(fileContent as string)
        try {
          await importDataDict(data)
          message.success(intl.get('dataDict.importSuccess'))
          // 导入后重新请求列表
          getJobsList()
        } catch (ex: any) {
          if (ex?.description) {
            message.error(ex.description)
          }
        }
      }
    },
    showUploadList: false,
    accept: '.json',
  }

  const [canCreate, canDelete, canImport, canExport] = useMemo(
    () => [
      perm?.includes(PERMISSION_CODES.CREATE),
      perm?.includes(PERMISSION_CODES.DELETE),
      perm?.includes(PERMISSION_CODES.IMPORT),
      perm?.includes(PERMISSION_CODES.EXPORT),
    ],
    [perm]
  )

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* 顶部左侧按钮组 */}
        <div className={styles['button-group']}>
          {canCreate && (
            <Button
              type="primary"
              onClick={(): void => {
                navigate('./new')
              }}
            >
              <IconFont type="icon-add" />
              {intl.get('dataDict.new')}
            </Button>
          )}
          {canDelete && (
            <Button
              disabled={!selectedTableRowKeys?.length}
              onClick={(): void => {
                handleDeleteClick(selectedTableRowKeys)
              }}
            >
              <IconFont type="icon-trash" />
              {intl.get('dataDict.delete')}
            </Button>
          )}
          {canImport && (
            <Upload {...uploadProps}>
              <Tooltip title="知识条目的导入文件为json文件">
                <Button>
                  <IconFont type="icon-upload" />
                  {intl.get('dataDict.import')}
                </Button>
              </Tooltip>
            </Upload>
          )}
          {canExport && (
            <Button
              disabled={!selectedTableRowKeys?.length}
              onClick={(): void => {
                handleExportClick(selectedTableRowKeys)
              }}
            >
              <IconFont type="icon-xiazai" />
              {intl.get('dataDict.export')}
            </Button>
          )}
        </div>
        <div className={styles['filter-group']}>
          {/* 顶部右侧过滤器组 */}
          <TagsFilter
            module="data-dict"
            className={styles['tag-filter']}
            onChange={handleTagsFilterChange}
          />
          <Input.Search
            placeholder={intl.get('dataDict.filter')}
            className={styles['name-filter']}
            onSearch={handleSearchValueChange}
          />
        </div>
      </header>
      <Table
        rowKey={(record): string => record.id}
        columns={columns}
        onChange={handleTableChange}
        dataSource={jobList}
        rowSelection={tableRowSelection}
        loading={isTableLoading}
        pagination={{
          current: tableDataOffset / tableDataSize + 1,
          total: dataTotalAmount,
          size: 'small',
          pageSizeOptions: ['10', '20', '50'],
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      {isDetailDrawerVisible && (
        <DetailDrawer
          isDetailDrawerVisible
          jobId={currentOperateJobId}
          onClose={(): void => setIsDetailDrawerVisible(false)}
        />
      )}
    </div>
  )
}

export default DataDict
