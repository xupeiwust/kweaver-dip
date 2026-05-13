import React, { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
import classNames from 'classnames';
import { useDeepCompareEffect } from '@/hooks';
import ResizeObserver from '@/components/ResizeObserver';

export type DipEchartsProps = {
  className?: string;
  style?: CSSProperties;
  options: EChartsOption;
  notMerge?: boolean;
};

export type DipEchartsRef = {
  getEchartsInstance: () => ECharts;
};
const DipEcharts = forwardRef<DipEchartsRef, DipEchartsProps>((props, ref) => {
  const { className, style, options, notMerge = false } = props;
  const chartsInstance = useRef<ECharts>();
  const chartsWrapper = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    getEchartsInstance,
  }));

  const getEchartsInstance = () => chartsInstance.current!;

  useEffect(() => {
    chartsInstance.current = echarts.init(chartsWrapper.current);
    return () => {
      chartsInstance.current?.dispose();
    };
  }, []);

  useDeepCompareEffect(() => {
    if (!chartsInstance.current) {
      return;
    }
    chartsInstance.current.resize();
    chartsInstance.current.setOption(options, { notMerge });
    requestAnimationFrame(() => {
      chartsInstance.current?.resize();
    });
  }, [notMerge, options]);

  return (
    <ResizeObserver
      onResize={({ width, height, visible }) => {
        if (visible && width > 0 && height > 0) {
          chartsInstance.current?.resize({ width, height });
        }
      }}
    >
      <div className="dip-full">
        <div ref={chartsWrapper} style={style} className={classNames('dip-echarts dip-full', className)} />
      </div>
    </ResizeObserver>
  );
});

export default DipEcharts;
