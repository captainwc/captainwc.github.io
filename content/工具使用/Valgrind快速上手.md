---
title: Valgrind快速上手
categories: [工具使用]
date: 2025-04-08
series: [快速上手]
tags: [valgrind]
---

# Valgrind 使用详解

> [!idea] 转载自 [Valgrind 使用详解-CSDN博客](https://blog.csdn.net/qq_14821541/article/details/71533788)

> [!note]
>
> 原博文的排版比较混乱，找不着真正的原出处了，所以拷过来对其进行了标题的修改，后续可能会对齐进行渐进修改。博文很详细，给了很多选项，这里的建议是：
>
> - 基本用法 `valgrind -tool=xxx ./<excutable>`。tool有`memcheck, cachegrind, helgrind, callgrind, massif, lackey ...`(直接补全即可查看)
> - 然后具体的哪个工具怎么用，直接搜或者问ai即可。

## Valgrind包含的工具

 Valgrind支持很多工具:memcheck，addrcheck，cachegrind，Massif，helgrind和Callgrind等。在运行Valgrind时，你必须指明想用的工具,如果省略工具名，默认运行memcheck。

### memcheck

 memcheck探测程序中内存管理存在的问题。它检查所有对内存的读/写操作，并截取所有的malloc/new/free/delete调用。因此memcheck工具能够探测到以下问题：

 1）使用未初始化的内存

 2）读/写已经被释放的内存

 3）读/写内存越界

 4）读/写不恰当的内存栈空间

 5）内存泄漏

 6）使用malloc/new/new[]和free/delete/delete[]不匹配。

 7）src和dst的重叠

### cachegrind

 cachegrind是一个cache剖析器。它模拟执行CPU中的L1, D1和L2 cache，因此它能很精确的指出代码中的cache未命中。如果你需要，它可以打印出cache未命中的次数，内存引用和发生cache未命中的每一行代码，每一个函数，每一个模块和整个程序的摘要。如果你要求更细致的信息，它可以打印出每一行机器码的未命中次数。在x86和amd64上， cachegrind通过CPUID自动探测机器的cache配置，所以在多数情况下它不再需要更多的配置信息了。

### helgrind

 helgrind查找多线程程序中的竞争数据。helgrind查找内存地址，那些被多于一条线程访问的内存地址，但是没有使用一致的锁就会被查出。这表示这些地址在多线程间访问的时候没有进行同步，很可能会引起很难查找的时序问题。

 它主要用来检查多线程程序中出现的竞争问题。Helgrind 寻找内存中被多个线程访问，而又没有一贯加锁的区域，这些区域往往是线程之间失去同步的地方，而且会导致难以发掘的错误。Helgrind实现了名为”Eraser” 的竞争检测算法，并做了进一步改进，减少了报告错误的次数。

### Callgrind

 Callgrind收集程序运行时的一些数据，函数调用关系等信息，还可以有选择地进行cache 模拟。在运行结束时，它会把分析数据写入一个文件。callgrind_annotate可以把这个文件的内容转化成可读的形式。

 一般用法:

 `valgrind --tool=callgrind ./sec_infod`

 会在当前目录下生成callgrind.out.[pid], 如果我们想结束程序, 可以

 `killall callgrind`

 然后我们可以用

 `callgrind_annotate --auto=yes callgrind.out.[pid] > log`

 `vim log`

### Massif

 堆栈分析器，它能测量程序在堆栈中使用了多少内存，告诉我们堆块，堆管理块和栈的大小。Massif能帮助我们减少内存的使用，在带有虚拟内存的现代系统中，它还能够加速我们程序的运行，减少程序停留在交换区中的几率。

### lackey

 lackey是一个示例程序，以其为模版可以创建你自己的工具。在程序结束后，它打印出一些基本的关于程序执行统计数据。

##  Valgrind的参数

 用法: `valgrind [options] prog-and-args [options]`: 常用选项，适用于所有Valgrind工具

 --tool=<name>：最常用的选项。运行 valgrind中名为toolname的工具。默认memcheck。

 -h --help：显示所有选项的帮助，包括内核和选定的工具两者。

 --version：显示valgrind内核的版本，每个工具都有各自的版本。

 -q --quiet：安静地运行，只打印错误信息。

 --verbose：更详细的信息。

 --trace-children=<yes|no>：跟踪子线程? [default: no]

 --track-fds=<yes|no>：跟踪打开的文件描述？[default: no]

 --time-stamp=<yes|no>：增加时间戳到LOG信息? [default: no]

 --log-fd=<number>：输出LOG到描述符文件 [2=stderr]

 --log-file=<file>：将输出的信息写入到filename.PID的文件里，PID是运行程序的进行ID

 --log-file-exactly=<file>: 输出LOG信息到 file

 --xml=yes：将信息以xml格式输出，只有memcheck可用

 --num-callers=<number>：show <number> callers in stack traces [12]

 --error-exitcode=<number>：如果发现错误则返回错误代码 [0=disable]

 --db-attach=<yes|no>： 当出现错误，valgrind会自动启动调试器gdb。[default: no]

 --db-command=<command>：启动调试器的命令行选项[gdb -nw %f %p]

 --leak-check=<no|summary|full>：要求对leak给出详细信息? Leak是指，存在一块没有被引用的内存空间，或没有被释放的内存空间，如summary，只反馈一些总结信息，告诉你有多少个malloc，多少个free 等；如果是full将输出所有的leaks，也就是定位到某一个malloc/free。 [default: summary]

 --show-reachable=<yes|no>：如果为no，只输出没有引用的内存leaks，或指向malloc返回的内存块中部某处的leaks [default: no]

 更详细的参数指令见附录A。

## Valgrind的使用

 首先，在编译程序的时候**打开调试模式**（gcc编译器的-g选项）。如果没有调试信息，即使最好的valgrind工具也将不能够猜测特定的代码是属于哪一个函数。打开调试选项进行编译后再用valgrind检查，valgrind将会给你的个详细的报告，比如哪一行代码出现了内存泄漏。

 当检查的是C++程序的时候，还应该考虑另一个选项 `-fno-inline`。它使得函数调用链很清晰，这样可以减少你在浏览大型C++程序时的混乱。比如在使用这个选项的时候，用memcheck检查openoffice就很容易。当然，你可能不会做这项工作，但是使用这一选项使得valgrind生成更精确的错误报告和减少混乱。

 一些编译优化选项(比如-O2或者更高的优化选项)，可能会使得memcheck提交错误的未初始化报告，因此，为了使得valgrind的报告更精确，在编译的时候最好不要使用优化选项。

 如果程序是通过脚本启动的，可以修改脚本里启动程序的代码，或者使用--trace-children=yes选项来运行脚本。

 下面是用memcheck检查sample.c的例子

 这里用到的示例程序文件名为：sample.c（如下所示）,选用的编译器为gcc。

 生成可执行程序

 `gcc –g sample.c –o sample`

 `valgrind --tool=memcheck ./sample`

 以下是运行上述命令后的输出：

- 左边显示类似行号的数字（10297）表示的是 Process ID。

- 最上面的表示的是 valgrind 的版本信息。

- 中间表示 valgrind 通过运行被测试程序，发现的内存问题

- 最下面是对发现的内存问题和内存泄漏问题的总结。内存泄漏的大小（40 bytes）也能够被检测出来。

## Valgrind的示例

### 例1．使用未初始化的内存

 代码如下

```c++
#include <stdio.h>                                                              
int main()
{ 
    int x;
    if(x == 0)
    { 
        printf("X is zero");
    }
    return 0;
}
```

```
Valgrind提示如下
==14222== Conditional jump or move depends on uninitialised value(s)
==14222== at 0x400484: main (sample2.c:6)
X is zero==14222==
==14222== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 5 from 1)
==14222== malloc/free: in use at exit: 0 bytes in 0 blocks.
==14222== malloc/free: 0 allocs, 0 frees, 0 bytes allocated.
==14222== For counts of detected errors, rerun with: -v
==14222== All heap blocks were freed -- no leaks are possible.
```


### 例2．内存读写越界

 代码如下

```c++
#include <stdlib.h>
#include <stdio.h>
int main(int argc,char *argv[])
{ 
    int len=5;
    int i;
    int *pt=(int*)malloc(len*sizeof(int));
    int *p=pt;
    for(i=0;i<len;i++)
    {p++;}
    *p=5;
    printf(“%d”,*p);
    return;
}
```

```
Valgrind提示如下
==23045== Invalid write of size 4
==23045== at 0x40050A: main (sample2.c:11)
==23045== Address 0x4C2E044 is 0 bytes after a block of size 20 alloc'd
==23045== at 0x4A05809: malloc (vg_replace_malloc.c:149)
==23045== by 0x4004DF: main (sample2.c:7)
==23045==
==23045== Invalid read of size 4
==23045== at 0x400514: main (sample2.c:12)
==23045== Address 0x4C2E044 is 0 bytes after a block of size 20 alloc'd
==23045== at 0x4A05809: malloc (vg_replace_malloc.c:149)
==23045== by 0x4004DF: main (sample2.c:7)
5==23045==
==23045== ERROR SUMMARY: 2 errors from 2 contexts (suppressed: 5 from 1)
==23045== malloc/free: in use at exit: 20 bytes in 1 blocks.
==23045== malloc/free: 1 allocs, 0 frees, 20 bytes allocated.
==23045== For counts of detected errors, rerun with: -v
==23045== searching for pointers to 1 not-freed blocks.
==23045== checked 66,584 bytes.
==23045==
==23045== LEAK SUMMARY:
==23045== definitely lost: 20 bytes in 1 blocks.
==23045== possibly lost: 0 bytes in 0 blocks.
==23045== still reachable: 0 bytes in 0 blocks.
==23045== suppressed: 0 bytes in 0 blocks.
==23045== Use --leak-check=full to see details of leaked memory.
```

### 例3．src和dst内存覆盖

 代码如下

```c++
 #include <stdlib.h>

 #include <stdio.h>

 #include <string.h>

 int main(int argc,char *argv[])

 { char x[50];

 int i;

 for(i=0;i<50;i++)

 {x[i]=i;}

 strncpy(x+20,x,20); //Good

 strncpy(x+20,x,21); //Overlap

 x[39]=’\\0’;

 strcpy(x,x+20); //Good

 x[39]=40;

 x[40]=’\\0’;

 strcpy(x,x+20); //Overlap

 return 0;

 }
```

 Valgrind提示如下

```
 ==24139== Source and destination overlap in strncpy(0x7FEFFFC09, 0x7FEFFFBF5, 21)

 ==24139== at 0x4A0724F: strncpy (mc_replace_strmem.c:116)

 ==24139== by 0x400527: main (sample3.c:10)

 ==24139==

 ==24139== Source and destination overlap in strcpy(0x7FEFFFBE0, 0x7FEFFFBF4)

 ==24139== at 0x4A06E47: strcpy (mc_replace_strmem.c:106)

 ==24139== by 0x400555: main (sample3.c:15)

 ==24139==

 ==24139== ERROR SUMMARY: 2 errors from 2 contexts (suppressed: 5 from 1)

 ==24139== malloc/free: in use at exit: 0 bytes in 0 blocks.

 ==24139== malloc/free: 0 allocs, 0 frees, 0 bytes allocated.

 ==24139== For counts of detected errors, rerun with: -v

 ==24139== All heap blocks were freed -- no leaks are possible.
```

### 例4．动态内存管理错误

 常见的内存分配方式分三种：静态存储，栈上分配，堆上分配。全局变量属于静态存储，它们是在编译时就被分配了存储空间，函数内的局部变量属于栈上分配，而最灵活的内存使用方式当属堆上分配，也叫做内存动态分配了。常用的内存动态分配函数包括：malloc, alloc, realloc, new等，动态释放函数包括free, delete。

 一旦成功申请了动态内存，我们就需要自己对其进行内存管理，而这又是最容易犯错误的。常见的内存动态管理错误包括：

 l 申请和释放不一致

 由于 C++ 兼容 C，而 C 与 C++ 的内存申请和释放函数是不同的，因此在 C++ 程序中，就有两套动态内存管理函数。一条不变的规则就是采用 C 方式申请的内存就用 C 方式释放；用 C++ 方式申请的内存，用 C++ 方式释放。也就是用 malloc/alloc/realloc 方式申请的内存，用 free 释放；用 new 方式申请的内存用 delete 释放。在上述程序中，用 malloc 方式申请了内存却用 delete 来释放，虽然这在很多情况下不会有问题，但这绝对是潜在的问题。

 l 申请和释放不匹配

 申请了多少内存，在使用完成后就要释放多少。如果没有释放，或者少释放了就是内存泄露；多释放了也会产生问题。上述程序中，指针p和pt指向的是同一块内存，却被先后释放两次。

 l 释放后仍然读写

 本质上说，系统会在堆上维护一个动态内存链表，如果被释放，就意味着该块内存可以继续被分配给其他部分，如果内存被释放后再访问，就可能覆盖其他部分的信息，这是一种严重的错误，上述程序第16行中就在释放后仍然写这块内存。

 下面的一段程序，就包括了内存动态管理中常见的错误。

```c++
 #include <stdlib.h>

 #include <stdio.h>

 int main(int argc,char *argv[])

 { char *p=(char*)malloc(10);

 char *pt=p;

 int i;

 for(i=0;i<10;i++)

 {p[i]=’z’;}

 delete p;

 p[1]=’a’;

 free(pt);

 return 0;

 }
```

 Valgrind提示如下

```
 ==25811== Mismatched free() / delete / delete []

 ==25811== at 0x4A05130: operator delete(void*) (vg_replace_malloc.c:244)

 ==25811== by 0x400654: main (sample4.c:9)

 ==25811== Address 0x4C2F030 is 0 bytes inside a block of size 10 alloc'd

 ==25811== at 0x4A05809: malloc (vg_replace_malloc.c:149)

 ==25811== by 0x400620: main (sample4.c:4)

 ==25811==

 ==25811== Invalid write of size 1

 ==25811== at 0x40065D: main (sample4.c:10)

 ==25811== Address 0x4C2F031 is 1 bytes inside a block of size 10 free'd

 ==25811== at 0x4A05130: operator delete(void*) (vg_replace_malloc.c:244)

 ==25811== by 0x400654: main (sample4.c:9)

 ==25811==

 ==25811== Invalid free() / delete / delete[]

 ==25811== at 0x4A0541E: free (vg_replace_malloc.c:233)

 ==25811== by 0x400668: main (sample4.c:11)

 ==25811== Address 0x4C2F030 is 0 bytes inside a block of size 10 free'd

 ==25811== at 0x4A05130: operator delete(void*) (vg_replace_malloc.c:244)

 ==25811== by 0x400654: main (sample4.c:9)

 ==25811==

 ==25811== ERROR SUMMARY: 3 errors from 3 contexts (suppressed: 5 from 1)

 ==25811== malloc/free: in use at exit: 0 bytes in 0 blocks.

 ==25811== malloc/free: 1 allocs, 2 frees, 10 bytes allocated.

 ==25811== For counts of detected errors, rerun with: -v

 ==25811== All heap blocks were freed -- no leaks are possible.
```

### 例5．内存泄漏

 代码如下

```c++
 #include <stdlib.h>

 int main()

 {

 char *x = (char*)malloc(20);

 char *y = (char*)malloc(20);

 x=y;

 free(x);

 free(y);

 return 0;

 }
```

 Valgrind提示如下

```
 ==19013== Invalid free() / delete / delete[]

 ==19013== at 0x4A0541E: free (vg_replace_malloc.c:233)

 ==19013== by 0x4004F5: main (sample5.c:8)

 ==19013== Address 0x4C2E078 is 0 bytes inside a block of size 20 free'd

 ==19013== at 0x4A0541E: free (vg_replace_malloc.c:233)

 ==19013== by 0x4004EC: main (sample5.c:7)

 ==19013==

 ==19013== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 5 from 1)

 ==19013== malloc/free: in use at exit: 20 bytes in 1 blocks.

 ==19013== malloc/free: 2 allocs, 2 frees, 40 bytes allocated.

 ==19013== For counts of detected errors, rerun with: -v

 ==19013== searching for pointers to 1 not-freed blocks.

 ==19013== checked 66,584 bytes.

 ==19013==

 ==19013== LEAK SUMMARY:

 ==19013== definitely lost: 20 bytes in 1 blocks.

 ==19013== possibly lost: 0 bytes in 0 blocks.

 ==19013== still reachable: 0 bytes in 0 blocks.

 ==19013== suppressed: 0 bytes in 0 blocks.

 ==19013== Use --leak-check=full to see details of leaked memory.
```

### 例6．非法写/读

 代码如下

```c++
 int main()

 {

 int i, *x;

 x = (int *)malloc(10*sizeof(int));

 for (i=0; i<11; i++)

 x[i] = i;

 free(x);

 }
```

 Valgrind提示如下

```
 ==21483== Invalid write of size 4

 ==21483== at 0x4004EA: main (sample6.c:6)

 ==21483== Address 0x4C2E058 is 0 bytes after a block of size 40 alloc'd

 ==21483== at 0x4A05809: malloc (vg_replace_malloc.c:149)

 ==21483== by 0x4004C9: main (sample6.c:4)

 ==21483==

 ==21483== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 5 from 1)

 ==21483== malloc/free: in use at exit: 0 bytes in 0 blocks.

 ==21483== malloc/free: 1 allocs, 1 frees, 40 bytes allocated.

 ==21483== For counts of detected errors, rerun with: -v

 ==21483== All heap blocks were freed -- no leaks are possible.
```

### 例7．无效指针

 代码如下

```c++
 #include <stdlib.h>

 int main()

 {

 char *x = malloc(10);

 x[10] = 'a';

 free(x);

 return 0;

 }
```

 Valgrind提示如下

```
 ==15262== Invalid write of size 1

 ==15262== at 0x4004D6: main (sample7.c:5)

 ==15262== Address 0x4C2E03A is 0 bytes after a block of size 10 alloc'd

 ==15262== at 0x4A05809: malloc (vg_replace_malloc.c:149)

 ==15262== by 0x4004C9: main (sample7.c:4)

 ==15262==

 ==15262== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 5 from 1)

 ==15262== malloc/free: in use at exit: 0 bytes in 0 blocks.

 ==15262== malloc/free: 1 allocs, 1 frees, 10 bytes allocated.

 ==15262== For counts of detected errors, rerun with: -v

 ==15262== All heap blocks were freed -- no leaks are possible.
```

### 例8．重复释放

 代码如下

```c++
 #include <stdlib.h>

 int main()

 {

 char *x = malloc(10);

 free(x);

 free(x);

 return 0;

 }
```

 Valgrind提示如下

```
 ==15005== Invalid free() / delete / delete[]

 ==15005== at 0x4A0541E: free (vg_replace_malloc.c:233)

 ==15005== by 0x4004DF: main (sample8.c:6)

 ==15005== Address 0x4C2E030 is 0 bytes inside a block of size 10 free'd

 ==15005== at 0x4A0541E: free (vg_replace_malloc.c:233)

 ==15005== by 0x4004D6: main (sample8.c:5)

 ==15005==

 ==15005== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 5 from 1)

 ==15005== malloc/free: in use at exit: 0 bytes in 0 blocks.

 ==15005== malloc/free: 1 allocs, 2 frees, 10 bytes allocated.

 ==15005== For counts of detected errors, rerun with: -v

 ==15005== All heap blocks were freed -- no leaks are possible.
```

## Valgrind的局限

 Valgrind不对静态数组(分配在栈上)进行边界检查。如果在程序中声明了一个数组:

```c++
 int main()

 {

 char x[10];

 x[11] = 'a';

 }
```

 Valgrind则不会警告你，你可以把数组改为动态在堆上分配的数组，这样就可能进行边界检查了。这个方法好像有点得不偿失的感觉。

 Valgrind占用了更多的内存--可达两倍于你程序的正常使用量。如果你用Valgrind来检测使用大量内存的程序就会遇到问题，它可能会用很长的时间来运行测试。大多数情况下，这都不是问题，即使速度慢也仅是检测时速度慢，如果你用Valgrind来检测一个正常运行时速度就很慢的程序，这下问题就大了。 Valgrind不可能检测出你在程序中犯下的所有错误--如果你不检查缓冲区溢出，Valgrind也不会告诉你代码写了它不应该写的内存。

## 附录A：参数指令

### 基本选项：

 这些选项对所有工具都有效。

 -h --help

 显示所有选项的帮助，包括内核和选定的工具两者。

 --help-debug

 和--help相同，并且还能显示通常只有Valgrind的开发人员使用的调试选项。

 --version

 显示Valgrind内核的版本号。工具可以有他们自已的版本号。这是一种保证工具只在它们可以运行的内核上工作的一种设置。这样可以减少在工具和内核之间版本兼容性导致奇怪问题的概率。

 -q --quiet

 安静的运行，只打印错误信息。在进行回归测试或者有其它的自动化测试机制时会非常有用。

 -v --verbose

 显示详细信息。在各个方面显示你的程序的额外信息，例如：共享对象加载，使用的重置，执行引擎和工具的进程，异常行为的警告信息。重复这个标记可以增加详细的级别。

 -d

 调试Valgrind自身发出的信息。通常只有Valgrind开发人员对此感兴趣。重复这个标记可以产生更详细的输出。如果你希望发送一个bug报告，通过-v -v -d -d生成的输出会使你的报告更加有效。

 --tool=<toolname> [default: memcheck]

 运行toolname指定的Valgrind，例如，Memcheck, Addrcheck, Cachegrind,等等。

 --trace-children=<yes|no> [default: no]

 当这个选项打开时，Valgrind会跟踪到子进程中。这经常会导致困惑，而且通常不是你所期望的，所以默认这个选项是关闭的。

 --track-fds=<yes|no> [default: no]

 当这个选项打开时，Valgrind会在退出时打印一个打开文件描述符的列表。每个文件描述符都会打印出一个文件是在哪里打开的栈回溯，和任何与此文件描述符相关的详细信息比如文件名或socket信息。

 --time-stamp=<yes|no> [default: no]

 当这个选项打开时，每条信息之前都有一个从程序开始消逝的时间，用天，小时，分钟，秒和毫秒表示。

 --log-fd=<number> [default: 2, stderr]

 指定Valgrind把它所有的消息都输出到一个指定的文件描述符中去。默认值2, 是标准错误输出(stderr)。注意这可能会干扰到客户端自身对stderr的使用, Valgrind的输出与客户程序的输出将穿插在一起输出到stderr。

 --log-file=<filename>

 指定Valgrind把它所有的信息输出到指定的文件中。实际上，被创建文件的文件名是由filename、'.'和进程号连接起来的（即<filename>.<pid>），从而每个进程创建不同的文件。

 --log-file-exactly=<filename>

 类似于--log-file，但是后缀".pid"不会被添加。如果设置了这个选项，使用Valgrind跟踪多个进程，可能会得到一个乱七八糟的文件。

 --log-file-qualifier=<VAR>

 当和--log-file一起使用时，日志文件名将通过环境变量\$VAR来筛选。这对于MPI程序是有益的。更多的细节，查看手册2.3节 "注解"。

 --log-socket=[ip-address:port-number](ip-address:port-number)

 指定Valgrind输出所有的消息到指定的IP，指定的端口。当使用1500端口时，端口有可能被忽略。如果不能建立一个到指定端口的连接，Valgrind将输出写到标准错误(stderr)。这个选项经常和一个Valgrind监听程序一起使用。更多的细节，查看手册2.3节 "注解"。

### 错误相关选项：

 这些选项适用于所有产生错误的工具，比如Memcheck, 但是Cachegrind不行。

 --xml=<yes|no> [default: no]

 当这个选项打开时，输出将是XML格式。这是为了使用Valgrind的输出做为输入的工具，例如GUI前端更加容易些。目前这个选项只在Memcheck时生效。

 --xml-user-comment=<string>

 在XML开头 附加用户注释，仅在指定了--xml=yes时生效，否则忽略。

 --demangle=<yes|no> [default: yes]

 打开/关闭C++的名字自动解码。默认打开。当打开时，Valgrind将尝试着把编码过的C++名字自动转回初始状态。这个解码器可以处理g++版本为2.X,3.X或4.X生成的符号。一个关于名字编码解码重要的事实是，禁止文件中的解码函数名仍然使用他们未解码的形式。Valgrind在搜寻可用的禁止条目时不对函数名解码，因为这将使禁止文件内容依赖于Valgrind的名字解码机制状态，会使速度变慢，且无意义。

 --num-callers=<number> [default: 12]

 默认情况下，Valgrind显示12层函数调用的函数名有助于确定程序的位置。可以通过这个选项来改变这个数字。这样有助在嵌套调用的层次很深时确定程序的位置。注意错误信息通常只回溯到最顶上的4个函数。(当前函数，和它的3个调用者的位置)。所以这并不影响报告的错误总数。这个值的最大值是50。注意高的设置会使Valgrind运行得慢，并且使用更多的内存,但是在嵌套调用层次比较高的程序中非常实用。

 --error-limit=<yes|no> [default: yes]

 当这个选项打开时，在总量达到10,000,000，或者1,000个不同的错误，Valgrind停止报告错误。这是为了避免错误跟踪机制在错误很多的程序下变成一个巨大的性能负担。

 --error-exitcode=<number> [default: 0]

 指定如果Valgrind在运行过程中报告任何错误时的退出返回值，有两种情况；当设置为默认值(零)时，Valgrind返回的值将是它模拟运行的程序的返回值。当设置为非零值时，如果Valgrind发现任何错误时则返回这个值。在Valgrind做为一个测试工具套件的部分使用时这将非常有用，因为使测试工具套件只检查Valgrind返回值就可以知道哪些测试用例Valgrind报告了错误。

 --show-below-main=<yes|no> [default: no]

 默认地，错误时的栈回溯不显示main()之下的任何函数(或者类似的函数像glibc的__libc_start_main()，如果main()没有出现在栈回溯中)；这些大部分都是令人厌倦的C库函数。如果打开这个选项，在main()之下的函数也将会显示。

 --suppressions=<filename> [default: $PREFIX/lib/valgrind/default.supp]

 指定一个额外的文件读取不需要理会的错误；你可以根据需要使用任意多的额外文件。

 --gen-suppressions=<yes|no|all> [default: no]

 当设置为yes时，Valgrind将会在每个错误显示之后自动暂停并且打印下面这一行：---- Print suppression ? --- [Return/N/n/Y/y/C/c] ----这个提示的行为和--db-attach选项(见下面)相同。如果选择是，Valgrind会打印出一个错误的禁止条目，你可以把它剪切然后粘帖到一个文件，如果不希望在将来再看到这个错误信息。当设置为all时，Valgrind会对每一个错误打印一条禁止条目，而不向用户询问。这个选项对C++程序非常有用，它打印出编译器调整过的名字。注意打印出来的禁止条目是尽可能的特定的。如果需要把类似的条目归纳起来，比如在函数名中添加通配符。并且，有些时候两个不同的错误也会产生同样的禁止条目，这时Valgrind就会输出禁止条目不止一次，但是在禁止条目的文件中只需要一份拷贝(但是如果多于一份也不会引起什么问题)。并且，禁止条目的名字像<在这儿输入一个禁止条目的名字>;名字并不是很重要，它只是和-v选项一起使用打印出所有使用的禁止条目记录。

 --db-attach=<yes|no> [default: no]

 当这个选项打开时，Valgrind将会在每次打印错误时暂停并打出如下一行：---- Attach to debugger ? --- [Return/N/n/Y/y/C/c] ---- 按下回车,或者N、回车，n、回车，Valgrind不会对这个错误启动调试器。按下Y、回车，或者y、回车，Valgrind会启动调试器并设定在程序运行的这个点。当调试结束时，退出，程序会继续运行。在调试器内部尝试继续运行程序，将不会生效。按下C、回车，或者c、回车，Valgrind不会启动一个调试器，并且不会再次询问。注意：--db-attach=yes与--trace-children=yes有冲突。你不能同时使用它们。Valgrind在这种情况下不能启动。

 2002.05: 这是一个历史的遗留物，如果这个问题影响到你，请发送邮件并投诉这个问题。

 2002.11:如果你发送输出到日志文件或者到网络端口，我猜这不会让你有任何感觉。不须理会。

 --db-command=<command> [default: gdb -nw %f %p]

 通过--db-attach指定如何使用调试器。默认的调试器是gdb.默认的选项是一个运行时扩展Valgrind的模板。 %f会用可执行文件的文件名替换，%p会被可执行文件的进程ID替换。

 这指定了Valgrind将怎样调用调试器。默认选项不会因为在构造时是否检测到了GDB而改变,通常是/usr/bin/gdb.使用这个命令，你可以指定一些调用其它的调试器来替换。

 给出的这个命令字串可以包括一个或多个%p %f扩展。每一个%p实例都被解释成将调试的进程的PID，每一个%f实例都被解释成要调试的进程的可执行文件路径。

 --input-fd=<number> [default: 0, stdin]

 使用--db-attach=yes和--gen-suppressions=yes选项，在发现错误时，Valgrind会停下来去读取键盘输入。默认地，从标准输入读取，所以关闭了标准输入的程序会有问题。这个选项允许你指定一个文件描述符来替代标准输入读取。

 --max-stackframe=<number> [default: 2000000]

 栈的最大值。如果栈指针的偏移超过这个数量，Valgrind则会认为程序是切换到了另外一个栈执行。如果在程序中有大量的栈分配的数组，你可能需要使用这个选项。valgrind保持对程序栈指针的追踪。如果栈指针的偏移超过了这个数量，Valgrind假定你的程序切换到了另外一个栈，并且Memcheck行为与栈指

 针的偏移没有超出这个数量将会不同。通常这种机制运转得很好。然而，如果你的程序在栈上申请了大的结构，这种机制将会表现得愚蠢，并且Memcheck将会报告大量的非法栈内存访问。这个选项允许把这个阀值设置为其它值。应该只在Valgrind的调试输出中显示需要这么做时才使用这个选项。在这种情况下，它会告诉你应该指定的新的阀值。普遍地，在栈中分配大块的内存是一个坏的主意。因为这很容易用光你的栈空间，尤其是在内存受限的系统或者支持大量小堆栈的线程的系统上，因为Memcheck执行的错误检查，对于堆上的数据比对栈上的数据要高效很多。如果你使用这个选项，你可能希望考虑重写代码在堆上分配内存而不是在栈上分配。

### MALLOC()相关的选项:

 对于使用自有版本的malloc() (例如Memcheck和massif)，下面的选项可以使用。

 --alignment=<number> [default: 8]

 默认Valgrind的malloc(),realloc(), 等等，是8字节对齐地址的。这是大部分处理器的标准。然而，一些程序可能假定malloc()等总是返回16字节或更多对齐的内存。提供的数值必须在8和4096区间之内，并且必须是2的幂数。

 非通用选项：

 这些选项可以用于所有的工具，它们影响Valgrind core的几个特性。大部分人不会用到这些选项。

 --run-libc-freeres=<yes|no> [default: yes]

 GNU C库(libc.so)，所有程序共用的，可能会分配一部分内存自已用。通常在程序退出时释放内存并不麻烦 -- 这里没什么问题，因为Linux内核在一个进程退出时会回收进程全部的资源，所以这只是会造成速度慢。glibc的作者认识到这样会导致内存检查器，像Valgrind，在退出时检查内存错误的报告glibc的内存泄漏问题，为了避免这个问题，他们提供了一个__libc_freeres()例程特别用来让glibc释放分配的所有内存。因此Memcheck在退出时尝试着去运行__libc_freeres()。不幸的是，在glibc的一些版本中，__libc_freeres是有bug会导致段错误的。这在Red Hat 7.1上有特别声明。所以，提供这个选项来决定是否运行__libc_freeres。如果你的程序看起来在Valgrind上运行得很好，但是在退出时发生段错误，你可能需要指定--run-libc-freeres=no来修正，这将可能错误的报告libc.so的内存泄漏。

 --sim-hints=hint1,hint2,...

 传递杂凑的提示给Valgrind，轻微的修改模拟行为的非标准或危险方式，可能有助于模拟奇怪的特性。默认没有提示打开。小心使用！目前已知的提示有：

 l lax-ioctls: 对ioctl的处理非常不严格，唯一的假定是大小是正确的。不需要在写时缓冲区完全的初始化。没有这个，用大量的奇怪的ioctl命令来使用一些设备驱动将会非常烦人。

 l enable-inner:打开某些特殊的效果，当运行的程序是Valgrind自身时。

 --kernel-variant=variant1,variant2,...

 处理系统调用和ioctls在这个平台的默认核心上产生不同的变量。这有助于运行在改进过的内核或者支持非标准的ioctls上。小心使用。如果你不理解这个选项做的是什么那你几乎不需要它。已经知道的变量有：

 l bproc: 支持X86平台上的sys_broc系统调用。这是为了运行在BProc，它是标准Linux的一个变种，有时用来构建集群。

 --show-emwarns=<yes|no> [default: no]

 当这个选项打开时，Valgrind在一些特定的情况下将对CPU仿真产生警告。通常这些都是不引人注意的。

 --smc-check=<none|stack|all> [default: stack]

 这个选项控制Valgrind对自我修改的代码的检测。Valgrind可以不做检测，可以检测栈中自我修改的代码，或者任意地方检测自我修改的代码。注意默认选项是捕捉绝大多数情况，到目前我们了解的情况为止。使用all选项时会极大的降低速度。(但是用none选项运行极少影响速度，因为对大多数程序，非常少的代码被添加到栈中)

### 调试VALGRIND选项：

 还有一些选项是用来调试Valgrind自身的。在运行一般的东西时不应该需要的。如果你希望看到选项列表，使用--help-debug选项。

 内存检查选项：

 --leak-check=<no|summary|yes|full> [default: summary]

 当这个选项打开时，当客户程序结束时查找内存泄漏。内存泄漏意味着有用malloc分配内存块，但是没有用free释放，而且没有指针指向这块内存。这样的内存块永远不能被程序释放，因为没有指针指向它们。如果设置为summary，Valgrind会报告有多少内存泄漏发生了。如果设置为full或yes，Valgrind给出每一个独立的泄漏的详细信息。

 --show-reachable=<yes|no> [default: no]

 当这个选项关闭时，内存泄漏检测器只显示没有指针指向的内存块，或者只能找到指向块中间的指针。当这个选项打开时，内存泄漏检测器还报告有指针指向的内存块。这些块是最有可能出现内存泄漏的地方。你的程序可能，至少在原则上，应该在退出前释放这些内存块。这些有指针指向的内存块和没有指针指向的内存块，或者只有内部指针指向的块，都可能产生内存泄漏，因为实际上没有一个指向块起始的指针可以拿来释放，即使你想去释放它。

 --leak-resolution=<low|med|high> [default: low]

 在做内存泄漏检查时，确定memcheck将怎么样考虑不同的栈是相同的情况。当设置为low时，只需要前两层栈匹配就认为是相同的情况；当设置为med，必须要四层栈匹配，当设置为high时，所有层次的栈都必须匹配。对于hardcore内存泄漏检查，你很可能需要使用--leak-resolution=high和--num-callers=40或者更大的数字。注意这将产生巨量的信息，这就是为什么默认选项是四个调用者匹配和低分辨率的匹配。注意--leak-resolution= 设置并不影响memcheck查找内存泄漏的能力。它只是改变了结果如何输出。

 --freelist-vol=<number> [default: 5000000]

 当客户程序使用free(C中)或者delete(C++)释放内存时，这些内存并不是马上就可以用来再分配的。这些内存将被标记为不可访问的，并被放到一个已释放内存的队列中。这样做的目的是，使释放的内存再次被利用的点尽可能的晚。这有利于memcheck在内存块释放后这段重要的时间检查对块不合法的访问。这个选项指定了队列所能容纳的内存总容量，以字节为单位。默认的值是5000000字节。增大这个数目会增加memcheck使用的内存，但同时也增加了对已释放内存的非法使用的检测概率。

 --workaround-gcc296-bugs=<yes|no> [default: no]

 当这个选项打开时，假定读写栈指针以下的一小段距离是gcc 2.96的bug，并且不报告为错误。距离默认为256字节。注意gcc 2.96是一些比较老的Linux发行版(RedHat 7.X)的默认编译器，所以你可能需要使用这个选项。如果不是必要请不要使用这个选项，它可能会使一些真正的错误溜掉。一个更好的解决办法是使用较新的，修正了这个bug的gcc/g++版本。

 --partial-loads-ok=<yes|no> [default: no]

 控制memcheck如何处理从地址读取时字长度，字对齐，因此哪些字节是可以寻址的，哪些是不可以寻址的。当设置为yes是，这样的读取并不抛出一个寻址错误。而是从非法地址读取的V字节显示为未定义，访问合法地址仍然是像平常一样映射到内存。设置为no时，从部分错误的地址读取与从完全错误的地址读取同样处理：抛出一个非法地址错误，结果的V字节显示为合法数据。注意这种代码行为是违背ISO C/C++标准，应该被认为是有问题的。如果可能，这种代码应该修正。这个选项应该只是做为一个最后考虑的方法。

 --undef-value-errors=<yes|no> [default: yes]

 控制memcheck是否检查未定义值的危险使用。当设为yes时，Memcheck的行为像Addrcheck, 一个轻量级的内存检查工具，是Valgrind的一个部分，它并不检查未定义值的错误。使用这个选项，如果你不希望看到未定义值错误。

### CACHEGRIND选项：

 手动指定I1/D1/L2缓冲配置，大小是用字节表示的。这三个必须用逗号隔开，中间没有空格，例如： valgrind --tool=cachegrind --I1=65535,2,64你可以指定一个，两个或三个I1/D1/L2缓冲。如果没有手动指定，每个级别使用普通方式(通过CPUID指令得到缓冲配置，如果失败，使用默认值)得到的配置。

 --I1=<size>,<associativity>,<line size>

 指定第一级指令缓冲的大小，关联度和行大小。

 --D1=<size>,<associativity>,<line size>

 指定第一级数据缓冲的大小，关联度和行大小。

 --L2=<size>,<associativity>,<line size>

 指定第二级缓冲的大小，关联度和行大小。

 CALLGRIND选项：

 --heap=<yes|no> [default: yes]

 当这个选项打开时，详细的追踪堆的使用情况。关闭这个选项时，massif.pid.txt或massif.pid.html将会非常的简短。

 --heap-admin=<number> [default: 8]

 每个块使用的管理字节数。这只能使用一个平均的估计值，因为它可能变化。glibc使用的分配器每块需要4\~15字节，依赖于各方面的因素。管理已经释放的块也需要空间，尽管massif不计算这些。

 --stacks=<yes|no> [default: yes]

 当打开时，在剖析信息中包含栈信息。多线程的程序可能有多个栈。

 --depth=<number> [default: 3]

 详细的堆信息中调用过程的深度。增加这个值可以给出更多的信息，但是massif会更使这个程序运行得慢，使用更多的内存，并且产生一个大的massif.pid.txt或者massif.pid.hp文件。

 --alloc-fn=<name>

 指定一个分配内存的函数。这对于使用malloc()的包装函数是有用的，可以用它来填充原来无效的上下文信息。(这些函数会给出无用的上下文信息，并在图中给出无意义的区域)。指定的函数在上下文中被忽略，例如，像对malloc()一样处理。这个选项可以在命令行中重复多次，指定多个函数。

 --format=<text|html> [default: text]

 产生text或者HTML格式的详细堆信息，文件的后缀名使用.txt或者.html。

### HELGRIND选项：

 --private-stacks=<yes|no> [default: no]

 假定线程栈是私有的。

 --show-last-access=<yes|some|no> [default: no]

 显示最后一次字访问出错的位置。

### LACKEY选项：

 --fnname=<name> [default: _dl_runtime_resolve()]

 对<name>函数计数。

 --detailed-counts=<no|yes> [default: no]

 对读取，存储和alu操作计数。