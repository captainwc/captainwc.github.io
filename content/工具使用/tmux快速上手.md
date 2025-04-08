---
title: tmux 快速上手
categories: [工具使用]
date: 2025-04-08
series: [快速上手]
tags: [tmux]
---

# Tmux 快速上手

tmux是一个著名的终端复用工具

## 安装配置

[Releases · tmux/tmux](https://github.com/tmux/tmux/releases)，如果安装不了，或者C库版本不支持，可以直接下载 [静态的tmux版本 - tmux3.3a](https://gitee.com/kaikaixixi/modernunix/raw/main/linux-x86_64/static/tmux)

配置，可以参考我的配置： [.dotfiles/.config/tmux at main · captainwc/.dotfiles](https://github.com/captainwc/.dotfiles/tree/main/.config/tmux)，将 `tmux.conf`和`tmux.conf.local`放到`~/.local/tmux`中。如果版本不支持，可以用一个简单版本的 `.tmux.conf.only-one-for-lower-version` 放到 `~/.tmux.conf`

如果安装了[Nerd Fonts](https://www.nerdfonts.com/cheat-sheet)后图标仍然显示不对，可以试下是否是没有 `export LANG=en_US.UTF-8`

## 核心概念

1. 会话（session）
2. 窗口（window）
3. 窗格（pane）

## 快捷键

- **ctrl+b d** — 分离当前会话（让它在后台运行）
- **ctrl+b %** — 左右分屏
- **ctrl+b "** — 上下分屏
- **ctrl+b c** — 创建新的 **window**
- **ctrl+b w** — 查看所有的 **window**
- **ctrl+b n** or **p** — 切换到下一个或者上一个 **window**
- **ctrl+b 1 (2,3...)** — 移动到指定的**window**，通过 index
- **ctrl+b q** — 查看 **pane** 的标号
- **ctrl+b Arrow Key** (Left, Right, Up, Down) — 切换当前活动 **pane**
- **ctrl+b x** — 关闭 **pane**
- **ctrl+b :** — 命令行执行命令（支持tab补全）
- **ctrl+b ?** — 查看所有的快捷键，按下 **q** 退出



## 命令

`tmux ls` 列出所有的tmux会话

`tmux new-session/window -s [name]`or `tmux new/neww -s [name]`创建

`tmux kill-session/window/pane/server -t [name]` 关闭

`tmux attach -t [name]` 附着到运行着的会话上

其他的命令直接参见脚本

## 脚本

- tmux中的命名原则: `[session_name]:[window_name/index].[pane_name/index]`
- pane和window的默认编号都是**从1开始**（网上看到很多教程说是从0开始，但是，怎么说呢，实践出真知吧。反正我用的tmux3.2a是从1开始编号的）
- `C-m` 就是回车的意思

下面是一个完整的tmux脚本，可以体会下怎么做到分屏的

```bash
## 最终布局:
# |   | 2 |
# | 1 |   |
# |   | 3 |

# 新建一个后台会话，-d 指定后台运行，-s 指定会话名称
tmux new-session -d -s client_server_test

# 默认会创建一个window，index是1，所以直接选择 1 然后重命名就好。-t指定选中的目标
tmux rename-window -t client_server_test:1 cs-window

# 想要第二个window的话，也可以创建。 -t 指定会话名， -n 指定了 window 的 name
# tmux new-window -t client_server_test -n cs-window

# 对窗口cs-window的 1号 pane（唯一一个）进行垂直分屏
tmux split-window -h -t client_server_test:cs-window.1

# 对cs-window的 2号 pane进行水平分屏（也即在右半部分上下分屏） -p 指定了新的 pane的尺寸百分比。
tmux split-window -v -t client_server_test:cs-window.2 -p 80

# 在左侧运行第一个程序
tmux send-keys -t client_server_test:cs-window.1 '/home/shuaikai/codes/quick-cmake/build/bin/serverTest' C-m

# 等待 serverTest 初始化完成
sleep 1

# 在右侧上方运行第二个程序
tmux send-keys -t client_server_test:cs-window.2 '/home/shuaikai/codes/quick-cmake/build/bin/client' C-m

# 在右侧下方运行第三个程序
tmux send-keys -t client_server_test:cs-window.3 '/home/shuaikai/codes/quick-cmake/build/bin/client' C-m

# 附加到 tmux 会话
tmux attach-session -t client_server_test

```

上面的对 window 也进行了重命名和指定。如果你不关心多个window的话，直接找准pane然后进行分屏也是可以的

```bash
tmux new-session -d -s client_server_test

# =>
# 1 | 2
tmux split-window -h

# =>
# 1 | 2
#     3
tmux select-pane -t 2
tmux split-window -v -p 80

# 直接选中 pane进行操作
tmux select-pane -t 1
tmux send-keys '/home/shuaikai/codes/quick-cmake/build/bin/serverTest' C-m
sleep 1

tmux select-pane -t 2
tmux send-keys '/home/shuaikai/codes/quick-cmake/build/bin/client' C-m
tmux select-pane -t 3
tmux send-keys '/home/shuaikai/codes/quick-cmake/build/bin/client' C-m

tmux attach-session -t client_server_test
```

