import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  DashboardOutlined,
  DownOutlined,
  ExpandOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import DipEcharts from '@/components/DipEcharts';
import ADTable from '@/components/ADTable';
import ChartPreviewModal from '@/components/DipChat/components/ChartPreviewModal';
import { buildChartToolEchartsOptions } from '@/components/DipChat/utils';
import _ from 'lodash';
import intl from 'react-intl-universal';
import styles from './index.module.less';

type ChartViewMode = 'chart' | 'table';

type SwitchableChartType = 'Circle' | 'Column' | 'Line' | 'Pie';

const SWITCHABLE_SOURCE_CHART_TYPES = new Set(['Column', 'Line', 'Pie']);
const SWITCHABLE_TARGET_CHART_TYPES: SwitchableChartType[] = ['Circle', 'Column', 'Line', 'Pie'];
const OUTPUT_DATA_ZOOM_CHART_TYPES = new Set<SwitchableChartType>(['Line']);
const PIE_PRIMARY_SEGMENTS_COUNT = 4;

const getChartTypeIcon = (chartType?: string) => {
  if (chartType === 'Circle') {
    return <DashboardOutlined />;
  }
  if (chartType === 'Line') {
    return <LineChartOutlined />;
  }
  if (chartType === 'Pie') {
    return <PieChartOutlined />;
  }
  return <BarChartOutlined />;
};

const getChartTypeLabel = (chartType?: string) => {
  if (chartType === 'Circle') {
    return intl.get('dipChat.chartTypeDonut');
  }
  if (chartType === 'Line') {
    return intl.get('dipChat.chartTypeLine');
  }
  if (chartType === 'Pie') {
    return intl.get('dipChat.chartTypePie');
  }
  return intl.get('dipChat.chartTypeColumn');
};

const getOutputDataZoom = (chartResult: any, chartType?: string) => {
  if (!chartType || !OUTPUT_DATA_ZOOM_CHART_TYPES.has(chartType as SwitchableChartType)) {
    return undefined;
  }

  const xField = _.get(chartResult, ['chart_config', 'xField']) || _.get(chartResult, ['chart_config', 'colorField']);
  const data = Array.isArray(chartResult?.data) ? chartResult.data : [];
  if (!xField || data.length === 0) {
    return undefined;
  }

  const xValues = Array.from(
    new Set(data.map(item => item?.[xField]).filter(value => value !== undefined && value !== null))
  );
  if (xValues.length <= 7) {
    return undefined;
  }

  return [
    {
      type: 'slider',
      brushSelect: false,
    },
  ];
};

const getOptimizedPieSeriesData = (seriesData: any[] = []) => {
  const normalizedData = (Array.isArray(seriesData) ? seriesData : [])
    .map(item => ({
      ...item,
      value: Number(item?.value) || 0,
    }))
    .filter(item => item.value > 0)
    .sort((prevItem, nextItem) => nextItem.value - prevItem.value);

  if (normalizedData.length <= PIE_PRIMARY_SEGMENTS_COUNT + 1) {
    return normalizedData;
  }

  const primarySegments = normalizedData.slice(0, PIE_PRIMARY_SEGMENTS_COUNT);
  const remainingSegments = normalizedData.slice(PIE_PRIMARY_SEGMENTS_COUNT);
  const remainingValue = _.sumBy(remainingSegments, item => item.value);

  if (remainingValue <= 0) {
    return primarySegments;
  }

  return [
    ...primarySegments,
    {
      name: intl.get('dipChat.chartTypeOthers'),
      value: Number(remainingValue.toFixed(2)),
    },
  ];
};

const optimizeCircularChartOptions = (options: any, chartType?: string, inModal: boolean = false) => {
  if (!options || !['Pie', 'Circle'].includes(chartType || '')) {
    return options;
  }

  const nextOptions = _.cloneDeep(options);
  const seriesList = Array.isArray(nextOptions.series) ? nextOptions.series : [];

  nextOptions.legend = {
    ...nextOptions.legend,
    show: false,
  };

  nextOptions.series = seriesList.map((seriesItem: any) => ({
    ...seriesItem,
    data: getOptimizedPieSeriesData(seriesItem?.data),
    center: ['50%', '54%'],
    radius: chartType === 'Circle' ? (inModal ? ['42%', '68%'] : ['38%', '62%']) : inModal ? '68%' : '62%',
    avoidLabelOverlap: true,
    minAngle: 3,
    itemStyle: {
      ...(seriesItem?.itemStyle || {}),
      borderColor: '#fff',
      borderWidth: 2,
    },
    label: {
      ...(seriesItem?.label || {}),
      show: true,
      position: 'outside',
      color: 'rgba(0, 0, 0, 0.75)',
      fontSize: inModal ? 13 : 12,
      formatter: '{b}: {d}%',
    },
    labelLine: {
      ...(seriesItem?.labelLine || {}),
      show: true,
      length: inModal ? 16 : 12,
      length2: inModal ? 22 : 18,
      lineStyle: {
        color: 'rgba(15, 23, 42, 0.35)',
        width: 1,
      },
    },
  }));

  return nextOptions;
};

type SwitchableChartPanelProps = {
  chartResult?: {
    echartsOptions?: any;
    tableColumns?: any[];
    tableData?: any[];
    rawChartResult?: {
      chart_config?: Record<string, any>;
      data?: any[];
      title?: string;
    };
  };
  previewTitle?: string;
  showChartTitle?: boolean;
  transformTableColumns?: (columns: any[]) => any[];
};

const SwitchableChartPanel = ({
  chartResult,
  previewTitle,
  showChartTitle = false,
  transformTableColumns,
}: SwitchableChartPanelProps) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('chart');
  const [previewOpen, setPreviewOpen] = useState(false);
  const rawChartResult = chartResult?.rawChartResult;
  const rawChartType = _.get(rawChartResult, ['chart_config', 'chart_type'], '') as SwitchableChartType | '';
  const [selectedChartType, setSelectedChartType] = useState<SwitchableChartType>('Column');
  const echartsOptions = useMemo(() => chartResult?.echartsOptions || {}, [chartResult?.echartsOptions]);

  useEffect(() => {
    setViewMode('chart');
    if (rawChartType && SWITCHABLE_TARGET_CHART_TYPES.includes(rawChartType)) {
      setSelectedChartType(rawChartType);
      return;
    }
    setSelectedChartType('Column');
  }, [rawChartType, previewTitle]);

  const canSwitchChartType = useMemo(
    () => Boolean(rawChartResult?.chart_config) && SWITCHABLE_SOURCE_CHART_TYPES.has(rawChartType),
    [rawChartResult?.chart_config, rawChartType]
  );

  const chartMenuItems = useMemo<MenuProps['items']>(
    () =>
      SWITCHABLE_TARGET_CHART_TYPES.map(item => ({
        key: item,
        icon: getChartTypeIcon(item),
        label: getChartTypeLabel(item),
      })),
    []
  );

  const getChartOptionsByType = useCallback(
    (chartType?: string, inModal: boolean = false) => {
      if (!_.isEmpty(rawChartResult) && rawChartResult?.chart_config) {
        const nextOptions = _.cloneDeep(buildChartToolEchartsOptions(rawChartResult, chartType));
        const outputDataZoom = getOutputDataZoom(rawChartResult, chartType);

        if (outputDataZoom) {
          nextOptions.dataZoom = outputDataZoom;
        } else {
          delete nextOptions.dataZoom;
        }

        return optimizeCircularChartOptions(nextOptions, chartType, inModal);
      }
      return echartsOptions;
    },
    [echartsOptions, rawChartResult]
  );

  const chartOptions = useMemo(
    () => getChartOptionsByType(canSwitchChartType ? selectedChartType : rawChartType),
    [canSwitchChartType, getChartOptionsByType, rawChartType, selectedChartType]
  );

  if (_.isEmpty(chartOptions)) {
    return null;
  }

  return (
    <>
      <div className={styles.charts}>
        <div className={styles.outputPanel}>
          {showChartTitle && previewTitle ? (
            <div className={styles.chartTitle} title={previewTitle}>
              {previewTitle}
            </div>
          ) : null}
          <div className={styles.chartToolbar}>
            <div className={styles.outputToolbar}>
              <Tooltip title={intl.get('dipChat.switchToTable')}>
                <Button
                  size="small"
                  type={viewMode === 'table' ? 'primary' : 'default'}
                  icon={<TableOutlined />}
                  onClick={() => {
                    setViewMode('table');
                  }}
                />
              </Tooltip>
              {canSwitchChartType ? (
                <Dropdown
                  menu={{
                    items: chartMenuItems,
                    selectable: true,
                    selectedKeys: [selectedChartType],
                    onClick: ({ key }) => {
                      setSelectedChartType(key as SwitchableChartType);
                      setViewMode('chart');
                    },
                  }}
                  placement="bottomRight"
                >
                  <span>
                    <Tooltip title={intl.get('dipChat.switchChartType')}>
                      <Button
                        size="small"
                        type={viewMode === 'chart' ? 'primary' : 'default'}
                        icon={getChartTypeIcon(selectedChartType)}
                      >
                        <DownOutlined />
                      </Button>
                    </Tooltip>
                  </span>
                </Dropdown>
              ) : (
                <Tooltip title={intl.get('dipChat.switchToChart')}>
                  <Button
                    size="small"
                    type={viewMode === 'chart' ? 'primary' : 'default'}
                    icon={getChartTypeIcon(rawChartType)}
                    onClick={() => {
                      setViewMode('chart');
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title={intl.get('dipChat.openChartPreview')}>
                <Button
                  size="small"
                  icon={<ExpandOutlined />}
                  onClick={() => {
                    setPreviewOpen(true);
                  }}
                />
              </Tooltip>
            </div>
          </div>
          <div className={showChartTitle && previewTitle ? styles.chartBodyWithTitle : styles.chartBody}>
            {viewMode === 'chart' ? (
              <DipEcharts className={styles.outputChart} style={{ height: '100%' }} options={chartOptions} notMerge />
            ) : (
              <div className={styles.tablePanel}>
                <ADTable
                  autoScrollY
                  size="small"
                  showHeader={false}
                  columns={chartResult?.tableColumns}
                  dataSource={chartResult?.tableData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <ChartPreviewModal
        open={previewOpen}
        title={previewTitle}
        onCancel={() => {
          setPreviewOpen(false);
        }}
        canSwitchChartType={canSwitchChartType}
        rawChartType={rawChartType}
        initialViewMode={viewMode}
        initialSelectedChartType={selectedChartType}
        getChartOptionsByType={getChartOptionsByType}
        tableColumns={chartResult?.tableColumns}
        tableData={chartResult?.tableData}
        transformTableColumns={transformTableColumns}
      />
    </>
  );
};

export default SwitchableChartPanel;
