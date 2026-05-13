import styles from './index.module.less';
import { Button, Dropdown, Splitter, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  CloseOutlined,
  DashboardOutlined,
  DownOutlined,
  ExpandOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import DipButton from '@/components/DipButton';
import React, { useEffect, useMemo, useState } from 'react';
import DipIcon from '@/components/DipIcon';
import { useDipChatStore } from '@/components/DipChat/store';
import { AdMonacoEditor } from '@/components/Editor/AdMonacoEditor';
import ADTable from '@/components/ADTable';
import DipEcharts from '@/components/DipEcharts';
import { DipChatItemContentProgressType } from '@/components/DipChat/interface';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { buildChartToolEchartsOptions } from '@/components/DipChat/utils';
import ChartPreviewModal from '@/components/DipChat/components/ChartPreviewModal';

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
  const isCircleChart = chartType === 'Circle';
  const center = inModal ? ['50%', '54%'] : ['42%', '56%'];
  const radius = isCircleChart
    ? inModal
      ? ['42%', '68%']
      : ['32%', '54%']
    : inModal
      ? '68%'
      : '54%';

  nextOptions.tooltip = {
    ...nextOptions.tooltip,
    confine: true,
  };

  if (chartType === 'Pie' || chartType === 'Circle') {
    nextOptions.legend = {
      ...nextOptions.legend,
      show: false,
    };

    nextOptions.series = seriesList.map((seriesItem: any) => ({
      ...seriesItem,
      data: getOptimizedPieSeriesData(seriesItem?.data),
      center,
      radius,
      avoidLabelOverlap: true,
      minAngle: 3,
      left: inModal ? 24 : 12,
      right: inModal ? 24 : 18,
      top: inModal ? 24 : 12,
      bottom: inModal ? 24 : 12,
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
        width: inModal ? 180 : 132,
        overflow: 'truncate',
        formatter: '{b}: {d}%',
      },
      labelLayout: {
        hideOverlap: true,
        moveOverlap: 'shiftY',
      },
      labelLine: {
        ...(seriesItem?.labelLine || {}),
        show: true,
        length: inModal ? 14 : 10,
        length2: inModal ? 18 : 12,
        lineStyle: {
          color: 'rgba(15, 23, 42, 0.35)',
          width: 1,
        },
      },
    }));

    return nextOptions;
  }

  nextOptions.legend = {
    ...nextOptions.legend,
    type: 'scroll',
    orient: 'vertical',
    top: 16,
    bottom: 16,
    left: inModal ? '62%' : '58%',
    right: 0,
    pageIconSize: 10,
    itemWidth: 12,
    itemHeight: 12,
    itemGap: 10,
    pageTextStyle: {
      color: 'rgba(0, 0, 0, 0.65)',
    },
    textStyle: {
      width: inModal ? 220 : 150,
      overflow: 'truncate',
    },
  };

  nextOptions.series = seriesList.map((seriesItem: any) => ({
    ...seriesItem,
    center: [inModal ? '32%' : '30%', '50%'],
    radius: chartType === 'Circle' ? (inModal ? ['42%', '60%'] : ['38%', '54%']) : (inModal ? '60%' : '54%'),
    avoidLabelOverlap: false,
    label: {
      ...(seriesItem?.label || {}),
      show: false,
    },
    labelLine: {
      ...(seriesItem?.labelLine || {}),
      show: false,
    },
  }));

  return nextOptions;
};

const ChartToolSide = () => {
  const {
    dipChatStore: { activeChatItemIndex, chatList, activeProgressIndex },
    closeSideBar,
  } = useDipChatStore();
  const chatItem = chatList[activeChatItemIndex];
  const activeProgress: DipChatItemContentProgressType = chatItem.content.progress[activeProgressIndex] || {};
  const [viewMode, setViewMode] = useState<ChartViewMode>('chart');
  const [previewOpen, setPreviewOpen] = useState(false);
  const rawChartResult = activeProgress.chartResult?.rawChartResult;
  const rawChartType = _.get(rawChartResult, ['chart_config', 'chart_type'], '') as SwitchableChartType | '';
  const [selectedChartType, setSelectedChartType] = useState<SwitchableChartType>('Column');

  useEffect(() => {
    setViewMode('chart');
    if (rawChartType && SWITCHABLE_TARGET_CHART_TYPES.includes(rawChartType)) {
      setSelectedChartType(rawChartType);
      return;
    }
    setSelectedChartType('Column');
  }, [activeProgressIndex, rawChartType]);

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

  const editorChartOptions = useMemo(() => {
    return activeProgress.chartResult?.echartsOptions || {};
  }, [activeProgress.chartResult?.echartsOptions]);

  const getChartOptionsByType = (chartType?: string, inModal: boolean = false) => {
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
    return editorChartOptions;
  };

  const chartOptions = useMemo(
    () => getChartOptionsByType(canSwitchChartType ? selectedChartType : rawChartType),
    [canSwitchChartType, editorChartOptions, rawChartResult, rawChartType, selectedChartType]
  );

  const error = useMemo(() => {
    if (_.isEmpty(editorChartOptions)) {
      return activeProgress.originalAnswer ?? '';
    }
    return '';
  }, [activeProgress.originalAnswer, editorChartOptions]);

  const modalTableColumns = useMemo(() => {
    const sourceColumns = Array.isArray(activeProgress.chartResult?.tableColumns)
      ? activeProgress.chartResult.tableColumns
      : [];

    if (!sourceColumns.length) {
      return sourceColumns;
    }

    return sourceColumns.map((column: any, index: number) => {
      if (index === 1) {
        return {
          ...column,
          width: 500,
        };
      }

      return column;
    });
  }, [activeProgress.chartResult?.tableColumns]);

  const renderOutputToolbar = () => {
    const hasChart = !_.isEmpty(chartOptions);
    return (
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
        {hasChart && (
          <Tooltip title={intl.get('dipChat.openChartPreview')}>
            <Button
              size="small"
              icon={<ExpandOutlined />}
              onClick={() => {
                setPreviewOpen(true);
              }}
            />
          </Tooltip>
        )}
      </div>
    );
  };

  const renderOutputContent = () => {
    return (
      <div className={styles.outputPanel}>
        <div className={styles.outputHeader}>
          <span>{intl.get('dipChat.output')}</span>
          {renderOutputToolbar()}
        </div>
        <div className={styles.outputBody}>
          {viewMode === 'chart' ? (
            <DipEcharts
              className={styles.outputChart}
              style={{ height: '100%' }}
              options={chartOptions}
              notMerge
            />
          ) : (
            <ADTable
              autoScrollY
              size="small"
              showHeader={false}
              columns={activeProgress.chartResult?.tableColumns}
              dataSource={activeProgress.chartResult?.tableData}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Splitter layout="vertical">
        <Splitter.Panel>
          <div className="dip-flex-column dip-p-12 dip-full dip-overflow-hidden">
            <div className="dip-flex-space-between">
              <div className="dip-flex-item-full-width dip-flex-align-center">
                <DipIcon className="dip-font-16" type="icon-dip-color-echarts" />
                <div title={activeProgress.title} className="dip-ml-8 dip-flex-item-full-width dip-ellipsis">
                  {activeProgress.title}
                </div>
              </div>
              <DipButton size="small" type="text" onClick={closeSideBar}>
                <CloseOutlined className="dip-text-color-45 dip-font-16" />
              </DipButton>
            </div>
            <div className="dip-flex-item-full-height dip-mt-12">
              <AdMonacoEditor
                className={styles.editor}
                value={JSON.stringify(error ? error : editorChartOptions, null, 2)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  tabSize: 2,
                  insertSpaces: true,
                  readOnly: true,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                  lineNumbersMinChars: 4,
                  unicodeHighlight: {
                    ambiguousCharacters: false,
                  },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                defaultLanguage="json"
              />
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="dip-p-12 dip-full dip-flex-column dip-overflow-hidden">{renderOutputContent()}</div>
        </Splitter.Panel>
      </Splitter>
      <ChartPreviewModal
        open={previewOpen}
        title={activeProgress.title}
        onCancel={() => {
          setPreviewOpen(false);
        }}
        canSwitchChartType={canSwitchChartType}
        rawChartType={rawChartType}
        initialViewMode={viewMode}
        initialSelectedChartType={selectedChartType}
        getChartOptionsByType={getChartOptionsByType}
        tableColumns={activeProgress.chartResult?.tableColumns}
        tableData={activeProgress.chartResult?.tableData}
        transformTableColumns={() => modalTableColumns}
      />
    </>
  );
};

export default ChartToolSide;
