import React, { useEffect, useState, useCallback } from 'react'
import classNames from 'classnames'
import {
  Drawer,
  Collapse,
  Row,
  Col,
  Divider,
  Button,
  Input,
  Select,
  Upload,
  Spin,
  Dropdown,
  Modal,
  Tooltip,
  message,
  Tag,
} from 'antd'
import { CaretRightOutlined } from '@ant-design/icons'
import {
  getDataDictItems,
  getDataDictInfo as getDataDictInfoReq,
  importDataDictItem,
  deleteDataDictItem,
  exportDataDictItems,
} from '@/apis/mdl-data-model'
import Cookie from 'js-cookie'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import { downloadFile } from '../utils'
import dayjs from 'dayjs'
import styles from './index.module.less'
import DictItemTable from './dictItemTable'

const { Panel } = Collapse

type DetailDrawerPropsType = {
  jobId: string
  onClose: () => void
  intl: any
}

const DetailDrawer: React.FC<DetailDrawerPropsType> = (props: DetailDrawerPropsType) => {
  const [dataDictInfo, setDataDictInfo] = useState<any>({
    name: '',
    tags: [],
    comment: '--',
    type: 'dimensionDict',
    uniqueKey: true,
    dimension: {
      keys: [{ id: '1', name: 'keys' }],
      values: [{ id: '2', name: 'values' }],
    },
    updateTime: '--',
  })

  const [dictItemTableData, setDictItemTableData] = useState<Array<any>>([])
  const [dictItemTotalCount, setDictItemTotalCount] = useState<number>(0)
  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedDimensionField, setSelectedDimensionField] = useState<string>()
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false) // Table是否处于loading状态
  const [tableDataSize, setTableDataSize] = useState<number>(10)
  const [tableDataOffset, setTableDataOffset] = useState<number>(0)
  const [dictItemOperation, setDictItemOperation] = useState<'create' | 'edit'>() // 对知识条目项的操作方式，创建/编辑
  const [selectedDictItemRowKeys, setSelectedDictItemRowKeys] = useState<Array<string>>([])
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false)

  const getDataDictItemList = useCallback(async () => {
    setIsTableLoading(true)

    try {
      const queryParams = {
        query_field: selectedDimensionField,
        query_pattern: searchValue,
        limit: tableDataSize,
        offset: tableDataOffset,
        format: 'json',
      }

      const { total_count: totalCount, entries } = await getDataDictItems(props.jobId, queryParams)

      // 删除table当前页最后一条数据，重新设置offset，重新加载
      if (tableDataOffset !== 0 && tableDataOffset === totalCount) {
        setTableDataOffset(tableDataOffset - tableDataSize)
      }

      setDictItemTableData(entries)
      setDictItemTotalCount(totalCount)
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }
    } finally {
      setIsTableLoading(false)
    }
  }, [selectedDimensionField, searchValue, tableDataSize, tableDataOffset, props.jobId])

  const againRequest = (isCreate?: boolean): void => {
    if (tableDataOffset !== 0 && isCreate) {
      setTableDataOffset(0)
    } else {
      getDataDictItemList()
    }
  }

  useEffect(() => {
    const getDataDictInfo = async (): Promise<void> => {
      setIsPageLoading(true)

      try {
        const res = await getDataDictInfoReq(props.jobId)
        const dictInfo = res[0] ?? {}
        const dataDictInfoRes = {
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

        setDataDictInfo(dataDictInfoRes)
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description)
        }
      } finally {
        setIsPageLoading(false)
      }
    }

    getDataDictInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getDataDictItemList()
  }, [getDataDictItemList])

  const handleCreateItemClick = (): void => {
    setDictItemOperation('create')
  }

  const handleItemDeleteClick = async (itemIds: string | Array<string>): Promise<void> => {
    try {
      await deleteDataDictItem(props.jobId, itemIds)

      message.success(intl.get('dataDict.deleteSuccess'))
      getDataDictItemList()
      setSelectedDictItemRowKeys([])
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }
    }
  }

  // 将所有知识条目项导出为 csv 格式文件
  const handleExportAllClick = async (format: 'csv' | 'xlsx'): Promise<void> => {
    try {
      const res = await exportDataDictItems(props.jobId, format)

      if (format === 'csv') {
        // 在每个逗号和换行符号之前添加'\t'，防止excel打开时对大数自动转换科学计数法
        res.replace(/(,|[\r\n])/g, '\t$1')
        const bom = '\ufeff' // 标名文件以UTF-8编码，防止excel打开时中文乱码
        const csvData = bom + res
        const blob = new Blob([csvData as any])

        downloadFile(blob, dataDictInfo.name, format)
      }

      if (format === 'xlsx') {
        const blob = new Blob([res], { type: 'application/vnd.ms-excel' })

        downloadFile(blob, dataDictInfo.name, format)
      }

      message.success(intl.get('dataDict.exportSuccess'))
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }
    }
  }

  const handleTableChange = (pagination): void => {
    const dataSize = pagination.pageSize // 每页数据量
    const dataOffset = (pagination.current - 1) * pagination.pageSize // 偏移量

    setTableDataSize(dataSize)
    setTableDataOffset(dataOffset)
  }

  const dimensionKeys = dataDictInfo.dimension?.keys || []
  const dimensionValues = dataDictInfo.dimension?.values || []
  const dimensionFields = [...dimensionKeys, ...dimensionValues]

  const customPanelStyle = {
    background: '#fff',
    border: 0,
    overflow: 'hidden',
  }

  const tableRowSelection = {
    selectedRowKeys: selectedDictItemRowKeys,
    onChange: (selectedRowKeys: Array<string>): void => {
      setSelectedDictItemRowKeys(selectedRowKeys)
    },
  }

  const changeUpload = async (file): Promise<void> => {
    const formData = new FormData()

    formData.append('items_file', file)
    formData.append('file_name', file.name)

    const confirm = async (val, modal): Promise<void> => {
      try {
        await importDataDictItem(props.jobId, formData, val)

        modal.destroy()
        message.success(intl.get('dataDict.importSuccess'))
        getDataDictItemList()
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description)
        }
      }
    }

    try {
      await importDataDictItem(props.jobId, formData, 'normal')
      message.success(intl.get('dataDict.importSuccess'))
      getDataDictItemList()
    } catch (ex) {
      if (ex?.error_code === 'DataModel.DataDict.Duplicated.DictItemKey') {
        const modal = Modal.warning({
          centered: true,
          title: intl.get('dataDict.overwriteTip'),
          getContainer: () => document.getElementById('dataManagerRoot') as HTMLElement, // 指定挂载节点
          content: (
            <div className={styles['custom-btn']}>
              <Button className={styles.marginRight} onClick={(): void => modal.destroy()}>
                {intl.get('dataDict.cancel')}
              </Button>
              <Button
                className={styles.marginRight}
                onClick={(): Promise<void> => confirm('ignore', modal)}
              >
                {intl.get('dataDict.ignore')}
              </Button>
              <Button onClick={(): Promise<void> => confirm('overwrite', modal)} type="primary">
                {intl.get('dataDict.overwrite')}
              </Button>
            </div>
          ),
          className: styles['modal-warning'],
        })
      } else if (ex.description) {
        message.error(ex.description)
      }
    }
  }

  const uploadProps = {
    name: 'items_file',
    action: `/api/data-model/v1/data-dicts/${props.jobId}/items`,
    headers: {
      // 表明前端界面的语言环境，控制当请求失败时，返回的报错信息的语言（中文/英文）
      'Accept-Language': Cookie.get('language') || 'zh-CN',
      'X-Language': Cookie.get('language') || 'zh-CN',
    },
    showUploadList: false,
    accept: '.csv,.xlsx',
    beforeUpload: (file): boolean => {
      // 限制上传格式
      const acceptArr = ['csv', 'xlsx']
      const fileNameArr = file.name.split('.') ?? []

      // 格式转换小写匹配
      const lowerCaseStr = fileNameArr[fileNameArr.length - 1]?.toLowerCase()

      if (!acceptArr.includes(lowerCaseStr)) {
        message.info(intl.get('dataDict.importAcceptTip'))

        return false
      }
      // 设置文件大小限制为 100MB
      const maxSize = 1024 * 1024 * 100

      if (maxSize < file.size) {
        message.info(intl.get('dataDict.importMaxSize'))

        return false
      }
      changeUpload(file)

      return false
    },
  }
  // 导出下拉菜单（导出Excel、导出CSV）
  const menuExport = {
    items: [
      {
        key: 'xlsx',
        label: intl.get('dataDict.exportExcel'),
        onClick: (): Promise<void> => handleExportAllClick('xlsx'),
      },
      {
        key: 'csv',
        label: intl.get('dataDict.exportCSV'),
        onClick: (): Promise<void> => handleExportAllClick('csv'),
      },
    ],
  }

  return (
    <Drawer
      className={styles['detail-drawer']}
      getContainer={() => document.getElementById('dataManagerRoot') as HTMLElement}
      title={<span className={styles['drawer-title']}>{intl.get('dataDict.viewDataDict')}</span>}
      placement="right"
      size="80%"
      onClose={props.onClose}
      open
      styles={{
        body: {
          minWidth: 1000,
          overflowX: 'auto',
        },
      }}
    >
      <Spin spinning={isPageLoading} size="large">
        <Collapse
          bordered={false}
          defaultActiveKey={['1', '2', '3']}
          expandIcon={({ isActive }): JSX.Element => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
        >
          {/* 基本配置 */}
          <Panel
            header={
              <span className={styles['first-level-panel-header']}>
                {intl.get('dataDict.basicConfig')}
              </span>
            }
            key="1"
            style={customPanelStyle}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.dataDictName')}：
                  <span className={styles['ellipsis-text']} title={dataDictInfo.name}>
                    {dataDictInfo.name}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.updateTime')}：
                  {dataDictInfo.updateTime
                    ? dayjs(dataDictInfo.updateTime).format('YYYY-MM-DD HH:mm:ss')
                    : '--'}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.comment')}：
                  <span className={styles['ellipsis-text']} title={dataDictInfo.comment}>
                    {dataDictInfo.comment || '--'}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.type')}：
                  {dataDictInfo.type === 'kvDict'
                    ? intl.get('dataDict.kvDict')
                    : intl.get('dataDict.dimensionDict') || '--'}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.tag')}：
                  {dataDictInfo.tags.length
                    ? dataDictInfo.tags.map((item) => (
                        <Tag key={item} className={styles['tag']} title={item}>
                          {item}
                        </Tag>
                      ))
                    : '--'}
                </div>
              </Col>
            </Row>
          </Panel>

          <Divider style={{ borderTop: '1px solid #eee' }} />

          {/* 知识条目配置 */}
          <Panel
            header={
              <span className={styles['first-level-panel-header']}>
                {intl.get('dataDict.dictConfig')}
              </span>
            }
            key="2"
            style={customPanelStyle}
          >
            <Row gutter={[16, 16]}>
              {dataDictInfo.type === 'dimensionDict' && (
                <>
                  <Col span={24}>
                    <div className={classNames(styles['form-text'], styles['dict-wrapper'])}>
                      <div>{intl.get('dataDict.dimensionKey')}：</div>
                      <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                        {dataDictInfo.dimension?.keys.length
                          ? dataDictInfo.dimension?.keys.map((item) => (
                              <Tag key={item.name} className={styles.tag} title={item.name}>
                                {item.name}
                              </Tag>
                            ))
                          : '--'}
                      </div>
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className={classNames(styles['form-text'], styles['dict-wrapper'])}>
                      {intl.get('dataDict.dimensionValue')}：
                      {dataDictInfo.dimension?.values.length
                        ? dataDictInfo.dimension?.values.map((item) => (
                            <Tag key={item.name} className={styles.tag} title={item.name}>
                              {item.name}
                            </Tag>
                          ))
                        : '--'}
                    </div>
                  </Col>
                </>
              )}
              <Col span={24}>
                <div className={styles['form-text']}>
                  {intl.get('dataDict.uniqueKeyOrNot')}：
                  {dataDictInfo.uniqueKey ? intl.get('dataDict.yes') : intl.get('dataDict.no')}
                </div>
              </Col>
            </Row>
          </Panel>

          <Divider style={{ borderTop: '1px solid #eee' }} />

          {/* 知识条目项 */}
          <Panel
            header={
              <span className={styles['first-level-panel-header']}>
                {intl.get('dataDict.dataDictItem')}
              </span>
            }
            key="3"
            style={customPanelStyle}
          >
            <div className={styles['dict-item-operator']}>
              <div className={styles['button-group']}>
                <Button
                  type="primary"
                  onClick={handleCreateItemClick}
                  disabled={!!dictItemOperation}
                >
                  <IconFont type="icon-add" />
                  {intl.get('dataDict.new')}
                </Button>
                <Button
                  disabled={!selectedDictItemRowKeys.length || !!dictItemOperation}
                  onClick={(): Promise<void> => handleItemDeleteClick(selectedDictItemRowKeys)}
                >
                  <IconFont type="icon-trash" />
                  {intl.get('dataDict.delete')}
                </Button>
                <Upload {...uploadProps} disabled={!!dictItemOperation}>
                  <Tooltip
                    placement="topLeft"
                    title={
                      <div>
                        <p>{intl.get('dataDict.import.file.format.tip')}</p>
                        <p>
                          文件第一行为表头行，需与知识条目字段配置保持一致。其他每一行为一条知识条目项。
                        </p>
                        <p>可以导出全部，修改完成后再导入回去。</p>
                      </div>
                    }
                  >
                    <Button disabled={!!dictItemOperation}>
                      <IconFont type="icon-upload" />
                      {intl.get('dataDict.import')}
                    </Button>
                  </Tooltip>
                </Upload>
                <Dropdown menu={menuExport} disabled={!!dictItemOperation} placement="bottomCenter">
                  <Button disabled={!!dictItemOperation}>
                    <IconFont type="icon-xiazai" />
                    {intl.get('dataDict.exportAll')}
                  </Button>
                </Dropdown>
                <div className={styles['total-count-text']}>
                  {intl.get('dataDict.dictItemTotalCount', {
                    total: dictItemTotalCount,
                  })}
                </div>
              </div>
              <div className={styles.filter}>
                <div className={styles.select}>
                  <span className={styles.text}>{intl.get('dataDict.accordingTo')}</span>
                  <Select
                    style={{
                      width: '130px',
                      height: '32px',
                      textAlign: 'left',
                    }}
                    value={selectedDimensionField}
                    onChange={(val: string): void => setSelectedDimensionField(val)}
                    placeholder={intl.get('dataDict.pleaseSelect')}
                    disabled={!!dictItemOperation}
                  >
                    {dataDictInfo.type === 'kvDict' &&
                      dimensionFields.map((item) => (
                        <Select.Option key={item.name} value={item.name}>
                          {item.name === 'key'
                            ? intl.get('dataDict.key')
                            : intl.get('dataDict.value')}
                        </Select.Option>
                      ))}
                    {dataDictInfo.type === 'dimensionDict' &&
                      dimensionFields.map((item) => (
                        <Select.Option key={item.name} value={item.name}>
                          {item.name}
                        </Select.Option>
                      ))}
                  </Select>
                  <span className={styles.text}>{intl.get('dataDict.filtrate')}</span>
                </div>
                <Input.Search
                  placeholder={intl.get('dataDict.pleaseInput')}
                  disabled={!!dictItemOperation}
                  onSearch={(val: string): void => {
                    setSearchValue(val)
                    setTableDataOffset(0)
                  }}
                  className={styles.search}
                ></Input.Search>
              </div>
            </div>
            {/* 知识条目项Table */}
            {dataDictInfo.name && (
              <DictItemTable
                handleItemDeleteClick={handleItemDeleteClick}
                dataDictInfo={dataDictInfo}
                tableDataOffset={tableDataOffset}
                tableDataSize={tableDataSize}
                dictItemTotalCount={dictItemTotalCount}
                dataSource={dictItemTableData}
                onChange={handleTableChange}
                rowSelection={tableRowSelection as any}
                dictId={props.jobId}
                againRequest={againRequest}
                dictItemOperation={dictItemOperation}
                setDictItemOperation={setDictItemOperation}
                loading={isTableLoading}
              />
            )}
          </Panel>
        </Collapse>
      </Spin>
    </Drawer>
  )
}

export default DetailDrawer
