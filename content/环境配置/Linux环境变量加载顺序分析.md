---
title: Linux环境变量加载顺序分析
date: 2025-03-14T15:39:01Z
categories: ["环境配置"]
tags: ["linux"]
---

# Linux环境变量加载顺序分析

---

> 环境变量是shell运行时的运行参数，比如执行命令时，就会从PATH指定的路径查找可执行文件。有的程序也会使用环境变量作为参数。  
> 当你发现配置了环境变量，但实际使用时环境变量未生效时，希望这篇文章能对你有所帮助。

我们登录linux有很多种，bash来交互式执行，或者直接非交互式执行命令。试验后，可以发现，原来这几个的环境变量加载都是不同的。

### 相关文件：

电脑上和初始化相关的是这几个文件。

```shell
/etc/profile
/etc/environment
/etc/bashrc
~/.bash_profile
~/.bashrc
~/.bash_logout
```

## bash登录方式和环境变量的关系：

### 环境加载和4种bash模式相关。

#### 什么是交互式shell（interactive shell）和非交互式shell（non-interactive shell）：

交互式的shell会有一个输入提示符，并且它的标准输入、输出和错误输出都会显示在控制台上。所以一般来说只要是需要用户交互的。  
 非交互式shell是 bash script.sh 这类的shell，脚本或程序执行完就结束了，没有交互。

#### 登录式shell（login shell）和非登陆式shell（no-login shell）：

需要输入用户名和密码的shell就是登陆式shell。因此通常不管以何种方式登陆机器后用户获得的第一个shell就是login shell。不输入密码的ssh是公钥打通的，某种意义上说也是输入密码的。  
 非登陆式的就是在登陆后启动bash等，即不是远程登陆到主机这种。

### 不同方式的加载情况：

以下是实验结果，可直接参考

|文件|登陆 + 非交互|登陆 + 交互|非登陆 + 交互|非登陆 + 非交互|
| -------------------------| ---------------| -------------| ---------------| -----------------|
|/etc/profile|加载|加载|||
|/etc/environment|||||
|/etc/bashrc|加载|加载|||
|\~/.bash\_profile|加载|加载|||
|\~/.bashrc|加载|加载|加载||
|BASH\_ENV||||加载|

## 场景分析

#### 常见的几种场景

1. **登陆机器后的第一个shell**​：登录+交互(login + interactive)
2. **新启动一个shell进程，如运行bash**​：非登录+交互(non-login + interactive)
3. **执行脚本，如bash script.sh**​：非登录+非交互(non-login + non-interactive))
4. **运行头部有如#!/usr/bin/env bash的可执行文件，如./executable**​：非登录+非交互(non-login + non-interactive))
5. **远程执行脚本，如 ssh user@remote script.sh**​：非登录+非交互(non-login + non-interactive))
6. **远程执行脚本，同时-t强制分配伪终端，如ssh user@remote -t ‘echo**  **$PWD’**  ：非登录+交互(non-login + interactive)
7. **在图形化界面中打开terminal，Linux上**: 非登录+交互(non-login + interactive)  
8. **在图形化界面中打开terminal，Mac OS X上**: 登录+交互(login + interactive)

## 实验:

### 准备

在每个文件的开头和结尾都加了行输出用于打印状态。

```shell
echo 脚本名 begin
xxxx脚本内容xxxx
echo 脚本名 end
```

### 情况

下面显示输出的情况，用表格来隔开，以显示递归的情况。

#### 登陆机器后的第一个shell：

**交互式，登录式shell**​。

```shell
/etc/profile begin
/etc/profile end
~/.bash_profile begin
        ~/.bashrc begin
                /etc/bashrc begin
                /etc/bashrc end
        ~/.bashrc end
~/.bash_profile end
```

#### 在已经登陆后的终端，执行bash命令：

**交互式，非登录式shell**​。

```shell
~/.bashrc begin
        /etc/bashrc begin
        /etc/bashrc end
~/.bashrc end
```

#### 在已经登陆后的终端，执行bash -l命令：

**交互式，登陆式shell**​。

```shell
/etc/profile begin
/etc/profile end
~/.bash_profile begin
        ~/.bashrc begin
                /etc/bashrc begin
                /etc/bashrc end
        ~/.bashrc end
~/.bash_profile end
```

#### su命令到另一个用户：

**交互式，非登录式shell**​。

```shell
~/.bashrc begin
        /etc/bashrc begin
        /etc/bashrc end
~/.bashrc end
```

#### 普通用户下sudo ls：

**非交互式，非登陆shell**​。  
 没有打印任何信息。

```shell
```

#### bash -l -c “ls”命令：

**非交互式，登录式shell**​。

```shell
/etc/profile begin
/etc/profile end    
~/.bash_profile begin
        ~/.bashrc begin
                /etc/bashrc begin
                /etc/bashrc end
        ~/.bashrc end
~/.bash_profile end
```

#### 远程 ssh sean@test ls 命令：

**非交互式，登陆式shell**​。

```shell
~/.bashrc begin
        /etc/bashrc begin
        /etc/bashrc end
~/.bashrc end
```

## 一些结论：

其实从上面的显示中，我们可以看出，有几个文件有调用关系。

#### 调用关系：

```shell
~/.bash_profile -> ~/.bashrc -> /etc/bashrc
```

其实去查看它们的代码就能发现，里面有执行的语句。

#### 注意 bash -l ：

加了-l参数后，打开的是登陆式shell。这要注意。

#### BASH\_ENV变量：

一个环境变量，用于指定**非交互+非登陆式**的环境变量文件

#### 用法

因此想要一些设置在任何时候都能用，最方便的就是加入到 `~/.bashrc` 中，对执行脚本时有要求的话，再设置个 `BAHS_ENV` 
