import React, { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Modal, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  DashboardOutlined,
  DownOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import ADTable from '@/components/ADTable';
import DipEcharts from '@/components/DipEcharts';
import intl from 'react-intl-universal';
import styles from './index.module.less';

export type ChartViewMode = 'chart' | 'table';

export type SwitchableChartType = 'Circle' | 'Column' | 'Line' | 'Pie';

const SWITCHABLE_TARGET_CHART_TYPES: SwitchableChartType[] = ['Circle', 'Column', 'Line', 'Pie'];

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

const MODAL_SWITCHER_OPTIONS: Array<{
  key: ChartViewMode | SwitchableChartType;
  icon: React.ReactNode;
  label: string;
}> = [
  {
    key: 'table',
    icon: <TableOutlined />,
    label: intl.get('dipChat.tableView'),
  },
  {
    key: 'Circle',
    icon: <DashboardOutlined />,
    label: intl.get('dipChat.chartTypeDonut'),
  },
  {
    key: 'Column',
    icon: <BarChartOutlined />,
    label: intl.get('dipChat.chartTypeColumn'),
  },
  {
    key: 'Line',
    icon: <LineChartOutlined />,
    label: intl.get('dipChat.chartTypeLine'),
  },
  {
    key: 'Pie',
    icon: <PieChartOutlined />,
    label: intl.get('dipChat.chartTypePie'),
  },
];

type ChartPreviewModalProps = {
  open: boolean;
  title?: string;
  onCancel: () => void;
  canSwitchChartType: boolean;
  rawChartType?: SwitchableChartType | '';
  initialViewMode: ChartViewMode;
  initialSelectedChartType: SwitchableChartType;
  getChartOptionsByType: (chartType?: string, inModal?: boolean) => any;
  tableColumns?: any[];
  tableData?: any[];
  transformTableColumns?: (columns: any[]) => any[];
  width?: number;
};

const ChartPreviewModal = ({
  open,
  title,
  onCancel,
  canSwitchChartType,
  rawChartType,
  initialViewMode,
  initialSelectedChartType,
  getChartOptionsByType,
  tableColumns,
  tableData,
  transformTableColumns,
  width = 1200,
}: ChartPreviewModalProps) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('chart');
  const [selectedChartType, setSelectedChartType] = useState<SwitchableChartType>('Column');

  useEffect(() => {
    if (!open) {
      return;
    }
    setViewMode(initialViewMode);
    setSelectedChartType(initialSelectedChartType);
  }, [initialSelectedChartType, initialViewMode, open]);

  const chartOptions = useMemo(
    () => getChartOptionsByType(canSwitchChartType ? selectedChartType : rawChartType, true),
    [canSwitchChartType, getChartOptionsByType, rawChartType, selectedChartType]
  );

  const modalTableColumns = useMemo(() => {
    const sourceColumns = Array.isArray(tableColumns) ? tableColumns : [];
    if (!sourceColumns.length) {
      return sourceColumns;
    }
    return transformTableColumns ? transformTableColumns(sourceColumns) : sourceColumns;
  }, [tableColumns, transformTableColumns]);

  const chartMenuItems = useMemo<MenuProps['items']>(
    () =>
      SWITCHABLE_TARGET_CHART_TYPES.map(item => ({
        key: item,
        icon: getChartTypeIcon(item),
        label: getChartTypeLabel(item),
      })),
    []
  );

  const currentActiveKey = viewMode === 'table' ? 'table' : selectedChartType;

  const renderToolbar = () => {
    if (canSwitchChartType) {
      return (
        <div className={styles.modalSwitcher}>
          {MODAL_SWITCHER_OPTIONS.map(item => (
            <Button
              key={item.key}
              size="small"
              type={currentActiveKey === item.key ? 'primary' : 'default'}
              className={styles.modalSwitcherButton}
              icon={item.icon}
              onClick={() => {
                if (item.key === 'table') {
                  setViewMode('table');
                  return;
                }
                setSelectedChartType(item.key as SwitchableChartType);
                setViewMode('chart');
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      );
    }

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
      </div>
    );
  };

  return (
    <Modal
      open={open}
      title={
        <div className={styles.previewTitle} title={title}>
          {title}
        </div>
      }
      width={width}
      centered
      footer={null}
      destroyOnHidden
      onCancel={onCancel}
    >
      <div className={styles.outputPanel}>
        <div className={styles.outputHeader}>{renderToolbar()}</div>
        <div className={styles.outputBody}>
          {viewMode === 'chart' ? (
            <DipEcharts className={styles.outputChart} style={{ height: '100%' }} options={chartOptions} notMerge />
          ) : (
            <ADTable autoScrollY size="small" showHeader={false} columns={modalTableColumns} dataSource={tableData} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ChartPreviewModal;
