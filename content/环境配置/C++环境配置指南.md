---
title: 现代c++开发环境配置指南
date: 2025-03-26
categories: ["环境配置"]
tags: ["c++"]
series: ["环境配置专栏"]
---

# 现代c++环境配置指南

## 引言

作为一个高强度冲浪的cpper，经常能在各种地方看到各式各样的大家诟病cpp的地方，其中比较多（但是相对温和）的一条就是，环境配置麻烦。这个问题有多少人说呢？最直观的一条佐证是，迄今为止，我的阅读、点赞、收藏量最多的一篇博文，居然就是随手写的一篇很粗糙的 —— [vscode搭配clangd配置现代c++环境-CSDN博客](https://blog.csdn.net/qq_43533638/article/details/137198166)，这背后又有多少被这编程第一关折磨的旁友......

本人的CPP水平一言难尽，平常喜欢的就是精通各类语言的hello world，以及配置各种有的没的环境，那么闲话少叙，下面就对这个粗糙的环境配置的坑进行补档。

> [!goal]
>
> 1. 所谓CPP环境，具体指的是什么？
>    - 高亮、跳转、补全、错误提示、依赖管理、构建、调试、运行、发布
> 2. 具体开发环境搭建
>    - vscode、vim/nvim、sublime，or clion、vs

## CPP开发环境都包括哪些？

![image-20250326163516854](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_imgimage-20250326163516854.png)

下面对各个步骤的推荐工具配置进行注意介绍：

### 高亮、补全、跳转

> [!tldr] TLDR 
>
> 这三类可以统一由一个LSP提供，也是最推荐的——`clangd`，此外就是用IDE自带的，或者VSCODE-CPP插件包。（还有一个在更新中的项目 [clice-project/clice](https://github.com/clice-project/clice) **有望**超过clangd，不过目前还处于不可用状态。）

`clangd`是一个语言服务器，提供代码高亮、补全、跳转的功能，但是不能直接用，因为既然是服务器，那么就要配合客户端使用，使用不同的IDE或编辑器对应的客户端不同。

- 服务器：clangd.exe
  - clangd有很多版本，依赖llvm项目的库，根据你的系统自行选择版本安装，比如 clangd-14.exe、clangd-18.exe 等等。
  - clangd服务器直接理解单个文件没问题，但是要理解你的整个项目，需要依赖一个`compile_commands.json`文件。使用不同的构建工具时有不同的生成该文件的办法，比如CMake是使用`cmake .. -DCMAKE_EXPORT_COMPILE_COMMANDS=ON`，至于Make、Bazel等怎么生成，这里不再赘述。
- 客户端：
  - vscode：安装 [clangd - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)（本机没有安装clangd时，会提示你要不要帮你安装）
  - vim：安装`coc`插件后，用 cocInstall 安装`coc-clangd`（无需自己安装clangd）
  - nvim：mason 安装 clangd 插件（无需自己处理clangd.exe）
  - clion：默认就是，不用管了。(都用IDE了应该就没配环境的烦恼了吧？)

### 格式化

> [!tldr] 推荐 clangd-format



### 错误告警（Lint）

> [!tldr] 推荐 clang-tidy

### 构建



#### 调试

#### 运行



## 具体编辑器配置

### vscode

### vim

### nvim

### sublime

