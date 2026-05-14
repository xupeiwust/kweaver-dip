import { API, MicroAppContext } from "@applet/common";
import { Form, Select } from "antd";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Extension } from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";
import EditorWithMentions from "../ai/editor-with-mentions";
import DatasetSVG from "./assets/database.svg";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";

const DATASET_PAGE_SIZE = 50;
const DATASET_RESOURCE_CATEGORY = "dataset";
const DATASET_RESOURCE_STATUS = "active";

export interface DatasetOption {
  value: string;
  label: string;
  description?: string;
  sourceIdentifier?: string;
}

export const getDatasetTotalCount = (payload: any): number | undefined => {
  const totalCount = payload?.total_count || payload?.data?.total_count;
  return typeof totalCount === "number" ? totalCount : undefined;
};

export const normalizeDatasetOptions = (payload: any): DatasetOption[] => {
  const list = payload?.entries || payload?.data?.entries || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item: any) => {
      const value = item?.id || item?.dataset_id || item?.datasetId || item?.uuid;
      const label = item?.name || item?.title || value;

      if (!value || !label) {
        return undefined;
      }

      return {
        value,
        label,
        description: item?.description,
        sourceIdentifier: item?.source_identifier,
      };
    })
    .filter(Boolean) as DatasetOption[];
};

export const getDatasetResourcesUrl = (prefixUrl: string, currentPage: number) => {
  return `${prefixUrl}/api/vega-backend/v1/resources?category=${DATASET_RESOURCE_CATEGORY}&status=${DATASET_RESOURCE_STATUS}&limit=${DATASET_PAGE_SIZE}&offset=${
    currentPage * DATASET_PAGE_SIZE
  }`;
};

export const formatDocumentsForEditor = (documents: any) => {
  if (typeof documents === "string") {
    return documents;
  }
  if (typeof documents === "undefined" || documents === null) {
    return "";
  }
  return JSON.stringify(documents, null, 2);
};

export const parseDocumentsFromEditor = (documents: string) => {
  const value = documents.trim();
  if (!value) {
    return value;
  }
  if (!value.startsWith("[") && !value.startsWith("{")) {
    return documents;
  }

  try {
    return JSON.parse(value);
  } catch {
    return documents;
  }
};

const DatasetWriteExtension: Extension = {
  name: "datasetWrite",
  executors: [
    {
      name: "datasetWrite",
      description: "datasetWriteDescription",
      icon: DatasetSVG,
      actions: [
        {
          name: "datasetWrite",
          description: "datasetWriteDescription",
          operator: "@dataset/write-docs",
          icon: DatasetSVG,
          outputs: () => [],
          validate(parameters) {
            return parameters;
          },
          components: {
            Config: forwardRef(({ t, parameters = {}, onChange }: any, ref) => {
              const [form] = Form.useForm();
              const { prefixUrl } = useContext(MicroAppContext);
              const [datasetList, setDatasetList] = useState<DatasetOption[]>([]);
              const [searchKeyword, setSearchKeyword] = useState("");
              const [currentPage, setCurrentPage] = useState(0);
              const [isLoading, setIsLoading] = useState(false);
              const [hasMore, setHasMore] = useState(true);

              useImperativeHandle(ref, () => ({
                async validate() {
                  return form.validateFields().then(
                    () => true,
                    () => false
                  );
                },
              }));

              const getDatasets = useCallback(async () => {
                setIsLoading(true);
                try {
                  const { data } = await API.axios.get(
                    getDatasetResourcesUrl(prefixUrl, currentPage)
                  );
                  const options = normalizeDatasetOptions(data);
                  const totalCount = getDatasetTotalCount(data);
                  const keyword = searchKeyword.trim().toLowerCase();
                  const result = keyword
                    ? options.filter((item) =>
                        [item.label, item.description, item.sourceIdentifier]
                          .filter(Boolean)
                          .some((text) => String(text).toLowerCase().includes(keyword))
                      )
                    : options;
                  setDatasetList((prev) =>
                    currentPage === 0 ? result : [...prev, ...result]
                  );
                  if (
                    typeof totalCount === "number"
                      ? (currentPage + 1) * DATASET_PAGE_SIZE >= totalCount
                      : options.length < DATASET_PAGE_SIZE
                  ) {
                    setHasMore(false);
                  }
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsLoading(false);
                }
              }, [currentPage, prefixUrl, searchKeyword]);

              useEffect(() => {
                getDatasets();
              }, [getDatasets]);

              const handleSearch = (keyword: string) => {
                setCurrentPage(0);
                setHasMore(true);
                setSearchKeyword(keyword);
              };

              const handleScroll = useCallback(
                (e: any) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                  const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
                  if (isBottom && !isLoading && hasMore) {
                    setCurrentPage((prevPage) => prevPage + 1);
                  }
                },
                [hasMore, isLoading]
              );

              const setEditorContent = (data: any, itemName: string) => {
                form.setFieldValue(itemName, parseDocumentsFromEditor(data));
              };

              return (
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={parameters}
                  onFieldsChange={() => {
                    setTimeout(() => {
                      onChange(form.getFieldsValue());
                    }, 100);
                  }}
                >
                  <FormItem
                    label={t("datasetWrite.dataset", "数据集")}
                    name="dataset_id"
                    required
                    rules={[
                      {
                        required: true,
                        message: t("emptyMessage", "此项不允许为空"),
                      },
                    ]}
                  >
                    <Select
                      loading={isLoading}
                      allowClear
                      filterOption={false}
                      options={datasetList}
                      optionLabelProp="label"
                      onPopupScroll={handleScroll}
                      placeholder={t("modelPlaceholder", "请选择")}
                      showSearch
                      searchValue={searchKeyword}
                      onSearch={handleSearch}
                    >
                      {datasetList.map((item) => (
                        <Select.Option key={item.value} value={item.value} label={item.label}>
                          <div>{item.label}</div>
                          {item.description ? (
                            <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                              {item.description}
                            </div>
                          ) : null}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                  <FormItem label={t("datasetWrite.documents", "写入内容")} name="documents">
                    <EditorWithMentions
                      onChange={setEditorContent}
                      parameters={formatDocumentsForEditor(parameters?.documents)}
                      itemName="documents"
                    />
                  </FormItem>
                </Form>
              );
            }),
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default DatasetWriteExtension;
