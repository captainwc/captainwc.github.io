---
date: 2023-09-12
title: windows安装wsl
categories: [环境配置]
---

# Windows 安装 wsl

> 本文简要介绍 WSL2 的自定义位置安装。比较简略，适合有一定经验的选手回忆用。

基本流程为，从链接下载一个程序包，然后解压缩到指定位置，运行`ubuntu.exe`即可

:link:[WSL 的手动安装步骤 | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/wsl/install-manual)

:link:[最新版 ubuntu 的 AppxBundle 包](https://aka.ms/wslubuntu)

## WSL2 手动安装流程

首先对 WSL2 是什么有个基本了解。然后如果不想从应用商店或者直接命令 install（默认 C 盘）的话，按照上述链接去下载一个包。

与此同时，参考下面的 1、2、3、4 命令，检查计算机环境是否准备好了，并设置你想安装的 wsl 版本号。

如果不是第一次安装，或者是想卸载之前的，可以参考 5、6、15、16 命令

配置完成后，打开下载好的 appx 文件，**后缀名改为 zip**，然后解压缩到你想要的文件夹，比如`E:\wsl`。注意，官方教程说双击也能运行，确实，双击还是安装默认位置 ，那此举属实是有点脱裤子放:dash:

所以要解压，有可能你下载的是一个版本包，里面有多个 appx，有 arm64 的、x64 的，还有一些缩放的。解压你对应的那个版本，然后运行`.\ubuntu.exe`，就会自动安装了，安装完后 wsl2 可以看到一个<mark>vhdx</mark>文件，那就是它的虚拟磁盘。

![image-20231211235919937](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231211235919937.png)

如果这之间发生了什么异常，首先检查是不是虚拟化什么的没准备好，如果好了，那 STFW

## WSL1 手动安装流程

鉴于 WSL2 丢失 wifi 的情况，如果想安装 wsl1，那么只需要`wsl --set-default-version 1`，然后仍然按照上述流程走就好了。运行完`.\ubuntu.exe`后得到的就是 wsl1

## 常用命令（WSL）

1. `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux`检查是否开启了 wsl 功能。还有什么系统版本、HyperV 之类的都检查一下
2. `dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart`上一步发现**Enable**的用这条命令开启 wsl 功能
3. `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`开启虚拟化。这里官方教程说*WSL2 需要*，而且需要重启。WSL1 的俺忘了
   - <mark>注意 win11 开这个有可能会痛失 wifi 使用权，如果碰到了这个问题，我的建议是用 VM。下个 debain 的无 gui 版本，用 windows terminal 连，一个样。你不说谁知道是 wsl2 还是 vm</mark>
   - 如果已经发生了上述问题，执行：
     1. `dism.exe /online /disable-feature /featurename:VirtualMachinePlatform /norestart`
     2. 手动重启（必须手动，实践出真知，不指定`/norestart`，从命令行执行 y 重启不行）
   - 有一说一，win11 丢 wifi 很早之前就有了，刚出来的时候，开内核隔离还是内存完整性来着，就会丢 wifi 模块，大概都是虚拟化相关。两三年了还没修，又让我重蹈覆辙一次，fucking ridiculous
4. `wsl --set-default-version 2` 设置默认版本号
5. `wsl --list --verbose`列出本机的 wsl
6. `wsl --unregister <DistributionName>`卸载
7. `wsl --set-version <distribution name> <versionNumber>`
8. `wsl --distribution <Distribution Name> --user <User Name>`运行特定版本
9. `wsl --status`
10. `wsl --shutdown`立即终止所有正在运行的发行版和 WSL 2 轻量级实用工具虚拟机。 在需要重启 WSL 2 虚拟机环境的情形下，例如[更改内存使用限制](https://learn.microsoft.com/zh-cn/windows/wsl/disk-space)或更改 [.wslconfig 文件](https://learn.microsoft.com/zh-cn/windows/wsl/manage#)，可能必须使用此命令。
11. `wsl --terminate <Distribution Name>`终止指定的发行版或阻止其运行
12. `wsl --export <Distribution Name> <FileName>`：导入导出，可以进行迁移，也是一种指定安装位置的手法
13. `wsl --import <Distribution Name> <InstallLocation> <FileName>.tar`
14. 将指定 tar 文件导入和导出为新的发行版。 在标准输入中，文件名可以是 -。 选项包括：
    - `--vhd`：指定导入/导出分发应为 .vhdx 文件而不是 tar 文件（这仅在使用 WSL 2 的情况下受支持）
    - `--version`：（仅导入）指定将发行版导入为 WSL 1 还是 WSL 2 发行版
15. `Get-AppxPackage -allusers | grep -i ubuntu`搜索安装的 ubuntu 包
16. `Remove-AppxPackage -Package <PackageFullName>`移除包。可能手动安装新的包时需要这两条命令（比如出现什么更高版本已安装的问题）
