# KWeaver DIP Web

本目录是 KWeaver DIP 的前端工程。如果涉及到修改应用层代码，进一步读取应用层目录下的 AGENTS.md。

## 目录结构

```
.
├── apps/                     # 应用层
│   └── agent-web/            # 决策智能体（Decision Agent）
│   └── business-system/      # 业务域管理
│   └── dataflow-web/         # 数据流和工作流管理
│   └── dip/                  # 数字员工平台
│   └── doc-audit-client/     # 审核待办
│   └── model-manageer/       # 模型管理
│   └── operator-web/         # 执行工厂（算子、工具、MCP）
│   └── vega/                 # 数据虚拟化引擎（数据源、视图管理）
├── packages/                 # 部署脚本及配置
│   └── components/           # 跨应用层复用的业务无关的基础组件/通用业务组件
│      └── src/           
│         └── components/     # 组件
│   └── i18n/                 # 通用国际化资源
│      └── error/             # 错误码资源
│   └── icons/                # 图标库
│      └── raw-svgs/          # 原始 SVG 图标文件
│         └── colored/        # 面性图标文件
│         └── outlined/       # 线性图标文件
│      └── preview/           # 图标预览 Web 页
│      └── src/               # 图标组件代码
│         └── components/     # 图标组件库
│            └── colored/     # 面性图标组件
│            └── outlined/    # 线性图标组件
│         └── shared/         # 图标组件基础组件
│   └── request/              # Axios 封装
│   └── utils/                # 工具函数库
```
