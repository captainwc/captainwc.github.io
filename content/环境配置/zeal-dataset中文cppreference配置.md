---
title: "手册速查方案（如cppreference）"
date: 2025-03-12T13:41:29+08:00
categories: [环境配置]
tags: [cppreference]
series: []
---

[<img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_imgimage-20250312141139881.png" style="float: right; zoom: 16%;"/>](https://zealdocs.org/)

## zeal

直接下载 [Zeal - Offline Documentation Browser](https://zealdocs.org/)，然后搜索自己感兴趣的 docset 下载即可

## utools-dataset

使用 utools 的 dataset 插件，能够更快更方便地唤起 zeal。按照插件指引配置 zeal 的 docset 文件夹位置即可。

这里需要说明的是，怎么将 cppreference 的语言变为中文，也即使用 [zh.cppreference.com](https://zh.cppreference.com)

### 配置

首先要下载[中文离线版手册](https://zh.cppreference.com/w/Cppreference:Archives)（不如英文版的新，但是无所谓了），解压后里面有两个关键的文件夹，所有需要做的就是用 _zh-html-book\reference\zh_ 替换掉 _docsets\C++.docset\Contents\Resources\Documents\en.cppreference.com\w_ 这个，将 _zh-html-book\reference\common_ 文件夹放到 w 的相同位置。推荐使用软连接来做，可以参考下面的命令

```bash
mklink /d %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C++.docset\Contents\Resources\Documents\en.cppreference.com\w %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C++.docset\zh-html-book\reference\zh

mklink /d %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C++.docset\Contents\Resources\Documents\en.cppreference.com\common %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C++.docset\zh-html-book\reference\common
```

C 的 reference 其实是复用的 Cpp 的，完全可以删除 c.docset 中的 en.cppreference.com，直接用一个软连接指向 cpp 中的即可

```bash
rm -rf %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C.docset\Contents\Resources\Documents\en.cppreference.com

mklink /d %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C.docset\Contents\Resources\Documents\en.cppreference.com %LOCALAPPDATA%\Zeal\Zeal\docsets\zh_C++.docset\Contents\Resources\Documents\en.cppreference.com
```

这里我想同时保留中英文，没有直接修改 _%LOCALAPPDATA%\Zeal\Zeal\docsets\C++.docset_ ，而是创建了 _%LOCALAPPDATA%\Zeal\Zeal\docsets\zh-C++.docset_ 和 *%LOCALAPPDATA%\Zeal\Zeal\docsets\zh-C.docset* 两个作为副本，然后同时保持`cpp`和`cppzh`两条命令作为区分。这样不影响 zeal 更新

<div style="display: flex; gap: 2px; justify-content: center">
    <img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_imgblog_imgimage-20250312142314814.png" alt="cppzh" style="max-width: 50%;">
    <img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_imgblog_imgimage-20250312141915556.png" alt="cpp" style="max-width: 50%;">
</div>

### 样式

`common/ext.css`:

1. `body.min-width: 180px;`可以缩小边距；
2. `body.width:70%;` 放大后往左移；
3. `#bodyContent.font-size: 0.9em;`，这里修改字体大小

## utools-网页快开

换个思路，能够快速打开官网手册，进一步，快速打开官网手册的关键词搜索位置，也可以做到速查手册。这里列出几个链接作为配置参考

1. cppreference: `https://www.google.com/search?q={query}+site%3Acppreference.com`
2. python: `https://docs.python.org/zh-cn/3.13/search.html?q={query}`
3. java: `https://www.google.com/search?q={query}+site%3Aapiref.com/java11-zh`
4. man: `https://man.freebsd.org/cgi/man.cgi?query={query}`
5. tldr: `https://tldr.inbrowser.app/pages/common/{query}`
