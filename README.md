# dsh-mc-companion-ui

`dsh-mc-companion` 的 DSH Web UI 半边。

配套仓库：

- 主插件：https://github.com/banbixieyang/dsh-mc-companion
- Agent 预设：https://github.com/banbixieyang/dsh-mc-companion-preset

- 左侧栏 **MC 陪伴** 面板：状态 HUD、模式/连接、跟随、工作状态（探索/伐木/采矿/打怪）、聊天与 AI 实时回复、建造进度；
- 输入框下方状态条：模式启用后显示在线/血量/坐标/当前行为/最后聊天；
- 数据来自主插件在预设内注册的 `/api/mc-companion/state|action`。

## 安装

```bash
git clone https://github.com/banbixieyang/dsh-mc-companion-ui.git
```

```text
plugin_manager install_bundle target=<你的路径>\dsh-mc-companion-ui
```

安装后刷新页面，左侧栏通常立即出现「MC 陪伴」；如果没有，重启 DSH 后再刷新。
输入框下方状态条只在模式启用后显示。

## 依赖关系

- 本包只提供 Host 空行 + 浏览器面板，不碰 Bot；
- Bot 数据接口由 `dsh-mc-companion`（在 `dsh-mc-companion-preset` 里挂载）提供；
- 如果面板显示「接口不可用」，说明预设/主插件还没加载或被禁用。

## 面板内容

- **状态**：模式开关、Bot HUD（生命/饥饿/坐标/维度）、连接/断开；
- **空窗自律**：总开关 + 进食 / 还手 / 逃跑 / 捡拾 / 重生 / 跟上主人 六个分项，以及最近一次自律反应；
- **背包与动作**：手持、食物数、方块数、空位，以及「吃东西 / 拿武器 / 戴头盔 / 打最近的怪 / 捡东西 / 重生」按钮；
- **行为**：探索 / 伐木 / 采矿 / 打怪 的开关与目标量；
- **跟随、聊天、建造进度、事件流**。

所有按钮都走主插件的同源接口 `/api/mc-companion/action`（`autopilot.set`、`inventory.*`、`act.*`），
不额外开端口，也不引入 websocket。

## 安全

- 面板操作只给 DSH 用户使用；
- 游戏内聊天中的命令样式消息会被主插件的实时聊天逻辑跳过；
- UI 不提供“让游戏内玩家开启工作状态”的入口。

