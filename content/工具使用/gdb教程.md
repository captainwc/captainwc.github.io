---
title: gdb快速上手
series: [快速上手]
tags: [gdb, cmdline]
categories: [工具使用]
date: 2022-11-25
---

# gdb

## 命令

### 通用命令

> :book:[GDB Reference](https://visualgdb.com/gdbreference/commands/) :link:[调试器 GDB 常用功能](https://www.iteye.com/blog/daimajishu-1089741)

- **`x `**/ \[_Length_\]\[_Format_: t o d x f a c s\] \[_Address expression_ b-8 h-16 w-32 g-64\ ] :paperclip:[GDB Command Reference : x](https://visualgdb.com/gdbreference/commands/x)

- **`p`/**t-2 o-8 d-10 x-16 f-loat a-ddress c-har s-tring [var]

  1. :warning: 要注意区分，**x** 是扫描**内存**，因此后面跟的直接是内存地址， 而 **p** 是输出**变量**的值，因此后面想跟地址的话，需要取其内容，即加上`*`
  1. 关于 `*`，很多命令地址前面都要加星号，因为不加星号的一个地址，是被当成函数来看待的

- **`s n`** ：C 语言级别的单步执行； **`si ni`**汇编级别的单步执行

- **`i [line] / [locals] / [vtbl] / [args] / [checkpoints] / [breakpoints] `**

  1. `info line [line] / [function] / [*addr]`：显示源码对应的内存中的起始结束地址

  2. `info vtbl [objs]`：直接查看对象的虚函数表（也可以类型转换的形式打印出来，参考[C++类的内存分配](https://blog.csdn.net/bailang_zhizun/article/details/117124494)，基本思想就是：对象的第一块内存放的就是虚表，虚表是一个函数指针数组，因此可以先将对象地址转换为指向指针的指针，然后对其取内容，就得到了虚表指针。把这个值转换为指向指针的指针，即得虚表）

- `set print array-indexes on`：打印数组的时候显示 index

- `set disassemble next-line on`，`disassemble`

- **`set [args] / [register] / [*address] = [val]`**：设置参数、寄存器值、内存处值

- `jump [*address]`：跳转到指定地址处执行，`return [val]`：直接返回。都可以改变程序走向。

- `shell [cmd]`：运行 shell 命令

- `rbreak [regex]`：在所有满足正则表达式的函数处打断点

### 多进程/线程调试

- `gdb [pid]`：调试正在运行的进程，或者进去后 `attch [pip]`

## 例子

- **打印栈内容**（你打数组肯定也行）：不妨设 \$rsp 中存放的是 0x1234 `p $rsp => (void*)0x1234`
  1. `x/10dw $rsp` 或 `x/10dw 0x1234`，即用 `x` 命令直接把栈那一块内存扫描出来
  2. `p *(int (*)[10])0x1234` 把栈顶**地址**类型转换为一个指向数组的指针，然后 print 这个数组 **val** 的值（所以要加`*`），即栈的内容
  3. `p (int [10])*0x1234` 把栈顶的**内容**直接变成一个数组，然后输出
  4. `p *0x1234@6` 注意`@`的用法，其左边必须是你想查看内存处的**值**，可以直接输出后面的六个变量
     类似的 `p *argv@argc`，也是先取内容转换为变量，再输出
  5. 总结一下，用 x 就是直接扫描内存了，简单粗暴；用 p 则是要把你想看的内存区域转化成一个变量，一个 val，不管是 int 还是 int 数组，不管是怎么类型转换，反正基本思想是把内存当成一个变量进行输出。最好还是用 x ，因为效果一样，用 p 你还需要先得到 rsp 里面的值
- **查看虚表** 略
- **运用 core 文件**：`gdb debug core`进入之后，`disassemble`，可以看到 `=>` 指向的就是运行出错的地方
