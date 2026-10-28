/**
 * dsh-mc-companion-preset · Client half.
 *
 * A live MC dashboard in the DSH Web UI:
 *   - sidebar panel: mode, bot HUD, follow, work behaviours (explore/woodcut/
 *     mine/fight), real-time in-game chat, build progress;
 *   - composer dock: compact status strip inside every session;
 *   - data comes from the Host's same-origin `/api/mc-companion/*`, no second
 *     port and no websocket.
 *
 * Safety: this UI is for the DSH user. It never turns game chat into commands;
 * the Host's auto-chat only produces text and skips command-like lines.
 */
window.__ModuleLoader__.load({
  id: 'dsh-mc-companion-ui',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React

    const API = '/api/mc-companion'

    const CSS = `
      .mc-panel { height:100%; overflow:auto; padding:18px 20px 44px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); font-size:13px; line-height:1.5; }
      .mc-wrap { max-width: 980px; margin: 0 auto; }
      .mc-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:4px; }
      .mc-title { font-size:19px; font-weight:700; letter-spacing:.2px; display:flex; align-items:center; gap:8px; }
      .mc-sub { color:var(--dsw-alias-label-secondary); font-size:12px; margin-bottom:14px; }
      .mc-dot { width:8px; height:8px; border-radius:50%; background:var(--dsw-alias-label-secondary); display:inline-block; }
      .mc-dot.on { background:#38c172; box-shadow:0 0 0 3px rgba(56,193,114,.18); }
      .mc-dot.warn { background:#f0a84a; }
      .mc-actions { display:flex; gap:8px; flex-wrap:wrap; }
      .mc-btn { border:1px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:7px; padding:5px 11px; font-size:12px; cursor:pointer; }
      .mc-btn:hover { border-color:var(--dsw-alias-brand-primary); }
      .mc-btn:disabled { opacity:.45; cursor:not-allowed; }
      .mc-btn.primary { background:#247bbf; border-color:#247bbf; color:#fff; font-weight:600; }
      .mc-btn.primary:hover { background:#2c8fd0; border-color:#2c8fd0; }
      .mc-btn.danger { color:var(--dsw-alias-state-error-primary); }
      .mc-btn.sm { padding:3px 8px; font-size:11px; }
      .mc-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:12px 0 16px; }
      .mc-stat { border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-layer-1); padding:9px 11px; }
      .mc-stat b { display:block; font-size:15px; font-weight:650; margin-top:2px; }
      .mc-stat span { color:var(--dsw-alias-label-secondary); font-size:11px; }
      .mc-card { border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); padding:12px 14px; margin-bottom:14px; }
      .mc-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
      .mc-card-title { font-weight:650; font-size:13px; display:flex; align-items:center; gap:7px; }
      .mc-muted { color:var(--dsw-alias-label-secondary); font-size:12px; }
      .mc-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      .mc-field { display:flex; flex-direction:column; gap:3px; min-width:86px; }
      .mc-field label { color:var(--dsw-alias-label-secondary); font-size:11px; }
      .mc-input, .mc-select { background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); border:1px solid var(--dsw-alias-border-l2); border-radius:6px; padding:4px 6px; font-size:12px; box-sizing:border-box; min-width:0; }
      .mc-input.wide { flex:1; min-width:160px; }
      .mc-switch { position:relative; width:38px; height:21px; border-radius:11px; background:#3c4250; cursor:pointer; flex-shrink:0; transition:background .16s ease; }
      .mc-switch.on { background:#2b5cff; }
      .mc-switch.off { opacity:.55; cursor:not-allowed; }
      .mc-switch i { position:absolute; top:3px; left:3px; width:15px; height:15px; border-radius:50%; background:#fff; transition:left .16s ease; box-shadow:0 1px 2px rgba(0,0,0,.35); }
      .mc-switch.on i { left:20px; }
      .mc-beh-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
      .mc-beh { border:1px solid var(--dsw-alias-border-l1); border-radius:9px; padding:10px 11px; background:var(--dsw-alias-bg-base); }
      .mc-beh.active { border-color:var(--dsw-alias-brand-primary); }
      .mc-beh-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .mc-beh-title { font-weight:650; }
      .mc-progress { height:5px; border-radius:3px; background:var(--dsw-alias-border-l1); overflow:hidden; margin:7px 0 5px; }
      .mc-progress > i { display:block; height:100%; background:var(--dsw-alias-brand-primary); }
      .mc-chat-feed { max-height:230px; overflow:auto; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; padding:7px 9px; background:var(--dsw-alias-bg-base); margin-bottom:8px; }
      .mc-chat-line { padding:2px 0; font-size:12px; word-break:break-word; }
      .mc-chat-line .who { color:var(--dsw-alias-brand-primary); font-weight:600; margin-right:5px; }
      .mc-chat-line.out .who { color:#38c172; }
      .mc-chat-line .tag { margin-left:5px; font-size:10px; border:1px solid var(--dsw-alias-border-l2); border-radius:999px; padding:0 5px; color:var(--dsw-alias-label-secondary); }
      .mc-chat-line .tag.warn { color:#f0a84a; border-color:#f0a84a; }
      .mc-empty { color:var(--dsw-alias-label-secondary); font-size:12px; padding:6px 0; }
      .mc-error { border:1px solid var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); border-radius:8px; padding:7px 9px; margin:8px 0; font-size:12px; }
      .mc-events { margin:0; padding-left:16px; max-height:180px; overflow:auto; }
      .mc-events li { color:var(--dsw-alias-label-secondary); font-size:11px; margin:2px 0; word-break:break-word; }
      .mc-dock { display:flex; align-items:center; gap:9px; padding:5px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.3; }
      .mc-dock .mc-dot { width:7px; height:7px; }
      .mc-dock b { color:var(--dsw-alias-label-primary); font-weight:600; }
      .mc-dock .chat { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:46ch; }
      .mc-dock .sep { opacity:.45; }
    `

    async function request(path, options) {
      const response = await fetch(API + path, {
        cache: 'no-store',
        ...options,
        headers: {
          ...(options && options.body ? { 'content-type': 'application/json' } : {}),
          ...((options && options.headers) || {}),
        },
      })
      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }
      if (!response.ok || !data || data.ok === false) {
        throw new Error((data && data.error) || `HTTP ${response.status}`)
      }
      return data
    }

    function useLive(intervalMs) {
      const [state, setState] = useState(null)
      const [error, setError] = useState(null)
      const busy = useRef(false)
      const load = React.useCallback(async () => {
        if (busy.current) return
        busy.current = true
        try {
          const next = await request('/state')
          setState(next)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
        } finally {
          busy.current = false
        }
      }, [])
      useEffect(() => {
        let alive = true
        const tick = () => {
          if (alive) load()
        }
        tick()
        const timer = setInterval(tick, intervalMs)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [load, intervalMs])
      return { state, error, reload: load }
    }

    function Switch({ checked, disabled, onChange }) {
      const on = checked === true
      return h('div', {
        className: `mc-switch${on ? ' on' : ''}${disabled ? ' off' : ''}`,
        role: 'switch',
        'aria-checked': on,
        'aria-disabled': Boolean(disabled),
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!disabled && onChange) onChange(!on)
        },
      }, h('i'))
    }

    function Btn({ children, onClick, disabled, kind, small }) {
      return h('button', {
        className: `mc-btn${kind ? ` ${kind}` : ''}${small ? ' sm' : ''}`,
        onClick,
        disabled: Boolean(disabled),
        type: 'button',
      }, children)
    }

    function Stat({ label, value }) {
      return h('div', { className: 'mc-stat' }, h('span', null, label), h('b', null, value))
    }

    function shortPosition(bot) {
      const p = bot && bot.position
      return p ? `${Math.round(p.x)}, ${Math.round(p.y)}, ${Math.round(p.z)}` : '—'
    }

    function fmtTime(at) {
      try {
        return new Date(at).toLocaleTimeString('zh-CN', { hour12: false })
      } catch {
        return ''
      }
    }

    function ErrorLine({ text }) {
      return text ? h('div', { className: 'mc-error' }, text) : null
    }

    function Head({ state, run, pending }) {
      const enabled = state.enabled === true
      const online = state.bot && state.bot.online === true
      return h('div', null,
        h('div', { className: 'mc-head' },
          h('div', { className: 'mc-title' },
            h('span', { className: `mc-dot${enabled ? (online ? ' on' : ' warn') : ''}` }),
            'MC 陪伴',
            h('span', { className: 'mc-muted' }, enabled ? (online ? '在线' : '已启用 · 未连接') : '模式关闭'),
          ),
          h('div', { className: 'mc-actions' },
            enabled
              ? h(Btn, { onClick: () => run('mode.disable'), disabled: Boolean(pending) }, '关闭模式')
              : h(Btn, { kind: 'primary', onClick: () => run('mode.enable'), disabled: Boolean(pending) }, '启用并上线'),
            enabled && !online ? h(Btn, { onClick: () => run('bot.connect'), disabled: Boolean(pending) }, '连接') : null,
            enabled && online ? h(Btn, { onClick: () => run('bot.disconnect'), disabled: Boolean(pending) }, '断开') : null,
          ),
        ),
        h('div', { className: 'mc-sub' },
          `${state.config.username} @ ${state.config.host}:${state.config.port}`,
          state.bot && state.bot.version ? ` · ${state.bot.version}` : '',
          state.config.owner ? ` · owner ${state.config.owner}` : ' · 未设置 owner',
          state.autoChat && state.autoChat.enabled ? ' · AI 实时聊天已开' : '',
        ),
      )
    }

    function Hud({ state }) {
      const bot = state.bot || {}
      return h('div', { className: 'mc-grid' },
        h(Stat, { label: '生命', value: bot.online ? `${bot.health ?? '?'} / 20` : '—' }),
        h(Stat, { label: '饥饿', value: bot.online ? `${bot.food ?? '?'} / 20` : '—' }),
        h(Stat, { label: '位置', value: bot.online ? shortPosition(bot) : '—' }),
        h(Stat, { label: '维度', value: bot.online ? String(bot.dimension || '?') : '—' }),
        h(Stat, { label: '模式', value: state.behavior && state.behavior.active ? state.behavior.mode : '待命' }),
        h(Stat, { label: '建造', value: state.build ? `${state.build.status} ${state.build.placed ?? 0}/${state.build.total ?? 0}` : '无' }),
      )
    }

    function FollowCard({ state, run, pending }) {
      const [player, setPlayer] = useState('')
      const [radius, setRadius] = useState(state.config.followRadius || 3)
      const following = state.bot && state.bot.follow
      return h('section', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' }, '跟随'),
          h('span', { className: 'mc-muted' }, following ? `跟随 ${following.player}（${following.radius} 格）` : '未跟随'),
        ),
        h('div', { className: 'mc-row' },
          h('div', { className: 'mc-field', style: { flex: '1 1 180px' } },
            h('label', null, '玩家名'),
            h('input', {
              className: 'mc-input wide',
              value: player,
              placeholder: state.config.owner || '输入玩家名',
              onChange: (event) => setPlayer(event.target.value),
            }),
          ),
          h('div', { className: 'mc-field' },
            h('label', null, '半径'),
            h('input', {
              className: 'mc-input',
              type: 'number',
              min: 1,
              max: 10,
              value: radius,
              onChange: (event) => setRadius(Number(event.target.value) || 3),
            }),
          ),
          h(Btn, {
            kind: 'primary',
            disabled: Boolean(pending) || !(state.bot && state.bot.online),
            onClick: () => run('follow.start', { player: player || state.config.owner, radius: Number(radius) || 3 }),
          }, '开始跟随'),
          h(Btn, {
            disabled: Boolean(pending) || !following,
            onClick: () => run('follow.stop'),
          }, '停止'),
        ),
      )
    }

    function BehaviorCard({ behavior, run, pending }) {
      const [amount, setAmount] = useState(behavior.defaults ? behavior.defaults.amount : 8)
      const [radius, setRadius] = useState(behavior.defaults ? behavior.defaults.radius : 32)
      const [targets, setTargets] = useState('')
      const [seconds, setSeconds] = useState(0)
      const active = behavior.active === true
      const paused = active && behavior.paused === true
      const canStart = !pending
      const toggle = (next) => {
        if (!next) {
          run('behavior.toggle', { mode: behavior.mode, on: false })
          return
        }
        const list = String(targets).split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean)
        run('behavior.toggle', {
          mode: behavior.mode,
          on: true,
          amount: Number(amount) || undefined,
          radius: Number(radius) || undefined,
          targets: list.length > 0 ? list : undefined,
          maxDurationMs: Number(seconds) > 0 ? Number(seconds) * 1000 : undefined,
        })
      }
      const showAmount = behavior.mode !== 'explore'
      const showTargets = behavior.mode === 'mine' || behavior.mode === 'fight'
      const pct = active && behavior.target > 0 ? Math.min(100, Math.round((behavior.progress / behavior.target) * 100)) : 0
      return h('div', { className: `mc-beh${active ? ' active' : ''}` },
        h('div', { className: 'mc-beh-head' },
          h('div', { className: 'mc-beh-title' }, behavior.label),
          h(Switch, { checked: active, disabled: Boolean(pending), onChange: toggle }),
        ),
        h('div', { className: 'mc-muted', style: { margin: '2px 0 7px' } }, behavior.description),
        h('div', { className: 'mc-row', style: { gap: 6 } },
          showAmount ? h('div', { className: 'mc-field' },
            h('label', null, '数量'),
            h('input', {
              className: 'mc-input', type: 'number', min: 1, max: 128, value: amount,
              disabled: active,
              onChange: (event) => setAmount(Number(event.target.value) || 1),
            }),
          ) : null,
          h('div', { className: 'mc-field' },
            h('label', null, '半径'),
            h('input', {
              className: 'mc-input', type: 'number', min: 4, max: 64, value: radius,
              disabled: active,
              onChange: (event) => setRadius(Number(event.target.value) || 32),
            }),
          ),
          h('div', { className: 'mc-field' },
            h('label', null, '时长(秒)'),
            h('input', {
              className: 'mc-input', type: 'number', min: 0, max: 3600, value: seconds,
              disabled: active,
              onChange: (event) => setSeconds(Number(event.target.value) || 0),
            }),
          ),
        ),
        showTargets ? h('div', { className: 'mc-field', style: { marginTop: 6 } },
          h('label', null, behavior.mode === 'fight' ? '生物名（逗号分隔）' : '方块名（逗号分隔，留空用默认矿石）'),
          h('input', {
            className: 'mc-input wide', value: targets, disabled: active,
            placeholder: behavior.mode === 'fight' ? 'zombie, skeleton' : 'iron_ore, coal_ore',
            onChange: (event) => setTargets(event.target.value),
          }),
        ) : null,
        active ? h('div', null,
          h('div', { className: 'mc-progress' }, h('i', { style: { width: `${pct}%` } })),
          h('div', { className: 'mc-muted' },
            `${behavior.progress}${behavior.target > 0 ? ` / ${behavior.target}` : ''} ${behavior.unit || ''}`,
            behavior.phase ? ` · ${behavior.phase}` : '',
          ),
          h('div', { className: 'mc-row', style: { marginTop: 7 } },
            h(Btn, {
              small: true,
              disabled: Boolean(pending) || paused,
              onClick: () => run('behavior.pause'),
            }, '暂停'),
            h(Btn, {
              small: true,
              disabled: Boolean(pending) || !paused,
              onClick: () => run('behavior.resume'),
            }, '继续'),
            h(Btn, {
              small: true,
              kind: 'danger',
              disabled: Boolean(pending),
              onClick: () => run('behavior.stop'),
            }, '停止'),
          ),
        ) : null,
      )
    }

    function Behaviors({ state, run, pending }) {
      const behaviors = Array.isArray(state.behaviors) ? state.behaviors : []
      return h('section', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' }, '工作状态'),
          h('span', { className: 'mc-muted' }, '开关由你控制；游戏内聊天不能开启这些'),
        ),
        behaviors.length === 0
          ? h('div', { className: 'mc-empty' }, '没有可用的工作状态')
          : h('div', { className: 'mc-beh-grid' },
              ...behaviors.map((behavior) => h(BehaviorCard, {
                key: behavior.mode,
                behavior,
                run,
                pending,
              })),
            ),
      )
    }

    function ChatCard({ state, run, pending }) {
      const [draft, setDraft] = useState('')
      const [policy, setPolicy] = useState(state.autoChat ? state.autoChat.policy : 'addressed')
      const [seconds, setSeconds] = useState(Math.round((state.autoChat ? state.autoChat.minIntervalMs : 8000) / 1000))
      const feed = state.chat && Array.isArray(state.chat.feed) ? state.chat.feed : []
      const auto = state.autoChat || {}
      const send = () => {
        const text = draft.trim()
        if (!text) return
        run('chat.send', { message: text })
        setDraft('')
      }
      return h('section', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' }, '游戏内聊天'),
          h('div', { className: 'mc-row' },
            h('span', { className: 'mc-muted' }, 'AI 实时回复'),
            h(Switch, {
              checked: auto.enabled === true,
              disabled: Boolean(pending) || !state.enabled,
              onChange: (next) => run('autochat.set', {
                enabled: next,
                policy,
                minIntervalMs: Math.max(3, Number(seconds) || 8) * 1000,
              }),
            }),
          ),
        ),
        h('div', { className: 'mc-muted', style: { marginBottom: 7 } },
          '游戏内玩家可以聊天，但永远不能命令 Bot；像命令的话不会触发任何动作。',
          auto.error ? ` 最近错误：${auto.error}` : '',
        ),
        h('div', { className: 'mc-chat-feed' },
          feed.length === 0
            ? h('div', { className: 'mc-empty' }, '还没有聊天')
            : feed.map((line) => h('div', {
                key: line.id,
                className: `mc-chat-line${line.kind === 'out' ? ' out' : ''}`,
              },
                h('span', { className: 'who' }, line.kind === 'out' ? `[Bot${line.ai ? ' AI' : ''}]` : line.username),
                line.commandLike ? h('span', { className: 'tag warn' }, '命令/不会执行') : null,
                line.owner ? h('span', { className: 'tag' }, 'owner') : null,
                line.addressed ? h('span', { className: 'tag' }, '在叫 Bot') : null,
                ' ',
                line.message,
                h('span', { className: 'mc-muted', style: { marginLeft: 6 } }, fmtTime(line.at)),
              )),
        ),
        h('div', { className: 'mc-row' },
          h('input', {
            className: 'mc-input wide',
            value: draft,
            placeholder: '以 Bot 身份发一条聊天…',
            disabled: Boolean(pending) || !(state.bot && state.bot.online),
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') send()
            },
          }),
          h(Btn, {
            kind: 'primary',
            disabled: Boolean(pending) || !(state.bot && state.bot.online) || draft.trim().length === 0,
            onClick: send,
          }, '发送'),
        ),
        h('div', { className: 'mc-row', style: { marginTop: 8 } },
          h('div', { className: 'mc-field' },
            h('label', null, 'AI 回复范围'),
            h('select', {
              className: 'mc-select', value: policy,
              disabled: Boolean(pending) || auto.enabled === true,
              onChange: (event) => setPolicy(event.target.value),
            },
              h('option', { value: 'addressed' }, '只回被点名'),
              h('option', { value: 'all' }, '回所有普通聊天'),
            ),
          ),
          h('div', { className: 'mc-field' },
            h('label', null, '最小间隔(秒)'),
            h('input', {
              className: 'mc-input', type: 'number', min: 3, max: 60, value: seconds,
              disabled: Boolean(pending) || auto.enabled === true,
              onChange: (event) => setSeconds(Number(event.target.value) || 8),
            }),
          ),
          h('span', { className: 'mc-muted' }, `已回复 ${auto.replies || 0} 次；命令消息跳过 ${auto.skipped || 0} 条`),
        ),
      )
    }

    function BuildCard({ state, run, pending }) {
      const build = state.build
      if (!build) return null
      const total = Number(build.total) || 0
      const placed = Number(build.placed) || 0
      const pct = total > 0 ? Math.min(100, Math.round((placed / total) * 100)) : 0
      return h('section', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' }, `建造 · ${build.name || 'schematic'}`),
          h('span', { className: 'mc-muted' }, build.status),
        ),
        h('div', { className: 'mc-progress' }, h('i', { style: { width: `${pct}%` } })),
        h('div', { className: 'mc-row', style: { justifyContent: 'space-between' } },
          h('span', { className: 'mc-muted' }, `${placed}/${total} · 失败 ${build.failed || 0} · 跳过 ${build.skipped || 0}`),
          h(Btn, {
            small: true, kind: 'danger',
            disabled: Boolean(pending) || build.status !== 'running',
            onClick: () => run('build.cancel'),
          }, '取消建造'),
        ),
      )
    }

    function Events({ state }) {
      const events = Array.isArray(state.recentEvents) ? state.recentEvents.slice(-12).reverse() : []
      return h('section', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' }, h('div', { className: 'mc-card-title' }, '最近事件')),
        events.length === 0
          ? h('div', { className: 'mc-empty' }, '暂无事件')
          : h('ul', { className: 'mc-events' },
              ...events.map((event) => h('li', { key: event.seq },
                `${fmtTime(event.time)} · ${event.type} · ${event.message}`,
              )),
            ),
      )
    }


    const AUTOPILOT_ROWS = [
      ['eat', '自动进食', '饥饿≤阈值或饱食见底时吃东西'],
      ['defend', '被打还手', '受到伤害后反击附近敌对生物'],
      ['flee', '低血逃跑', '血量过低时远离怪物'],
      ['pickup', '捡掉落物', '空闲时走过去拾取附近掉落'],
      ['respawn', '自动重生', '死亡后自动重生'],
      ['followOwner', '跟上主人', '离得远了自动跟过去'],
    ]

    function AutopilotCard({ state, run, pending }) {
      const autopilot = state.autopilot || {}
      const patch = (key, value) => run('autopilot.set', { patch: { [key]: value } })
      const last = autopilot.lastAction
      return h('div', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' },
            h('span', { className: 'mc-dot' + (autopilot.enabled ? ' on' : '') }),
            '空窗自律',
          ),
          h('div', { className: 'mc-row' },
            h('span', { className: 'mc-muted' }, autopilot.running ? '运行中' : '已停止'),
            h(Switch, {
              checked: autopilot.enabled === true,
              disabled: pending === 'autopilot.set' || !state.enabled,
              onChange: (next) => patch('enabled', next),
            }),
          ),
        ),
        h('div', { className: 'mc-muted', style: { marginBottom: 8 } },
          '模型不控制时的基础反应；只吃/打/逃/捡/重生，不挖方块、不打玩家。'),
        h('div', { className: 'mc-muted', style: { marginBottom: 8 } },
          `进食条件：饥饿 ≤ ${autopilot.eatThreshold ?? '?'} 或饱食度见底 —— 当前饥饿 ${state.bot?.food ?? '?'}/20，饱食 ${state.bot?.saturation ?? '?'}，背包食物 ${state.inventory?.counts?.food ?? '?'} 个`),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 } },
          ...AUTOPILOT_ROWS.map(([key, label, hint]) =>
            h('div', { key, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 } },
              h('div', null,
                h('div', { style: { fontSize: 12 } }, label),
                h('div', { className: 'mc-muted', style: { fontSize: 11 } }, hint),
              ),
              h(Switch, {
                checked: autopilot[key] === true,
                disabled: pending === 'autopilot.set' || autopilot.enabled !== true,
                onChange: (next) => patch(key, next),
              }),
            ),
          ),
        ),
        last
          ? h('div', { className: 'mc-muted', style: { marginTop: 8 } }, `最近：${last.message}（${new Date(last.at).toLocaleTimeString()}）`)
          : h('div', { className: 'mc-muted', style: { marginTop: 8 } }, '还没有触发过自律反应。'),
      )
    }

    function InventoryCard({ state, run, pending }) {
      const inventory = state.inventory
      const online = state.bot && state.bot.online
      const held = inventory && inventory.held
      const counts = (inventory && inventory.counts) || {}
      const armor = (inventory && inventory.armor) || {}
      const armorText = Object.entries(armor).map(([slot, name]) => `${slot}:${name}`).join(' ')
      return h('div', { className: 'mc-card' },
        h('div', { className: 'mc-card-head' },
          h('div', { className: 'mc-card-title' }, '背包与动作'),
          h('div', { className: 'mc-row' },
            h(Btn, { small: true, disabled: !online || pending === 'inventory.eat', onClick: () => run('inventory.eat') }, '吃东西'),
            h(Btn, { small: true, disabled: !online || pending === 'inventory.equip', onClick: () => run('inventory.equip', { destination: 'hand' }) }, '拿武器'),
            h(Btn, { small: true, disabled: !online || pending === 'inventory.equip', onClick: () => run('inventory.equip', { destination: 'head' }) }, '戴头盔'),
          ),
        ),
        h('div', { className: 'mc-grid', style: { margin: '4px 0 10px' } },
          h(Stat, { label: '手持', value: held ? `${held.name}×${held.count}` : '空手' }),
          h(Stat, { label: '食物', value: counts.food ?? 0 }),
          h(Stat, { label: '方块', value: counts.blocks ?? 0 }),
          h(Stat, { label: '空位', value: inventory && inventory.freeSlots != null ? inventory.freeSlots : '?' }),
        ),
        armorText ? h('div', { className: 'mc-muted' }, `护甲：${armorText}`) : null,
        h('div', { className: 'mc-row', style: { marginTop: 8 } },
          h(Btn, { small: true, disabled: !online || pending === 'act.attack', onClick: () => run('act.attack', { radius: 4 }) }, '打最近的怪'),
          h(Btn, { small: true, disabled: !online || pending === 'act.collect', onClick: () => run('act.collect', { radius: 8 }) }, '捡东西'),
          h(Btn, { small: true, danger: true, disabled: !online || pending === 'act.respawn', onClick: () => run('act.respawn') }, '重生'),
        ),
      )
    }

    function Panel() {
      const { state, error, reload } = useLive(1000)
      const [pending, setPending] = useState('')
      const [actionError, setActionError] = useState('')

      const run = async (action, payload) => {
        setPending(action)
        setActionError('')
        try {
          await request('/action', {
            method: 'POST',
            body: JSON.stringify({ action, ...(payload || {}) }),
          })
          await reload()
        } catch (err) {
          setActionError(err instanceof Error ? err.message : String(err))
        } finally {
          setPending('')
        }
      }

      if (!state) {
        return h('div', { className: 'mc-panel' },
          h('div', { className: 'mc-wrap' },
            h('div', { className: 'mc-title' }, 'MC 陪伴'),
            error
              ? h('div', { className: 'mc-error' }, `面板接口不可用：${error}。请确认 MC 陪伴模式已安装并刷新页面。`)
              : h('div', { className: 'mc-empty' }, '正在连接 MC 面板…'),
          ),
        )
      }

      return h('div', { className: 'mc-panel' },
        h('div', { className: 'mc-wrap' },
          h(Head, { state, run, pending }),
          h(ErrorLine, { text: actionError }),
          h(Hud, { state }),
          h(AutopilotCard, { state, run, pending }),
          h(InventoryCard, { state, run, pending }),
          h(Behaviors, { state, run, pending }),
          h(FollowCard, { state, run, pending }),
          h(ChatCard, { state, run, pending }),
          h(BuildCard, { state, run, pending }),
          h(Events, { state }),
          h('div', { className: 'mc-muted', style: { marginTop: 10 } },
            '面板直接控制 Bot；游戏内聊天只用于社交。模式关闭后所有工作状态停止。',
          ),
        ),
      )
    }

    function Dock() {
      const { state } = useLive(2000)
      // Keep the composer clean unless the companion is actually enabled.
      if (!state || state.enabled !== true) return null
      const bot = state.bot || {}
      const behavior = state.behavior
      const last = state.chat && state.chat.feed && state.chat.feed.length > 0
        ? state.chat.feed[state.chat.feed.length - 1]
        : null
      return h('div', { className: 'mc-dock' },
        h('span', { className: `mc-dot${state.enabled ? (bot.online ? ' on' : ' warn') : ''}` }),
        h('b', null, state.enabled ? (bot.online ? 'MC 在线' : 'MC 已启用') : 'MC 关闭'),
        h('span', { className: 'sep' }, '·'),
        h('span', null, `HP ${bot.online ? (bot.health ?? '?') : '—'}/20`),
        h('span', { className: 'sep' }, '·'),
        h('span', null, bot.online ? shortPosition(bot) : '—'),
        behavior && behavior.active
          ? h('span', null,
              h('span', { className: 'sep' }, '·'),
              h('span', null, `${behavior.mode} ${behavior.progress || 0}${behavior.target ? `/${behavior.target}` : ''}`),
            )
          : null,
        last
          ? h('span', null,
              h('span', { className: 'sep' }, '·'),
              h('span', { className: 'chat' }, `${last.kind === 'out' ? 'Bot' : last.username}: ${last.message}`),
            )
          : null,
      )
    }

    function McIcon() {
      return h('svg', {
        width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true',
      },
        h('path', { d: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z' }),
        h('path', { d: 'M4 7.5 12 12l8-4.5M12 12v9' }),
        h('path', { d: 'M15.5 9.8c1.6 0 2.9 1.1 2.9 2.6 0 1.6-1.3 2.7-2.9 2.7h-1.2l-1.6 1.2v-1.6c-.8-.4-1.2-1.2-1.2-2.3 0-1.5 1.2-2.6 2.9-2.6z', transform: 'translate(1 -1) scale(.8)' }),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          if (typeof document === 'undefined') return undefined
          const id = 'dsh-mc-companion/panel.css'
          if (document.querySelector(`style[data-plugin-css="${id}"]`)) return undefined
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-mc-companion'
          tag.dataset.pluginCss = id
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'mc-companion: styles')

        try {
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
            name: 'sidebar.panellist',
            id: 'mc-companion',
            order: 3,
            label: () => 'MC 陪伴',
          }, McIcon))
        } catch { /* older UI without this slot */ }

        try {
          ctx.slots.inject('main', () => ctx.slots.register({
            name: 'main',
            key: 'mc-companion',
            label: () => 'MC 陪伴',
          }, Panel))
        } catch { /* older UI without this slot */ }

        try {
          ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
            name: 'conversation.composer.dock',
            id: 'mc-companion-status',
            order: 12,
            label: () => 'MC 状态',
          }, Dock))
        } catch { /* older UI without this slot */ }
      },
    }
  },
})

