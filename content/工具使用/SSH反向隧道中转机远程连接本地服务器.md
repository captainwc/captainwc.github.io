---
title: SSH反向隧道中转机-远程连接本地服务器
categories: [工具使用]
date: 2025-06-16
tags: [ssh]
---


# SSH反向隧道中转机-远程连接本地服务器

> [!idea] Intro
>
> 考虑下面这个场景：你有一台性能强劲的本地主机，但是没有公网IP；一台云服务器，可以远程访问（不一定要求独立公网IP），但是性能不咋滴。本地主机和远程的你，都认识云服务器，但是你俩互相不认识，这实在是让人扼腕叹息。有没有解决方案呢？
>
> 有的，本文介绍的SSH反向隧道就是这么个中间人

## 快速开始

1. 提前在**本地服务器**上执行 `ssh -N -R 22222:localhost:22 [cloud-username]@[cloud-hostname]`
2. 需要时，**要远程访问的主机上**，ssh连接到云服务器（`ssh [cloud-username]@[cloud-hostname]`）
3. 然后在**云服务器**上执行 `ssh -p 22222 [local-server-username]@localhost`

即可实现从任意机器访问到那台本地主机。中间并没有要求云服务器有独立的公网IP，只要能远程SSH上就行。

注意，2，3可以合并成一步，即通过 `-J`指定跳转路径：

`ssh  [-p [port]] -J [cloud-username]@[cloud-hostname]:[port] [local-server-username]@localhost:[port]`

## 解释

### 参数说明

- `-N` 告诉 ssh 不执行命令，不启动shell，只用于端口转发
- `-R [bind_address:]远程端口:本地主机:本地端口`  将远程服务器的端口转发到本地端口
- `-J [user1@]jump_host1[:port1][,[user2@]jump_host2[:port2],...] [user@]final_target_host` 一步一步通过跳板机/堡垒机登录到最终的服务器



### 额外参数

#### 持久连接

如果需要一直保持连接，ssh加上如下参数

- `-o ServerAliveInterval=60 -o ServerAliveCountMax=3` 每六十秒发送一次保活包；允许连续三次保活失败才断开连接

#### 本地转发

与远程转发对应的还有本地转发

- `-L [bind_address:]本地端口:远程主机:远程端口` 将本地端口数据自动转发到远程端口

应用场景比如：

1. 有一台云服务器，它的端口3306上跑着服务，但是云服务器本身没有独立IP，只能通过ssh+用户名认证这种方式连接访问（比如vlab就是这样），你的应用客户端连接不上。那就可以在本地建立一个本地转发`ssh -L 3306:localhost:3306 sverver-name@sverver`，将本地的3306端口数据自动转发到远程的3306端口
2. 或者不是没法访问云服务器，但是云服务器上想要的端口被防火墙关了，只有22端口开着，那也可以通过此方式绕开限制，往本地的端口发数据，让ssh将数据转发到云服务器的对应端口
3. 远程转发的应用则比如本文的，想在远程访问本地机器

不管是本地转发还是远程转发，`bind_address`一般都是`localhost`，默认省略，它表示服务器默认只监听本地地址。

不管是本地转发还是远程转发，`destination_host`一般都填`localhost`，它是从本地主机/云服务器角度能理解解析访问的地址



### 可能错误情形

（1）client_global_hostkeys_prove_confirm: server gave bad signature for ECDSA key 1: incorrect signature

试试跳过验证：`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`
