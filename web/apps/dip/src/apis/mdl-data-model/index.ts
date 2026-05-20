import { del, get, post, put } from '@/utils/http'
import type {
  DataDictImportModeType,
  GetDataDictInfoByIdsResponseType,
  GetDataDictInfoResponseType,
  GetDataDictItemsParamsType,
  GetDataDictItemsResponseType,
  GetDataDictListParamsType,
  GetDataDictListResponseType,
  GetDataDictsParamsType,
  GetDataDictsResponseType,
  GetMetricInfoByIdsParamsType,
  GetMetricInfoByIdsPesponseType,
  GetMetricModalGroupsParamsType,
  GetMetricModalGroupsResponseType,
  GetMetricModelsParamsType,
  GetMetricModelsResponseType,
  GetObjectTagsParamsType,
  GetObjectTagsResponseType,
  MetricModalGroupType,
  MetricModelType,
} from './index.d'

export type { MetricModalGroupType, MetricModelType }

const dataModelUrl = '/api/mdl-data-model/v1'
const dataDictUrl = `${dataModelUrl}/data-dicts`
const objectTagUrl = `${dataModelUrl}/object-tags`

const joinIds = (ids: string | string[]) => (Array.isArray(ids) ? ids.join(',') : ids)

// 查询分组列表
export const getMetricModalGroups = (
  params?: GetMetricModalGroupsParamsType
): Promise<GetMetricModalGroupsResponseType> =>
  get(`${dataModelUrl}/metric-model-groups`, {
    headers: { 'x-business-domain': 'bd_public' },
    params,
  })

// 查询指标模型列表
export const getMetricModels = (
  params: GetMetricModelsParamsType
): Promise<GetMetricModelsResponseType> =>
  get(`${dataModelUrl}/metric-models`, { headers: { 'x-business-domain': 'bd_public' }, params })

// 按ids批量取指标模型对象信息
export const getMetricInfoByIds = ({
  ids,
  include_view,
}: GetMetricInfoByIdsParamsType): Promise<GetMetricInfoByIdsPesponseType> =>
  get(`${dataModelUrl}/metric-models/${ids.join(',')}`, {
    headers: { 'x-business-domain': 'bd_public' },
    params: { include_view },
  })

// 查询数据字典列表
export const getDataDicts = (params?: GetDataDictsParamsType): Promise<GetDataDictsResponseType> =>
  get(`${dataDictUrl}`, { headers: { 'x-business-domain': 'bd_public' }, params })

// 根据 ids 批量查询数据字典信息
export const getDataDictInfoByIds = (ids: string[]): Promise<GetDataDictInfoByIdsResponseType> =>
  get(`${dataDictUrl}/${ids.join(',')}`, { headers: { 'x-business-domain': 'bd_public' } })

// 获取知识条目列表
export const getDataDictList = async ({
  direction,
  sort,
  limit,
  offset,
  type,
  tag,
  name_pattern,
}: GetDataDictListParamsType) =>
  get(dataDictUrl, {
    params: {
      sort: sort || 'update_time',
      direction,
      limit,
      offset,
      type,
      name_pattern: name_pattern || null,
      tag: tag || null,
    },
  }) as Promise<GetDataDictListResponseType>

// 获取知识条目信息
export const getDataDictInfo = async (dictId: string) =>
  get(`${dataDictUrl}/${dictId}`) as Promise<GetDataDictInfoResponseType>

// 新建知识条目
export const createDataDict = async (data: unknown) => post(dataDictUrl, { body: data })

// 编辑知识条目
export const editDataDict = async (dictId: string, data: unknown) =>
  put(`${dataDictUrl}/${dictId}`, { body: data })

// 删除知识条目
export const deleteDataDict = async (dictIds: string | string[]) =>
  del(`${dataDictUrl}/${joinIds(dictIds)}`)

// 导出知识条目
export const exportDataDict = async (dictIds: string | string[]) =>
  get(`${dataDictUrl}/${joinIds(dictIds)}`)

// 导入知识条目
export const importDataDict = async (data: unknown) => post(dataDictUrl, { body: data })

export const getDataDictItems = async (dictId: string, params: GetDataDictItemsParamsType) =>
  get(`${dataDictUrl}/${dictId}/items`, { params }) as Promise<GetDataDictItemsResponseType>

export const exportDataDictItems = async (dictId: string, format: 'csv' | 'xlsx') =>
  get(`${dataDictUrl}/${dictId}/items`, {
    params: { format },
    responseType: format === 'xlsx' ? 'arraybuffer' : 'text',
  })

export const importDataDictItem = async (
  dictId: string,
  data: FormData,
  importMode: DataDictImportModeType = 'normal'
) =>
  post(`${dataDictUrl}/${dictId}/items?import_mode=${importMode}`, {
    body: data,
  })

export const createDataDictItem = async (dictId: string, data: Record<string, unknown>) =>
  post(`${dataDictUrl}/${dictId}/items`, { body: data })

export const editDataDictItem = async (
  dictId: string,
  itemId: string,
  data: Record<string, unknown>
) => put(`${dataDictUrl}/${dictId}/items/${itemId}`, { body: data })

export const deleteDataDictItem = async (dictId: string, itemIds: string | string[]) =>
  del(`${dataDictUrl}/${dictId}/items/${joinIds(itemIds)}`)

export const getObjectTags = (params: GetObjectTagsParamsType = {}) =>
  get(objectTagUrl, { params }) as Promise<GetObjectTagsResponseType>
