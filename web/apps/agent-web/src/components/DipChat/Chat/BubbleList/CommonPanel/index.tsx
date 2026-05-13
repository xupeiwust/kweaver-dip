import styles from './index.module.less';
import { useDipChatStore } from '@/components/DipChat/store';
import PanelFooter from '@/components/DipChat/Chat/BubbleList/PanelFooter';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import SqlToolPanel from './SqlToolPanel';
import ChartToolPanel from './ChartToolPanel';
import CodeToolPanel from './CodeToolPanel';
import NGQLToolPanel from './NGQLToolPanel';
import Markdown from '@/components/Markdown';
import { Collapse, Skeleton, Spin } from 'antd';
import ShinyText from '@/components/animation/ShinyText';
import type { ChatBody, DipChatItemContentProgressType, DipChatItemContentType } from '@/components/DipChat/interface';
import DipIcon from '@/components/DipIcon';
import _ from 'lodash';
import InterruptFormPanel from './InterruptFormPanel';
import CommonToolPanel from './CommonToolPanel';
import DocQaToolPanel from './DocQaToolPanel';
import NetSearchToolPanel from './NetSearchToolPanel';
import MetricToolPanel from './MetricToolPanel';
import AgentIcon from '@/components/AgentIcon';
import { nanoid } from 'nanoid';
import intl from 'react-intl-universal';
import LLMPanel from './LLMPanel';
import dayjs from 'dayjs';
import { DownOutlined, LoadingOutlined, UpOutlined } from '@ant-design/icons';
import SwitchableChartPanel from './ChartToolPanel/SwitchableChartPanel';

const CommonPanel = ({ chatItemIndex, readOnly }: any) => {
  const {
    dipChatStore: { chatList, streamGenerating, agentDetails },
    openSideBar,
    sendChat,
  } = useDipChatStore();
  const chatItem = chatList[chatItemIndex];
  const { generating, interrupt, cancel } = chatItem;
  const content: DipChatItemContentType = chatItem.content || { progress: [], cites: {}, related_queries: [] };
  const hasInterrupt = !_.isEmpty(interrupt) && !!interrupt.data && chatItemIndex === chatList.length - 1 && !cancel;
  const hasProgress = content.progress?.length > 0;
  const hasProcessPanel = hasProgress || hasInterrupt;
  const [processExpanded, setProcessExpanded] = useState(Boolean(generating && hasProgress));
  const processManualRef = useRef(false);
  const skeletonLoading = !content?.progress?.length && streamGenerating && chatItemIndex === chatList.length - 1;

  useEffect(() => {
    if (!hasProcessPanel) {
      processManualRef.current = false;
      setProcessExpanded(false);
      return;
    }
    if (hasInterrupt) {
      setProcessExpanded(true);
      return;
    }
    if (!processManualRef.current) {
      setProcessExpanded(Boolean(generating));
    }
  }, [generating, hasInterrupt, hasProcessPanel]);

  const renderFooter = () => {
    if (!generating && !readOnly) {
      return <PanelFooter className="dip-mt-8" chatItemIndex={chatItemIndex} />;
    }
  };
  const renderStopGenerate = () => {
    if (chatItem.cancel) {
      return (
        <div
          className={classNames(' dip-mt-16', {
            'dip-text-color-45': true,
          })}
        >
          {intl.get('dipChat.stoppedOutput')}
        </div>
      );
    }
  };

  const renderDeepThink = (thinkText: string, loading: boolean) => {
    if (thinkText) {
      return (
        <div className="dip-mb-12">
          <Collapse
            expandIconPosition="end"
            defaultActiveKey={['1']}
            ghost
            items={[
              {
                key: '1',
                label: (
                  <div className="dip-flex-align-center">
                    <DipIcon className="dip-text-color-45" type="icon-dip-think" />
                    <ShinyText
                      loading={loading ?? false}
                      className="dip-ml-8"
                      text={loading ? intl.get('dipChat.thinking') : intl.get('dipChat.deepThinking')}
                    />
                  </div>
                ),
                children: (
                  <div>
                    <Markdown className={styles.deepThinkMarkdown} value={thinkText ?? ''} readOnly />
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }
  };

  const renderCites = () => {
    const cites = content?.cites;
    if (!_.isEmpty(cites)) {
      let total: number = 0;
      cites.forEach((item: any) => {
        if (item.children && Array.isArray(item.children)) {
          total += item.children.length;
        }
      });
      const loading = streamGenerating && chatItemIndex === chatList.length - 1;
      return (
        <div
          onClick={() => {
            if (total > 0 && !readOnly) {
              openSideBar(chatItemIndex);
            }
          }}
          className={classNames(styles.title, 'dip-mb-16 dip-flex-align-center dip-flex-item-full-width')}
        >
          <DipIcon className="dip-font-16" type="icon-dip-net" />
          <ShinyText
            loading={loading}
            className="dip-ml-8 dip-flex-item-full-width dip-ellipsis"
            text={
              loading
                ? intl.get('dipChat.readingDocs', { count: total })
                : intl.get('dipChat.foundDocs', { count: total })
            }
          />
        </div>
      );
    }
  };

  const renderIcon = () => {
    return (
      <AgentIcon
        avatar_type={agentDetails.avatar_type}
        avatar={agentDetails.avatar}
        size={30}
        name={agentDetails.name}
      />
    );
  };

  const renderInterrupt = () => {
    if (hasInterrupt) {
      return (
        <div className="dip-mt-16">
          <InterruptFormPanel chatItemIndex={chatItemIndex} />
        </div>
      );
    }
  };

  const onlineSearchCites =
    content.progress.find(
      progressItem =>
        progressItem.type === 'net_search_tool' && progressItem.skillInfo?.name === 'online_search_cite_tool'
    )?.netSearchResult?.cites ?? [];

  const renderProgressItem = (item: DipChatItemContentProgressType, progressIndex: number) => {
    let toolResult: any;
    switch (item.type) {
      case 'metric_tool':
        toolResult = (
          <MetricToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'sql_tool':
        toolResult = (
          <SqlToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'chart_tool':
        toolResult = (
          <ChartToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'code_tool':
        toolResult = (
          <CodeToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'ngql_tool':
        toolResult = (
          <NGQLToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'docQa_tool':
        toolResult = (
          <DocQaToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'common_tool':
        toolResult = (
          <CommonToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      case 'net_search_tool':
        toolResult = (
          <NetSearchToolPanel
            key={progressIndex}
            chatItemIndex={chatItemIndex}
            progressIndex={progressIndex}
            progressItem={item}
            readOnly={readOnly}
          />
        );
        break;
      default: {
        const loading = streamGenerating && chatItemIndex === chatList.length - 1 && !item.llmResult?.text;
        toolResult = (
          <div key={progressIndex}>
            {renderDeepThink(item.llmResult?.thinking || '', loading)}
            <LLMPanel
              isLLMProcess={!item.llmResult?.thinking && !item.llmResult?.text}
              status={item.status}
              text={item.llmResult?.text}
              cites={onlineSearchCites}
              consumeTime={item.consumeTime}
            />
          </div>
        );
        break;
      }
    }
    return toolResult;
  };

  const renderProcessPanel = () => {
    if (!hasProcessPanel) {
      return null;
    }
    return (
      <div className="dip-mb-16" style={{ borderBottom: processExpanded ? 'none' : 'solid 1px #D9D9D9' }}>
        <Collapse
          className={styles.processCollapse}
          activeKey={processExpanded ? ['process'] : []}
          expandIconPosition="end"
          expandIcon={({ isActive }) => (
            <span className={styles.processArrow}>{isActive ? <UpOutlined /> : <DownOutlined />}</span>
          )}
          onChange={keys => {
            processManualRef.current = true;
            setProcessExpanded(Array.isArray(keys) ? keys.includes('process') : !!keys);
          }}
          items={[
            {
              key: 'process',
              label: (
                <div className={styles.processHeader}>
                  <span className="dip-flex-item-full-width dip-flex-align-center">
                    <span
                      title={intl.get('dipChat.runningProcess')}
                      className={classNames(styles.processHeaderText, 'dip-ellipsis')}
                    >
                      {intl.get('dipChat.runningProcess')}
                    </span>
                  </span>
                  <span className={styles.processHeaderMeta}>
                    {generating && !cancel && <Spin size="small" indicator={<LoadingOutlined spin />} />}
                    {!generating && !cancel && !!content.totalTime && (
                      <span className={styles.processHeaderTime}>
                        {intl.get('dipChat.consumeTime')}
                        {content.totalTime}s
                      </span>
                    )}
                    <span className={styles.processHeaderView}>{intl.get('dipChat.view')}</span>
                  </span>
                </div>
              ),
              children: (
                <div className={styles.processContent}>
                  {content.progress.map(renderProgressItem)}
                  {renderInterrupt()}
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  };

  const renderFinalAnswer = () => {
    if (generating || (!content.finalAnswer?.text && !content.finalAnswer?.chartResult)) {
      return null;
    }
    return (
      <>
        {content.finalAnswer?.text && (
          <LLMPanel
            isLLMProcess={false}
            status="completed"
            text={content.finalAnswer.text}
            cites={onlineSearchCites}
            consumeTime={content.totalTime}
          />
        )}
        {content.finalAnswer?.chartResult && (
          <div className="dip-mb-16">
            <SwitchableChartPanel
              chartResult={content.finalAnswer.chartResult}
              previewTitle={content.finalAnswer.chartResult.rawChartResult?.title || intl.get('dipChat.finalAnswerChart')}
              showChartTitle
              transformTableColumns={columns =>
                columns.map((column, index) => {
                  if (index === 1) {
                    return {
                      ...column,
                      width: 500,
                    };
                  }

                  return column;
                })
              }
            />
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (skeletonLoading) {
      return (
        <div>
          <div className="dip-flex-align-center">
            {renderIcon()}
            <ShinyText
              loading={streamGenerating && chatItemIndex === chatList.length - 1}
              className="dip-ml-8"
              text={intl.get('dipChat.generating')}
            />
          </div>
          <div className="dip-pl-20">
            <Skeleton className="dip-mt-16" loading={skeletonLoading} active>
              <Markdown value={''} readOnly />
            </Skeleton>
          </div>
        </div>
      );
    }

    /** 渲染相关问题 */
    const renderRelatedQueries = () => {
      if (!skeletonLoading && !readOnly && content?.related_queries && chatItemIndex === chatList.length - 1) {
        return (
          <div className="dip-mt-16">
            {content?.related_queries.map((item: string, index: number) => (
              <div
                key={index}
                title={item}
                className={classNames(styles.relatedQueries, 'dip-ellipsis dip-flex-align-center')}
                onClick={() => {
                  const cloneChatList = _.cloneDeep(chatList);
                  cloneChatList.push({
                    key: nanoid(),
                    role: 'user',
                    content: item,
                    loading: false,
                    updateTime: dayjs().valueOf(),
                  });
                  cloneChatList.push({
                    key: nanoid(),
                    role: 'common',
                    content: '',
                    loading: true,
                  });
                  const body: ChatBody = { query: item };
                  sendChat({
                    chatList: cloneChatList,
                    body,
                    activeChatItemIndex: -1,
                  });
                }}
              >
                {item}
              </div>
            ))}
          </div>
        );
      }
    };

    return (
      <div className="dip-flex">
        {renderIcon()}
        <div className={classNames('dip-ml-16 dip-flex-item-full-width')}>
          {renderCites()}
          {renderProcessPanel()}
          {renderFinalAnswer()}
          {renderStopGenerate()}
          {renderFooter()}
          {renderRelatedQueries()}
        </div>
      </div>
    );
  };
  return <div className={styles.container}>{renderContent()}</div>;
};

export default CommonPanel;
