import DipChat from '@/components/DipChat';
import { type AiInputValue } from '@/components/DipChat/components/AiInput/interface';
import { type DipChatItem } from '@/components/DipChat/interface';
import { useMicroWidgetProps } from '@/hooks';
import { getParam } from '@/utils/handle-function';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const AgentUsage = () => {
  const location = useLocation();
  const microWidgetProps = useMicroWidgetProps();

  useEffect(() => {
    microWidgetProps?.toggleSideBarShow?.(false);
    return () => {
      microWidgetProps?.toggleSideBarShow?.(true);
    };
  }, []);

  const agentInfo = useMemo(() => {
    // 说明是其他微应用通过 navigate 跳转进入 Agent 使用页面
    let aiInputValue = location.state as AiInputValue;
    const url = new URL(window.location.href);

    // 如果 location.state 为空，尝试从 URL 参数中获取 state 数据
    if (_.isEmpty(aiInputValue)) {
      const stateParam = getParam('state');
      if (stateParam) {
        try {
          aiInputValue = JSON.parse(decodeURIComponent(stateParam));
          url.searchParams.delete('state');
          window.history.pushState({}, '', url.toString());
        } catch {
          // 忽略解析异常，继续使用默认逻辑
        }
      }
    }

    if (_.isEmpty(aiInputValue)) {
      const questionKey = getParam('questionKey');
      if (questionKey) {
        try {
          const questionValue = sessionStorage.getItem(questionKey);
          if (questionValue) {
            aiInputValue = {
              mode: 'normal',
              inputValue: questionValue,
              deepThink: false,
            };
            sessionStorage.removeItem(questionKey);
          }
        } catch {
          // 忽略读取 sessionStorage 异常，继续使用默认逻辑
        } finally {
          url.searchParams.delete('questionKey');
          window.history.pushState({}, '', url.toString());
        }
      }
    }

    const objData: any = {
      agentId: getParam('id'),
      agentVersion: getParam('version'),
      agentAppType: getParam('agentAppType'),
    };

    if (!_.isEmpty(aiInputValue)) {
      const cloneChatList: DipChatItem[] = [];
      cloneChatList.push({
        key: nanoid(),
        role: 'user',
        content: aiInputValue.inputValue,
        loading: false,
        fileList: aiInputValue.fileList,
      });
      cloneChatList.push({
        key: nanoid(),
        role: 'common',
        content: '',
        loading: true,
      });
      objData.defaultChatList = cloneChatList;
      objData.defaultAiInputValue = aiInputValue;
    }

    return objData;
  }, []);

  return <DipChat {...agentInfo} />;
};

export default AgentUsage;
