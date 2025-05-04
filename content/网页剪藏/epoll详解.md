---
date: 2025-05-04
title: Epoll详细介绍 | [转载](https://mp.weixin.qq.com/s/pahk8ay5MvkvONeg1-M82w)
tags: ["网络编程", epoll]
categories: ["博客剪藏"]
series: []
author: 往事敬秋风
---

# 腾讯二面追问epoll，它凭啥性能一骑绝尘？

> [!warning] 声明
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://mp.weixin.qq.com/s/pahk8ay5MvkvONeg1-M82w)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [腾讯二面追问epoll，它凭啥性能一骑绝尘？](https://mp.weixin.qq.com/s/pahk8ay5MvkvONeg1-M82w)

---

epoll 性能高，主要得益于其独特设计。在事件驱动方面，摒弃传统 select 和 poll 的轮询方式，仅在文件描述符有实际事件发生时，才由内核通知应用程序，极大减少无效检查，像在拥有大量并发连接的场景中，能精准定位到活跃连接，避免对众多无事件连接的遍历。在数据结构运用上，采用红黑树管理注册的文件描述符，其插入、删除和查找的时间复杂度为 O (log N)，远优于传统线性结构；同时利用就绪链表，当文件描述符就绪时，内核将其从红黑树移至链表，epoll\_wait 只需遍历该链表，就能获取就绪事件，提升了事件获取效率。

在数据传输方面，借助 mmap 技术，在内核与用户空间建立共享内存，减少数据在内核缓冲区与用户空间应用程序缓冲区之间的拷贝次数，提高传输效率。此外，epoll 支持水平触发（LT）和边缘触发（ET）两种模式，边缘触发模式仅在文件描述符状态变化瞬间通知一次应用程序，促使应用程序一次性处理完相关数据，减少 epoll\_wait 调用次数，提升效率。而且，epoll 由内核维护就绪列表，避免了传统 select 和 poll 在用户态与内核态频繁拷贝文件描述符集合的操作，降低了系统开销 。

## 一、epoll 技术简介

### IO 多路复用的概念

在深入了解 epoll 之前，我们先来理解一下 IO 多路复用的概念。在网络编程中，我们常常会遇到这样的场景：一个服务器需要处理多个客户端的连接和数据传输 。如果采用传统的方式，为每个客户端连接创建一个单独的线程或进程来处理，那么当客户端数量增多时，系统资源会被大量消耗，性能也会急剧下降。

IO 多路复用就像是一个 “万能助手”，它可以让一个线程来处理多个 I/O 流。打个比方，你开了一家餐厅，来了很多桌客人 。如果每个客人都安排一个服务员专门服务，那成本可太高了。最好的办法是安排一个机灵的服务员，他可以同时照顾好几桌客人，哪个客人有需求（比如要点餐、加水），他就马上过去服务。在网络编程里，这个服务员就是 IO 多路复用机制，而客人就是一个个 I/O 流，这样就能大大提高效率，节省资源。

常见的 IO 多路复用技术有 select、poll 和 epoll，而 epoll 就是其中的 “佼佼者”，在性能上有着独特的优势。

### epoll 技术概述

从技术原理的深度剖析来看，epoll 摒弃了传统 select 和 poll 采用的低效轮询机制。传统方式下，就如同在一个巨大的仓库里，不管货物有没有变化，都要逐个去查看，在连接数量众多时，大量的时间和资源就浪费在了这些无效的检查上。而 epoll 采用事件驱动机制，当文件描述符状态发生变化，比如有数据可读或可写时，内核会主动发出通知，应用程序只需关注这些有事件发生的文件描述符即可，这大大减少了无效操作，就好比仓库有了智能提示系统，货物一有变动就马上提醒，无需盲目查找。

epoll 的数据结构设计堪称精妙绝伦。它利用红黑树来管理大量的文件描述符，红黑树的特性使得插入、删除和查找操作的时间复杂度仅为 O (log N)，即便面对海量的文件描述符，也能快速定位和处理。同时，epoll 维护着一个就绪链表，一旦文件描述符就绪，内核会迅速将其放入链表中。这样，当应用程序调用 epoll\_wait 获取就绪事件时，只需遍历这个就绪链表，无需像传统机制那样对所有文件描述符进行全量扫描，大大提高了事件获取的效率，如同从精心整理的货架上快速找到所需物品。

epoll 在数据传输方面也有着独特优势。它借助 mmap 技术，在内核空间与用户空间建立起共享内存。在传统数据传输过程中，数据从内核缓冲区到用户空间应用程序缓冲区，往往需要多次拷贝，这无疑增加了时间和资源开销。而 epoll 通过共享内存，让数据传输更直接高效，减少了拷贝次数，加快了数据传输速度，就像开辟了一条数据传输的 “高速公路”。

举个例子，一个热门的网站服务器，每天都有大量的用户访问。服务器需要同时处理这些用户的连接请求，接收他们发送的数据（比如用户的登录信息、搜索关键词等），并返回相应的响应（比如网页内容、搜索结果）。如果使用 epoll，服务器就可以通过 epoll 来监听这些大量的用户连接对应的文件描述符，一旦有某个用户发送了数据过来，epoll 就能迅速感知到，并通知服务器程序去读取和处理这些数据 ，这样就能高效地应对高并发的网络请求了。

## 二、Epoll 的数据结构

epoll 之所以性能卓越，离不开其精心设计的数据结构。epoll 主要依赖红黑树和双向链表这两种数据结构来实现高效的事件管理，再配合三个核心 API，让它在处理大量并发连接时游刃有余 。

* epoll 工作在应用程序和内核协议栈之间。
* epoll 是在内核协议栈和 vfs 都有的情况下才有的。

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-ut72x3x.jpg)

**epoll 的核心数据结构是：1 个红黑树和 1 个双向链表。还有 3 个核心 API。**

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-uj268tl.jpg)

可以看到，链表和红黑树使用的是同一个结点。实际上是红黑树管理所有的 IO，当内部 IO 就绪的时候就会调用 epoll 的回调函数，将相应的 IO 添加到就绪链表上。数据结构有 epitm 和 eventpoll，分别代表红黑树和单个结点，在单个结点上分别使用 rbn 和 rblink 使得结点同时指向两个数据结构。

### 红黑树的巧妙运用

epoll 使用红黑树来管理所有注册的文件描述符。红黑树是一种自平衡的二叉搜索树，它有着非常优秀的性质：每个节点要么是红色，要么是黑色；根节点是黑色；所有叶子节点（通常是 NULL 节点）是黑色；如果一个节点是红色，那么它的两个子节点都是黑色；从任一节点到其每个叶子的所有路径都包含相同数目的黑色节点 。这些性质保证了红黑树的高度近似平衡，使得查找、插入和删除操作的时间复杂度都稳定在 O (log n)，这里的 n 是红黑树中节点的数量。

* 因为链表在查询，删除的时候毫无疑问时间复杂度是 O(n)；
* 数组查询很快，但是删除和新增时间复杂度是 O(n)；
* 二叉搜索树虽然查询效率是 lgn，但是如果不是平衡的，那么就会退化为线性查找，复杂度直接来到 O(n)；
* B+ 树是平衡多路查找树，主要是通过降低树的高度来存储上亿级别的数据，但是它的应用场景是内存放不下的时候能够用最少的 IO 访问次数从磁盘获取数据。比如数据库聚簇索引，成百上千万的数据内存无法满足查找就需要到内存查找，而因为 B+ 树层高很低，只需要几次磁盘 IO 就能获取数据到内存，所以在这种磁盘到内存访问上 B+ 树更适合。

因为我们处理上万级的 fd，它们本身的存储空间并不会很大，所以倾向于在内存中去实现管理，而红黑树是一种非常优秀的平衡树，它完全是在内存中操作，而且查找，删除和新增时间复杂度都是 lgn，效率非常高，因此选择用红黑树实现 epoll 是最佳的选择。

当然不选择用 AVL 树是因为红黑树是不符合 AVL 树的平衡条件的，红黑树用非严格的平衡来换取增删节点时候旋转次数的降低，任何不平衡都会在三次旋转之内解决；而 AVL 树是严格平衡树，在增加或者删除节点的时候，根据不同情况，旋转的次数比红黑树要多。所以红黑树的插入效率更高。

我们来具体分析一下。假如我们有一个服务器，需要监听 1000 个客户端的连接，每个连接对应一个文件描述符。如果使用普通的链表来管理这些文件描述符，当我们要查找某个特定的文件描述符时，最坏情况下需要遍历整个链表，时间复杂度是 O (n)，也就是需要 1000 次比较操作。但如果使用红黑树，由于其平衡特性，即使在最坏情况下，查找一个文件描述符也只需要 O (log n) 次比较操作，对于 1000 个节点的红黑树，log₂1000 约等于 10 次左右，相比链表效率大大提高。同样，在插入新的文件描述符（比如有新的客户端连接）和删除文件描述符（比如客户端断开连接）时，红黑树的 O (log n) 时间复杂度也比链表的 O (n) 高效得多。

再对比一下其他数据结构。数组虽然查询效率高，时间复杂度为 O (1)，但插入和删除操作比较麻烦，平均时间复杂度为 O (n) 。二叉搜索树在理想情况下查找、插入和删除的时间复杂度是 O (log n)，但如果树的平衡性被破坏，比如节点插入顺序不当，就可能退化为链表，时间复杂度变成 O (n)。B + 树主要用于磁盘存储，适合处理大量数据且需要频繁磁盘 I/O 的场景，在内存中管理文件描述符不如红黑树高效。所以，综合考虑，红黑树是 epoll 管理大量文件描述符的最佳选择，它能够快速地定位和操作文件描述符，大大提高了 epoll 的性能。

### 就绪 socket 列表-双向链表

除了红黑树，epoll 还使用双向链表来存储就绪的 socket。当某个文件描述符上有事件发生（比如有数据可读、可写），对应的 socket 就会被加入到这个双向链表中。双向链表的优势在于它可以快速地插入和删除节点，时间复杂度都是 O (1) 。这对于 epoll 来说非常重要，因为在高并发场景下，就绪的 socket 可能随时增加或减少。

就绪列表存储的是就绪的 socket，所以它应能够快速的插入数据；程序可能随时调用 epoll\_ctl 添加监视 socket，也可能随时删除。当删除时，若该 socket 已经存放在就绪列表中，它也应该被移除。（事实上，每个 epoll\_item 既是红黑树节点，也是链表节点，删除红黑树节点，自然删除了链表节点）所以就绪列表应是一种能够快速插入和删除的数据结构。双向链表就是这样一种数据结构，epoll 使用双向链表来实现就绪队列（rdllist）。

想象一下，在一个繁忙的在线游戏服务器中，同时有大量玩家在线。每个玩家的连接都由一个 socket 表示，当某个玩家发送了操作指令（比如移动、攻击等），对应的 socket 就有数据可读，需要被加入到就绪列表中等待服务器处理。如果使用单向链表，插入节点时虽然也能实现，但删除节点时，由于单向链表只能从前往后遍历，找到要删除节点的前驱节点比较麻烦，时间复杂度会达到 O (n) 。而双向链表每个节点都有指向前驱和后继节点的指针，无论是插入还是删除节点，都可以在 O (1) 时间内完成。当服务器处理完某个 socket 的事件后，如果该 socket 不再有就绪事件，就可以快速地从双向链表中删除，不会影响其他节点的操作。

双向链表和红黑树在 epoll 中协同工作。红黑树负责管理所有注册的文件描述符，保证文件描述符的增删查操作高效进行；而双向链表则专注于存储就绪的 socket，让应用程序能够快速获取到有事件发生的 socket 并进行处理。当一个 socket 的事件发生时，epoll 会先在红黑树中找到对应的节点，然后将其加入到双向链表中。这样，epoll\_wait 函数只需要遍历双向链表，就能获取到所有就绪的 socket，避免了对大量未就绪 socket 的无效遍历，大大提高了事件处理的效率。

**红黑树和就绪队列的关系**

红黑树的结点和就绪队列的结点的同一个节点，所谓的加入就绪队列，就是将结点的前后指针联系到一起。所以就绪了不是将红黑树结点 delete 掉然后加入队列。他们是同一个结点，不需要 delete。

```
struct epitem {
RB_ ENTRY(epitem) rbn;
LIST_ ENTRY(epitem) rdlink;
int rdy; //exist in List
int sockfd;
struct epoll_ event event ;
};
struct eventpoll {
ep_ _rb_ tree rbr;
int rbcnt ;
LIST_ HEAD( ,epitem) rdlist;
int rdnum;
int waiting;
pthread_ mutex_ t mtx; //rbtree update
pthread_ spinlock_ t 1ock; //rdList update
pthread_ cond_ _t cond; //bLock for event
pthread_ mutex_ t cdmtx; //mutex for cond
};|
```

### 三个核心 API 解析

epoll 提供了三个核心 API，分别是 epoll\_create、epoll\_ctl 和 epoll\_wait，它们是使用 epoll 的关键。

 **(1)epoll_create 函数用于创建一个 epoll 实例，返回一个 epoll 专用的文件描述符。它的原型是：**

```
int epoll_create(int size)
```

功能：内核会产生一个 epoll 实例数据结构并返回一个文件描述符 epfd，这个特殊的描述符就是 epoll 实例的句柄，后面的两个接口都以它为中心。同时也会创建红黑树和就绪列表，红黑树来管理注册 fd，就绪列表来收集所有就绪 fd。size 参数表示所要监视文件描述符的最大值，不过在后来的 Linux 版本中已经被弃用（同时，size 不要传 0，会报 invalid argument 错误）。

在较新的 Linux 版本中，size 参数已经被弃用，但仍然需要传入一个大于 0 的值。这个函数在内核中创建了一个 eventpoll 结构体，其中包含了红黑树和双向链表等数据结构，用于后续对文件描述符的管理。简单来说，它就像是创建了一个 “监控中心”，后续的操作都围绕这个 “监控中心” 展开。

 **(2)epoll_ctl 函数用于控制 epoll 实例，它可以向 epoll 实例中添加、修改或删除要监控的文件描述符及其对应的事件。函数原型如下：**

```
int epoll_ctl(int epfd， int op， int fd， struct epoll_event *event)
```

功能：将被监听的 socket 文件描述符添加到红黑树或从红黑树中删除或者对监听事件进行修改；同时向内核中断处理程序注册一个回调函数，内核在检测到某文件描述符可读/可写时会调用回调函数，该回调函数将文件描述符放在就绪链表中。

参数 epfd 是 epoll\_create 返回的文件描述符；op 表示操作类型，有 EPOLL\_CTL\_ADD（添加）、EPOLL\_CTL\_MOD（修改）、EPOLL\_CTL\_DEL（删除）三种取值；fd 是要操作的文件描述符；event 是一个指向 epoll\_event 结构体的指针，用于指定要监控的事件类型，比如 EPOLLIN（可读）、EPOLLOUT（可写）、EPOLLERR（错误）等。例如，我们要向 epoll 实例中添加一个监听 socket，代码可以这样写：

```
int epfd = epoll_create(1024);
int listenfd = socket(AF_INET, SOCK_STREAM, 0);
struct epoll_event ev;
ev.data.fd = listenfd;
ev.events = EPOLLIN;
epoll_ctl(epfd, EPOLL_CTL_ADD, listenfd, &ev);
```

这段代码首先创建了一个 epoll 实例，然后创建了一个监听 socket，接着设置了要监控的事件为 EPOLLIN（即监听 socket 有数据可读时触发事件），最后通过 epoll\_ctl 将监听 socket 添加到 epoll 实例中。

 **(3)epoll_wait 函数用于等待事件的发生，它会阻塞当前线程，直到有注册的事件发生或者超时。函数原型为：**

```
int epoll_wait(int epfd， struct epoll_event *events， int maxevents， int timeout);
```

功能：阻塞等待注册的事件发生，返回事件的数目，并将触发的事件写入 events 数组中。

epfd 是 epoll 实例的文件描述符；events 是一个 epoll\_event 结构体数组，用于存储发生的事件；maxevents 表示最多能返回的事件数；timeout 是超时时间，单位是毫秒，-1 表示永久阻塞，0 表示立即返回不阻塞。当有事件发生时，epoll\_wait 会将发生事件的文件描述符和事件类型填充到 events 数组中，并返回事件的数量。例如：

```
struct epoll_event events[10];
int nfds = epoll_wait(epfd, events, 10, -1);
for (int i = 0; i < nfds; i++) {
    int fd = events[i].data.fd;
    // 根据事件类型处理相应的逻辑
    if (events[i].events & EPOLLIN) {
        // 处理读事件
    } else if (events[i].events & EPOLLOUT) {
        // 处理写事件
    }
}
```

这段代码通过 epoll\_wait 等待事件发生，最多返回 10 个事件。当有事件发生时，遍历 events 数组，根据不同的事件类型（这里只简单示例了读和写事件）进行相应的处理。

* events: 用来记录被触发的 events，其大小应该和 maxevents 一致
* maxevents: 返回的 events 的最大个数处于 ready 状态的那些文件描述符会被复制进 ready list 中，epoll\_wait 用于向用户进程返回 ready list(就绪列表)

events 和 maxevents 两个参数描述一个由用户分配的 struct epoll event 数组，调用返回时，内核将就绪列表(双向链表)复制到这个数组中，并将实际复制的个数作为返回值。

注意，如果就绪列表比 maxevents 长，则只能复制前 maxevents 个成员；反之，则能够完全复制就绪列表。

另外，struct epoll event 结构中的 events 域在这里的解释是：在被监测的文件描述符上实际发生的事件。

调用 epoll\_create 时，在内核 cache 里建了个红黑树用于存储以后 epoll\_ctl 传来的 socket 外，还会再建立一个 list 链表，用于存储准备就绪的事件，内部使用回调机制，红黑树中的节点通过回调函数添加到双向链表。

当 epoll\_wait 调用时，仅仅观察这个双向链表里有没有数据即可。有数据就返回，没有数据就 sleep，等到 timeout 时间到后即使链表没数据也返回。所以，epoll\_wait 非常高效。而且，通常情况下即使我们要监控百万计的句柄，大多一次也只返回很少量的准备就绪句柄而已，所以，epoll\_wait 仅需要从内核态 copy 少量的句柄到用户态而已。

**epoll 和 poll/select 区别？**

* （1）使用接口：select/poll 需要把 fds 总集拷贝到内核协议栈中，epoll 不需要。
* （2）实现原理：select/poll 在内核内循环 遍历是否有就绪 io，epoll 是单个加入红黑树。

解释：poll/select 每次都要把 fds 总集拷贝到内核协议栈内，内核采取轮询/遍历，返回就绪的 fds 集合。（大白话：poll/select 的 fds 是存放在用户态协议栈，调用时拷贝到内核协议栈中并轮询，轮询完成后再拷贝到用户态协议栈）。而 epoll 是通过 epoll\_ctl 每次有新的 io 就加入到红黑树里，有触发的时候用 epoll\_wait 带出即可，不需要拷贝总集。

最后总结一下，这三个核心 API 相互配合，epoll\_create 创建监控实例，epoll\_ctl 管理要监控的文件描述符和事件，epoll\_wait 等待并获取发生的事件，共同构成了 epoll 高效的事件驱动模型，使得开发者能够轻松地实现高性能的网络编程。

## 三、Epoll 的工作原理剖析

### 协议栈与 Epoll 的通信机制

在网络通信中，协议栈扮演着关键角色，它负责处理网络数据包的接收、解析和发送等底层操作。而 epoll 则专注于高效地管理和通知应用程序关于网络事件的发生 。

**那么，协议栈与 epoll 是如何通信的呢？**

当网络数据包到达网卡时，网卡会将数据通过 DMA（直接内存访问）方式拷贝到内核的内存缓冲区中 。接着，内核协议栈开始工作，它会对数据包进行解析，比如解析 TCP 头、UDP 头以及应用层协议头，以获取数据包的相关信息，如源 IP、目的 IP、源端口、目的端口等。在解析过程中，如果协议栈发现某个 socket 对应的接收缓冲区有新的数据到达（或者 socket 可写，即发送缓冲区有空闲空间等其他事件发生），它就会触发一个回调机制来通知 epoll。

具体来说，这个回调函数是在 epoll\_ctl 函数将 socket 添加到 epoll 实例时注册到 socket 上的 。当协议栈检测到事件时，它会调用这个回调函数。回调函数会根据 socket 的五元组信息（源 IP、源端口、目的 IP、目的端口和协议类型），在 epoll 维护的红黑树中查找对应的节点。由于红黑树的高效查找特性（时间复杂度为 O (log n)），能够快速定位到对应的 socket 节点 。找到节点后，回调函数会将该节点加入到 epoll 的就绪链表中，表示这个 socket 上有事件发生，需要应用程序进行处理。

举个例子，假设有一个在线聊天服务器，有大量用户同时在线聊天。当某个用户发送一条消息时，消息以数据包的形式通过网络传输到服务器的网卡 。协议栈接收到数据包后，解析出是某个聊天 socket 有新数据到达，于是调用回调函数。回调函数通过 socket 的五元组信息，在红黑树中迅速找到对应的 socket 节点，将其加入就绪链表。这样，服务器程序调用 epoll\_wait 时，就能获取到这个就绪的 socket，进而读取用户发送的消息并进行处理，比如将消息转发给其他聊天用户 。

### Epoll 的回调机制

epoll 的回调机制是其高效的关键所在 。当一个文件描述符（比如 socket）就绪时（即有数据可读、可写或者发生错误等事件），内核会调用预先注册的回调函数 。这个回调函数的主要任务是将就绪的 socket 放入 epoll 的就绪链表中，然后唤醒正在等待的应用程序（通过 epoll\_wait 阻塞的应用程序线程）。

我们来深入分析一下这个过程。当 socket 有数据可读时，内核首先会将数据从内核缓冲区拷贝到 socket 的接收缓冲区 。完成数据拷贝后，内核触发回调函数。回调函数会将该 socket 对应的 epitem 结构体（epitem 是 epoll 内部用于管理文件描述符的数据结构，它同时是红黑树节点和就绪链表节点）从红黑树中取出（由于红黑树节点和就绪链表节点是同一结构体，所以不需要额外的操作来关联），然后将其加入到就绪链表的尾部 。接着，回调函数会检查 epoll 的等待队列，看是否有应用程序线程在等待事件发生。如果有，就通过回调函数 default\_wake\_func 唤醒这些线程 。

对比一下 select 和 poll，它们没有这样的回调机制。在 select 和 poll 中，应用程序需要不断地轮询所有注册的文件描述符，检查是否有事件发生 。假设一个服务器注册了 1000 个 socket，每次调用 select 或 poll 时，都需要对这 1000 个 socket 逐一检查，即使其中只有 1 个 socket 有事件发生，也需要遍历完所有 socket 。这种方式在高并发场景下效率极低，会浪费大量的 CPU 资源。而 epoll 通过回调机制，只有在真正有事件发生时才会将 socket 加入就绪链表，应用程序调用 epoll\_wait 时，只需要处理就绪链表中的 socket，大大减少了无效的轮询操作，提高了效率 。

再以刚才的在线聊天服务器为例，在 select 或 poll 模式下，服务器每次检查是否有新消息时，都要遍历所有在线用户的 socket，即使大部分用户没有发送消息，也需要检查一遍 。而在 epoll 模式下，只有当某个用户发送消息时，对应的 socket 才会被加入就绪链表，服务器只需要处理就绪链表中的 socket，无需对大量没有消息的 socket 进行无效检查，从而能够更高效地处理高并发的聊天消息 。

## 四、epoll 的实现原理

### epoll 常见问题

**⑴ 为什么需要 epoll？**

epoll 是 Linux 操作系统提供的一种事件驱动的 I/O 模型，用于高效地处理大量并发连接的网络编程。它相比于传统的 select 和 poll 方法，具有更高的性能和扩展性。使用 epoll 可以实现以下几个优势：

1. 高效处理大量并发连接：epoll 采用了事件驱动的方式，只有当有可读或可写事件发生时才会通知应用程序，避免了遍历所有文件描述符的开销。
2. 内核与用户空间数据拷贝少：使用 epoll 时，内核将就绪的文件描述符直接填充到用户空间的事件数组中，减少了内核与用户空间之间数据拷贝次数。
3. 支持边缘触发（Edge Triggered）模式：边缘触发模式下，仅在状态变化时才通知应用程序。这意味着每次通知只包含最新状态的文件描述符信息，可以有效避免低效循环检查。
4. 支持水平触发（Level Triggered）模式：水平触发模式下，在就绪期间不断地进行通知，直到应用程序处理完该文件描述符。

**⑵select 与 poll 的缺陷？**

select 和 poll 都是 Unix 系统中用来监视一组文件描述符的变化的系统调用。它们可以监视文件描述符的三种变化：可读性、可写性和异常条件。select 和 poll 的主要缺陷如下：

* 文件描述符数量限制：select 和 poll 都有一个限制，就是它们只能监视少于 1024 个文件描述符的变化。这对于现代的网络编程来说是不够的，因为一个进程往往需要监视成千上万的连接。
* 效率问题：虽然 select 和 poll 可以监视多个文件描述符，但是它们在每次调用的时候都需要传递所有要监视的文件描述符集合，这会导致效率的降低。
* 信息不足：select 和 poll 返回的只是哪些文件描述符已经准备好了，但是它们并不告诉你具体是哪一个。这就需要对所有要监视的文件描述符进行遍历，直到找到准备好的文件描述符为止。
* 信号中断：select 和 poll 调用可以被信号中断，这可能会导致调用失败。
* 为了解决这些问题，现代操作系统中引入了新的系统调用 epoll 来替代 select 和 poll。epoll 没有文件描述符的限制，它可以监视大量的文件描述符，并且可以实现即开即用，无需传递所有文件描述符集合。此外，epoll 可以直接告诉你哪些文件描述符已经准备好，这大大提高了处理效率。

### epoll 操作

epoll 在 linux 内核中申请了一个简易的文件系统，把原先的一个 select 或者 poll 调用分为了三个部分：调用 epoll\_create 建立一个 epoll 对象（在 epoll 文件系统中给这个句柄分配资源）、调用 epoll\_ctl 向 epoll 对象中添加连接的套接字、调用 epoll\_wait 收集发生事件的连接。这样只需要在进程启动的时候建立一个 epoll 对象，并在需要的时候向它添加或者删除连接就可以了，因此，在实际收集的时候，epoll\_wait 的效率会非常高，因为调用的时候只是传递了发生 IO 事件的连接。

**⑴epoll 实现**

我们以 linux 内核 2.6 为例，说明一下 epoll 是如何高效的处理事件的，当某一个进程调用 epoll\_create 方法的时候，Linux 内核会创建一个 eventpoll 结构体，这个结构体中有两个重要的成员。

- 第一个是 `rb_root rbr`，这是红黑树的根节点，存储着所有添加到 epoll 中的事件，也就是这个 epoll 监控的事件。
- 第二个是 `list_head rdllist` 这是一个双向链表，保存着将要通过 epoll_wait 返回给用户的、满足条件的事件。


每一个 epoll 对象都有一个独立的 eventpoll 结构体，这个结构体会在内核空间中创造独立的内存，用于存储使用 epoll\_ctl 方法向 epoll 对象中添加进来的事件。这些事件都会挂到 rbr 红黑树中，这样就能够高效的识别重复添加的节点。

所有添加到 epoll 中的事件都会与设备（如网卡等）驱动程序建立回调关系，也就是说，相应的事件发生时会调用这里的方法。这个回调方法在内核中叫做 ep\_poll\_callback，它把这样的事件放到 rdllist 双向链表中。在 epoll 中，对于每一个事件都会建立一个 epitem 结构体。

当调用 epoll\_wait 检查是否有发生事件的连接时，只需要检查 eventpoll 对象中的 rdllist 双向链表中是否有 epitem 元素，如果 rdllist 链表不为空，则把这里的事件复制到用户态内存中的同时，将事件数量返回给用户。通过这种方法，epoll\_wait 的效率非常高。epoll-ctl 在向 epoll 对象中添加、修改、删除事件时，从 rbr 红黑树中查找事件也非常快。这样，epoll 就能够轻易的处理百万级的并发连接。

**⑵epoll 工作模式**

epoll 有两种工作模式，LT（水平触发）模式与 ET（边缘触发）模式。默认情况下，epoll 采用 LT 模式工作。两个的区别是：

* Level\_triggered(水平触发)：当被监控的文件描述符上有可读写事件发生时，epoll\_wait()会通知处理程序去读写。如果这次没有把数据一次性全部读写完(如读写缓冲区太小)，那么下次调用 epoll\_wait() 时，它还会通知你在上没读写完的文件描述符上继续读写，当然如果你一直不去读写，它会一直通知你。如果系统中有大量你不需要读写的就绪文件描述符，而它们每次都会返回，这样会大大降低处理程序检索自己关心的就绪文件描述符的效率。
* Edge\_triggered(边缘触发)：当被监控的文件描述符上有可读写事件发生时，epoll\_wait() 会通知处理程序去读写。如果这次没有把数据全部读写完(如读写缓冲区太小)，那么下次调用 epoll\_wait()时，它不会通知你，也就是它只会通知你一次，直到该文件描述符上出现第二次可读写事件才会通知你。这种模式比水平触发效率高，系统不会充斥大量你不关心的就绪
* 文件描述符。

当然，在 LT 模式下开发基于 epoll 的应用要简单一些，不太容易出错，而在 ET 模式下事件发生时，如果没有彻底地将缓冲区的数据处理完，则会导致缓冲区的用户请求得不到响应。注意，默认情况下 Nginx 采用 ET 模式使用 epoll 的。

### I/O 多路复用

 **(1)阻塞 OR 非阻塞**

我们知道，对于 linux 来说，I/O 设备为特殊的文件，读写和文件是差不多的，但是 I/O 设备因为读写与内存读写相比，速度差距非常大。与 cpu 读写速度更是没法比，所以相比于对内存的读写，I/O 操作总是拖后腿的那个。网络 I/O 更是如此，我们很多时候不知道网络 I/O 什么时候到来，就好比我们点了一份外卖，不知道外卖小哥们什么时候送过来，这个时候有两个处理办法：

- 第一个是我们可以先去睡觉，外卖小哥送到楼下了自然会给我们打电话，这个时候我们在醒来取外卖就可以了。
- 第二个是我们可以每隔一段时间就给外卖小哥打个电话，这样就能实时掌握外卖的动态信息了。

第一种方式对应的就是阻塞的 I/O 处理方式，进程在进行 I/O 操作的时候，进入睡眠，如果有 I/O 时间到达，就唤醒这个进程。第二种方式对应的是非阻塞轮询的方式，进程在进行 I/O 操作后，每隔一段时间向内核询问是否有 I/O 事件到达，如果有就立刻处理。

**① 阻塞的原理**

工作队列

阻塞是进程调度的关键一环，指的是进程在等待某事件（如接收到网络数据）发生之前的等待状态，recv、select 和 epoll 都是阻塞方法，以简单网络编程为例。

下图中的计算机中运行着 A、B、C 三个进程，其中进程 A 执行着上述基础网络程序，一开始，这 3 个进程都被操作系统的工作队列所引用，处于运行状态，会分时执行：

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-qxnvn3e.jpg)

当进程 A 执行到创建 socket 的语句时，操作系统会创建一个由文件系统管理的 socket 对象（如下图）。这个 socket 对象包含了发送缓冲区、接收缓冲区、等待队列等成员。等待队列是个非常重要的结构，它指向所有需要等待该 socket 事件的进程。

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-zehka3f.jpg)

当程序执行到 recv 时，操作系统会将进程 A 从工作队列移动到该 socket 的等待队列中（如下图）。由于工作队列只剩下了进程 B 和 C，依据进程调度，cpu 会轮流执行这两个进程的程序，不会执行进程 A 的程序。所以进程 A 被阻塞，不会往下执行代码，也不会占用 cpu 资源。

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-dcn9ynu.jpg)

ps：操作系统添加等待队列只是添加了对这个“等待中”进程的引用，以便在接收到数据时获取进程对象、将其唤醒，而非直接将进程管理纳入自己之下。上图为了方便说明，直接将进程挂到等待队列之下。

**② 唤醒进程**

当 socket 接收到数据后，操作系统将该 socket 等待队列上的进程重新放回到工作队列，该进程变成运行状态，继续执行代码。也由于 socket 的接收缓冲区已经有了数据，recv 可以返回接收到的数据。

 **(2)线程池 OR 轮询**

在现实中，我们当然选择第一种方式，但是在计算机中，情况就要复杂一些。我们知道，在 linux 中，不管是线程还是进程都会占用一定的资源，也就是说，系统总的线程和进程数是一定的。如果有许多的线程或者进程被挂起，无疑是白白消耗了系统的资源。而且，线程或者进程的切换也是需要一定的成本的，需要上下文切换，如果频繁的进行上下文切换，系统会损失很大的性能。一个网络服务器经常需要连接成千上万个客户端，而它能创建的线程可能之后几百个，线程耗光就不能对外提供服务了。这些都是我们在选择 I/O 机制的时候需要考虑的。这种阻塞的 I/O 模式下，一个线程只能处理一个流的 I/O 事件，这是问题的根源。

这个时候我们首先想到的是采用线程池的方式限制同时访问的线程数，这样就能够解决线程不足的问题了。但是这又会有第二个问题了，多余的任务会通过队列的方式存储在内存只能够，这样很容易在客户端过多的情况下出现内存不足的情况。

还有一种方式是采用轮询的方式，我们只要不停的把所有流从头到尾问一遍，又从头开始。这样就可以处理多个流了。

 **(3)代理**

采用轮询的方式虽然能够处理多个 I/O 事件，但是也有一个明显的缺点，那就是会导致 CPU 空转。试想一下，如果所有的流中都没有数据，那么 CPU 时间就被白白的浪费了。

为了避免 CPU 空转，可以引进了一个代理。这个代理比较厉害，可以同时观察许多流的 I/O 事件，在空闲的时候，会把当前线程阻塞掉，当有一个或多个流有 I/O 事件时，就从阻塞态中醒来，于是我们的程序就会轮询一遍所有的流，这就是 select 与 poll 所做的事情，可见，采用 I/O 复用极大的提高了系统的效率。

### 内核接收网络数据全过程

如下图所示，进程在 recv 阻塞期间，计算机收到了对端传送的数据（步骤 ①）。数据经由网卡传送到内存（步骤 ②），然后网卡通过中断信号通知 CPU 有数据到达，CPU 执行中断程序（步骤 ③）。此处的中断程序主要有两项功能，先将网络数据写入到对应 socket 的接收缓冲区里面（步骤 ④），再唤醒进程 A（步骤 ⑤），重新将进程 A 放入工作队列中。

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-uwfoerd.jpg)

**唤醒线程的过程如下图所示：**

![图片](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/640-20250504195925-8pawj7g.jpg)

## 五、协议栈如何与 epoll 通信？

协议栈和 epoll 模块之间的通信是异步的，没有耦合，不需要等待。

**通知时机：**

1. 协议栈三次握手完成，往 accept 全连接队列里加入这个节点时，通知 epoll 有事件来了 epollin；
2. 客户端发了 1 个数据到协议栈，协议栈此时要返回 ack 给客户端的这里的时机，会通知 epoll 有事件可读 epollin。

## 六、epoll 线程安全如何加锁？

在使用 epoll 时，如果你有多个线程同时对同一个 epoll 实例进行操作（例如添加或删除文件描述符），就需要确保线程安全。可以通过以下几种方式加锁：

* 对红黑树枷锁：一种是锁整棵树，另一种是锁子树。一般使用互斥锁。
* 对就绪队列枷锁：用自旋锁，队列操作比较简单，等到一些时间比让出线程更高效点。

### 等待队列实现原理

 **(1)功能介绍**

进程有多种状态，当进程做好准备后，它就处于就绪状态（TASK\_RUNNING），放入运行队列，等待内核调度器来调度。当然，同一时刻可能有多个进程进入就绪状态，但是却可能只有 1 个 CPU 是空闲的，所以最后能不能在 CPU 上运行，还要取决于优先级等多种因素。当进程进行外部设备的 IO 等待操作时，由于外部设备的操作速度一般是非常慢的，所以进程会从就绪状态变为等待状态（休眠），进入等待队列，把 CPU 让给其它进程。直到 IO 操作完成，内核“唤醒”等待的进程，于是进程再度从等待状态变为就绪状态。

在用户态，进程进行 IO 操作时，可以有多种处理方式，如阻塞式 IO，非阻塞式 IO，多路复用(select/poll/epoll)，AIO（aio\_read/aio\_write）等等。这些操作在内核态都要用到等待队列。

 **(2)相关的结构体**

typedef struct \_\_wait\_queue wait\_queue\_t;

```
struct __wait_queue
{
    unsigned int flags;
    #define WQ_FLAG_EXCLUSIVE 0x01
    struct task_struct * task; // 等待队列节点对应的进程
    wait_queue_func_t func;   // 等待队列的回调函数 ，在进程被唤醒
    struct list_head task_list;
};
这个是等待队列的节点，在很多等待队列里，这个func函数指针默认为空函数。
但是，在select/poll/epoll函数中，这个func函数指针不为空，并且扮演着重要的角色。

struct __wait_queue_head
{
    spinlock_t lock;
    struct list_head task_list;
};
```

typedef struct \_\_wait\_queue\_head wait\_queue\_head\_t;这个是等待队列的头部。其中 task\_list 里有指向下一个节点的指针。为了保证对等待队列的操作是原子的，还需要一个自旋锁 lock。

这里需要提一下内核队列中被广泛使用的结构体 struct list\_head。

```
struct list_head
{
    struct list_head *next, *prev;
};
```

 **(3)实现原理**

可以看到，等待队列的核心是一个 list\_head 组成的双向链表。其中，第一个节点是队列的头，类型为 wait\_queue\_head\_t，里面包含了一个 list\_head 类型的成员 task\_list。

接下去的每个节点类型为 wait\_queue\_t，里面也有一个 list\_head 类型的成员 task\_list，并且有个指针指向等待的进程。通过这种方式，内核组织了一个等待队列。

**那么，这个等待队列怎样与一个事件关联呢？**

在内核中，进程在文件操作等事件上的等待，一定会有一个对应的等待队列的结构体与之对应。例如，等待管道的文件操作（在内核看来，管道也是一种文件）的进程都放在管道对应 inode.i\_pipe-\>wait 这个等待队列中。这样，如果管道文件操作完成，就可以很方便地通过 inode.i\_pipe-\>wait 唤醒等待的进程。

在大部分情况下（如系统调用 read），当前进程等待 IO 操作的完成，只要在内核堆栈中分配一个 wait\_queue\_t 的结构体，然后初始化，把 task 指向当前进程的 task\_struct，然后调用 add\_wait\_queue（）放入等待队列即可。

但是，在 select/poll 中，由于系统调用要监视多个文件描述符的操作，因此要把当前进程放入多个文件的等待队列，并且要分配多个 wait\_queue\_t 结构体。这时候，在堆栈上分配是不合适的。因为内核堆栈很小。所以要通过动态分配的方式来分配 wait\_queue\_t 结构体。除了在一些结构体里直接定义等待队列的头部，内核的信号量机制也大量使用了等待队列。信号量是为了进行进程同步而引入的。与自旋锁不同的是，当一个进程无法获得信号量时，它会把自己放到这个信号量的等待队列中，转变为等待状态。当其它进程释放信号量时，会唤醒等待的进程。

**epoll 关键结构体：**

```
struct ep_pqueue
{
    poll_table pt;
    struct epitem *epi;
};
```

这个结构体类似于 select/poll 中的 struct poll\_wqueues。由于 epoll 需要在内核态保存大量信息，所以光光一个回调函数指针已经不能满足要求，所以在这里引入了一个新的结构体 struct epitem。

```
struct epitem
{ 
    struct rb_node rbn;
    红黑树，用来保存eventpoll

    struct list_head rdllink;
    双向链表，用来保存已经完成的eventpoll

    struct epoll_filefd ffd;
    这个结构体对应的被监听的文件描述符信息

    int nwait;
    poll操作中事件的个数

    struct list_head pwqlist;
    双向链表，保存着被监视文件的等待队列，功能类似于select/poll中的poll_table

    struct eventpoll *ep;
    指向eventpoll，多个epitem对应一个eventpoll

    struct epoll_event event;
    记录发生的事件和对应的fd

    atomic_t usecnt;
    引用计数

    struct list_head fllink;
    双向链表，用来链接被监视的文件描述符对应的struct file。因为file里有f_ep_link，
    用来保存所有监视这个文件的epoll节点

    struct list_head txlink;
    双向链表，用来保存传输队列

    unsigned int revents;
    文件描述符的状态，在收集和传输时用来锁住空的事件集合
};
```

该结构体用来保存与 epoll 节点关联的多个文件描述符，保存的方式是使用红黑树实现的 hash 表。至于为什么要保存，下文有详细解释。它与被监听的文件描述符一一对应。

```
struct eventpoll
{ 
    spinlock_t lock;
    读写锁

    struct mutex mtx;
    读写信号量

    wait_queue_head_t wq; 
    wait_queue_head_t poll_wait;

    struct list_head rdllist;
    已经完成的操作事件的队列。

    struct rb_root rbr;
    保存epoll监视的文件描述符
    struct epitem *ovflist;
    struct user_struct *user;
};
```

这个结构体保存了 epoll 文件描述符的扩展信息，它被保存在 file 结构体的 private\_data 中。它与 epoll 文件节点一一对应。通常一个 epoll 文件节点对应多个被监视的文件描述符。所以一个 eventpoll 结构体会对应多个 epitem 结构体。

**那么，epoll 中的等待事件放在哪里呢？见下面**

```
struct eppoll_entry
{ 
    struct list_head llink;
    void *base;
    wait_queue_t wait;
    wait_queue_head_t *whead;
};
与select/poll的struct poll_table_entry相比，epoll的表示等待队列节点的结构体只是稍有不同，
与struct poll_table_entry比较一下。
struct poll_table_entry
{
    struct file * filp;
    wait_queue_t wait;
    wait_queue_head_t * wait_address;
};
```

由于 epitem 对应一个被监视的文件，所以通过 base 可以方便地得到被监视的文件信息。又因为一个文件可能有多个事件发生，所以用 llink 链接这些事件。

**相关内核代码:fs/eventpoll.c**

判断一个 tcp 套接字上是否有激活事件:net/ipv4/tcp.c:tcp\_poll 函数，每个 epollfd 在内核中有一个对应的 eventpoll 结构对象。

其中关键的成员是一个 readylist(eventpoll:rdllist)和一棵红黑树(eventpoll:rbr)，eventpoll 的红黑树中，红黑树的作用是使用者调用 EPOLL\_MOD 的时候可以快速找到 fd 对应的 epitem。

epoll\_ctl 的功能是实现一系列操作，如把文件与 eventpollfs 文件系统的 inode 节点关联起来。这里要介绍一下 eventpoll 结构体，它保存在 file-\>f\_private 中，记录了 eventpollfs 文件系统的 inode 节点的重要信息，其中成员 rbr 保存了该 epoll 文件节点监视的所有文件描述符。组织的方式是一棵红黑树，这种结构体在查找节点时非常高效。首先它调用 ep\_find()从 eventpoll 中的红黑树获得 epitem 结构体。然后根据 op 参数的不同而选择不同的操作。如果 op 为 EPOLL\_CTL\_ADD，那么正常情况下 epitem 是不可能在 eventpoll 的红黑树中找到的，所以调用 ep\_insert 创建一个 epitem 结构体并插入到对应的红黑树中。

ep\_insert()首先分配一个 epitem 对象，对它初始化后，把它放入对应的红黑树。此外，这个函数还要作一个操作，就是把当前进程放入对应文件操作的等待队列。这一步是由下面的代码完成的。

```
init_poll_funcptr(&epq.pt, ep_ptable_queue_proc);
......
revents = tfile->f_op->poll(tfile, &epq.pt);
```

函数先调用 init\_poll\_funcptr 注册了一个回调函数 ep\_ptable\_queue\_proc，ep\_ptable\_queue\_proc 函数会在调用 f\_op-\>poll 时被执行。

```
static void ep_ptable_queue_proc(struct file *file, wait_queue_head_t *whead,
           poll_table *pt)
{

struct epitem *epi = ep_item_from_epqueue(pt);

struct eppoll_entry *pwq;

if (epi->nwait >= 0 && (pwq = kmem_cache_alloc(pwq_cache, GFP_KERNEL))) {

 init_waitqueue_func_entry(&pwq->wait, ep_poll_callback);

 pwq->whead = whead;

pwq->base = epi;

add_wait_queue(whead, &pwq->wait);

list_add_tail(&pwq->llink, &epi->pwqlist);

 epi->nwait++;

} else {
 epi->nwait = -1;

 }
}
```

该函数分配一个 epoll 等待队列结点 eppoll\_entry：一方面把它挂到文件操作的等待队列中，另一方面把它挂到 epitem 的队列中。此外，它还注册了一个等待队列的回调函数 ep\_poll\_callback。当文件操作完成，唤醒当前进程之前，会调用 ep\_poll\_callback()，把 eventpoll 放到 epitem 的完成队列中（注释：通过查看代码，此处应该是把 epitem 放到 eventpoll 的完成队列，只有这样才能在 epoll\_wait()中只要看 eventpoll 的完成队列即可得到所有的完成文件描述符），并唤醒等待进程。

如果在执行 f\_op-\>poll 以后，发现被监视的文件操作已经完成了，那么把它放在完成队列中了，并立即把等待操作的那些进程唤醒。

```
if (!(epi = kmem_cache_alloc(epi_cache, GFP_KERNEL)))
return -ENOMEM;
ep_rbtree_insert(ep, epi);
```

调用 epoll\_wait 的时候,将 readylist 中的 epitem 出列,将触发的事件拷贝到用户空间.之后判断 epitem 是否需要重新添加回 readylist。

epitem 重新添加到 readylist 必须满足下列条件：

* 1. epitem 上有用户关注的事件触发.
* 2. epitem 被设置为水平触发模式(如果一个 epitem 被设置为边界触发则这个 epitem 不会被重新添加到 readylist 中，在什么时候重新添加到 readylist 请继续往下看)。

注意，如果 epitem 被设置为 EPOLLONESHOT 模式，则当这个 epitem 上的事件拷贝到用户空间之后,会将这个 epitem 上的关注事件清空(只是关注事件被清空,并没有从 epoll 中删除，要删除必须对那个描述符调 EPOLL\_DEL)，也就是说即使这个 epitem 上有触发事件，但是因为没有用户关注的事件所以不会被重新添加到 readylist 中。

epitem 被添加到 readylist 中的各种情况(当一个 epitem 被添加到 readylist 如果有线程阻塞在 epoll\_wait 中,那个线程会被唤醒)：

* 1)对一个 fd 调用 EPOLL\_ADD，如果这个 fd 上有用户关注的激活事件，则这个 fd 会被添加到 readylist
* 2)对一个 fd 调用 EPOLL\_MOD 改变关注的事件，如果新增加了一个关注事件且对应的 fd 上有相应的事件激活，则这个 fd 会被添加到 readylist.
* 3)当一个 fd 上有事件触发时(例如一个 socket 上有外来的数据)会调用 ep\_poll\_callback(见 eventpoll::ep\_ptable\_queue\_proc),

如果触发的事件是用户关注的事件，则这个 fd 会被添加到 readylist 中，了解了 epoll 的执行过程之后,可以回答一个在使用边界触发时常见的疑问.在一个 fd 被设置为边界触发的情况下,调用 read/write,如何正确的判断那个 fd 已经没有数据可读/不再可写.epoll 文档中的建议是直到触发 EAGAIN 错误.而实际上只要你请求字节数小于 read/write 的返回值就可以确定那个 fd 上已经没有数据可读/不再可写，最后用一个 epollfd 监听另一个 epollfd 也是合法的,epoll 通过调用 eventpoll::ep\_eventpoll\_poll 来判断一个 epollfd 上是否有触发的事件(只能是读事件)。

**以下是个人读代码总结：**

```
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events,

int, maxevents, int, timeout)
 SYSCALL_DEFINE4(epoll_ctl, int, epfd, int, op, int, fd,

struct epoll_event __user *, event)
epoll_ctl的机制大致如下：
mutex_lock(&ep->mtx);
epi = ep_find(ep, tfile, fd); //这里就是去ep->rbr 红黑树查找
error = -EINVAL;
switch (op) {
case EPOLL_CTL_ADD
if (!epi) {
             epds.events |= POLLERR | POLLHUP;
            error = ep_insert(ep, &epds, tfile, fd);

        } else
            error = -EEXIST;

        break;

    case EPOLL_CTL_DEL:

        if (epi)
             error = ep_remove(ep, epi);
        else
            error = -ENOENT;

        break;

     case EPOLL_CTL_MOD:

        if (epi) {

             epds.events |= POLLERR | POLLHUP;

            error = ep_modify(ep, epi, &epds);

         } else

             error = -ENOENT;
         break;
    }
   mutex_unlock(&ep->mtx);
```

### 源码分析

 **(1)sys_epoll_wait()函数：**

```
/* 
 * Implement the event wait interface for the eventpoll file. It is the kernel 
 * part of the user space epoll_wait(2). 
 */  
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events,  
        int, maxevents, int, timeout)  
{  
    int error;  
    struct file *file;  
    struct eventpoll *ep;  

    /* The maximum number of event must be greater than zero */  
    /* 
     * 检查maxevents参数。 
     */  
    if (maxevents <= 0 || maxevents > EP_MAX_EVENTS)  
        return -EINVAL;  

    /* Verify that the area passed by the user is writeable */  
    /* 
     * 检查用户空间传入的events指向的内存是否可写。参见__range_not_ok()。 
     */  
    if (!access_ok(VERIFY_WRITE, events, maxevents * sizeof(struct epoll_event))) {  
        error = -EFAULT;  
        goto error_return;  
    }  

    /* Get the "struct file *" for the eventpoll file */  
    /* 
     * 获取epfd对应的eventpoll文件的file实例，file结构是在epoll_create中创建 
     */  
    error = -EBADF;  
    file = fget(epfd);  
    if (!file)  
        goto error_return;  

    /* 
     * We have to check that the file structure underneath the fd 
     * the user passed to us _is_ an eventpoll file. 
     */  
    /* 
     * 通过检查epfd对应的文件操作是不是eventpoll_fops 
     * 来判断epfd是否是一个eventpoll文件。如果不是 
     * 则返回EINVAL错误。 
     */  
    error = -EINVAL;  
    if (!is_file_epoll(file))  
        goto error_fput;  

    /* 
     * At this point it is safe to assume that the "private_data" contains 
     * our own data structure. 
     */  
    ep = file->private_data;  

    /* Time to fish for events ... */  
    error = ep_poll(ep, events, maxevents, timeout);  

error_fput:  
    fput(file);  
error_return:  

    return error;  
}
```

sys\_epoll\_wait（）是 epoll\_wait()对应的系统调用，主要用来获取文件状态已经就绪的事件，该函数检查参数、获取 eventpoll 文件后调用 ep\_poll（）来完成主要的工作。在分析 ep\_poll（）函数之前，先介绍一下使用 epoll\_wait（）时可能犯的错误（接下来介绍的就是我犯过的错误）：

**返回 EBADF 错误**

除非你故意指定一个不存在的文件描述符，否则几乎百分百肯定，你的程序有 BUG 了！从源码中可以看到调用 fget（）函数返回 NULL 时，会返回此错误。fget（）源码如下：

```
struct file *fget(unsigned int fd)  
{  
    struct file *file;  
    struct files_struct *files = current->files;  

    rcu_read_lock();  
    file = fcheck_files(files, fd);  
    if (file) {  
        if (!atomic_long_inc_not_zero(&file->f_count)) {  
            /* File object ref couldn't be taken */  
            rcu_read_unlock();  
            return NULL;  
        }  
    }  
    rcu_read_unlock();  

    return file;  
}
```

主要看这句(struct files\_struct \*files \= current-\>files;)，这条语句是获取描述当前进程已经打开的文件的 files\_struct 结构，然后从这个结构中查找传入的 fd 对应的 file 实例，如果没有找到，说明当前进程中打开的文件不包括这个 fd，所以几乎百分百肯定是程序设计的问题。我的程序出错，就是因为在父进程中创建了文件描述符，但是将子进程变为守护进程了，也就没有继承父进程中打开的文件。

**死循环（一般不会犯，但是我是第一次用，犯了）**

epoll\_wait（）中有一个设置超时时间的参数，所以我在循环中没有使用睡眠队列的操作，想依赖 epoll 的睡眠操作，所以在返回值小于等于 0 时，直接进行下一次循环，没有充分考虑 epoll\_wait（）的返回值小于 0 时的不同情况，所以代码写成了下面的样子：

```
for(;;) {  
    ......  
    events = epoll_wait(fcluster_epfd, fcluster_wait_events,   
            fcluster_wait_size, 3000);  
        if (unlikely(events <= 0)) {  
            continue;  
        }  
    .......  
}
```

当 epoll\_wait（）返回 EBADF 或 EFAULT 时，就会陷入死循环，因此此时还没有进入睡眠的操作。

 **(2)ep_poll（）函数**

```
static int ep_poll(struct eventpoll *ep, struct epoll_event __user *events,  
           int maxevents, long timeout)  
{  
    int res, eavail;  
    unsigned long flags;  
    long jtimeout;  
    wait_queue_t wait;  

    /* 
     * Calculate the timeout by checking for the "infinite" value (-1) 
     * and the overflow condition. The passed timeout is in milliseconds, 
     * that why (t * HZ) / 1000. 
     */  
    /* 
     * timeout是以毫秒为单位，这里是要转换为jiffies时间。 
     * 这里加上999(即1000-1)，是为了向上取整。 
     */  
    jtimeout = (timeout < 0 || timeout >= EP_MAX_MSTIMEO) ?  
        MAX_SCHEDULE_TIMEOUT : (timeout * HZ + 999) / 1000;  

retry:  
    spin_lock_irqsave(&ep->lock, flags);  

    res = 0;  
    if (list_empty(&ep->rdllist)) {  
        /* 
         * We don't have any available event to return to the caller. 
         * We need to sleep here, and we will be wake up by 
         * ep_poll_callback() when events will become available. 
         */  
        init_waitqueue_entry(&wait, current);  
        wait.flags |= WQ_FLAG_EXCLUSIVE;  
        /* 
         * 将当前进程加入到eventpoll的等待队列中， 
         * 等待文件状态就绪或直到超时，或被 
         * 信号中断。 
         */  
        __add_wait_queue(&ep->wq, &wait);  

        for (;;) {  
            /* 
             * We don't want to sleep if the ep_poll_callback() sends us 
             * a wakeup in between. That's why we set the task state 
             * to TASK_INTERRUPTIBLE before doing the checks. 
             */  
            set_current_state(TASK_INTERRUPTIBLE);  
            /* 
             * 如果就绪队列不为空，也就是说已经有文件的状态 
             * 就绪或者超时，则退出循环。 
             */  
            if (!list_empty(&ep->rdllist) || !jtimeout)  
                break;  
            /* 
             * 如果当前进程接收到信号，则退出 
             * 循环，返回EINTR错误 
             */  
            if (signal_pending(current)) {  
                res = -EINTR;  
                break;  
            }  

            spin_unlock_irqrestore(&ep->lock, flags);  
            /* 
             * 主动让出处理器，等待ep_poll_callback()将当前进程 
             * 唤醒或者超时,返回值是剩余的时间。从这里开始 
             * 当前进程会进入睡眠状态，直到某些文件的状态 
             * 就绪或者超时。当文件状态就绪时，eventpoll的回调 
             * 函数ep_poll_callback()会唤醒在ep->wq指向的等待队列中的进程。 
             */  
            jtimeout = schedule_timeout(jtimeout);  
            spin_lock_irqsave(&ep->lock, flags);  
        }  
        __remove_wait_queue(&ep->wq, &wait);  

        set_current_state(TASK_RUNNING);  
    }  
    /* Is it worth to try to dig for events ? */  
    /* 
     * ep->ovflist链表存储的向用户传递事件时暂存就绪的文件。 
     * 所以不管是就绪队列ep->rdllist不为空，或者ep->ovflist不等于 
     * EP_UNACTIVE_PTR，都有可能现在已经有文件的状态就绪。 
     * ep->ovflist不等于EP_UNACTIVE_PTR有两种情况，一种是NULL，此时 
     * 可能正在向用户传递事件，不一定就有文件状态就绪， 
     * 一种情况时不为NULL，此时可以肯定有文件状态就绪， 
     * 参见ep_send_events()。 
     */  
    eavail = !list_empty(&ep->rdllist) || ep->ovflist != EP_UNACTIVE_PTR;  

    spin_unlock_irqrestore(&ep->lock, flags);  

    /* 
     * Try to transfer events to user space. In case we get 0 events and 
     * there's still timeout left over, we go trying again in search of 
     * more luck. 
     */  
    /* 
     * 如果没有被信号中断，并且有事件就绪， 
     * 但是没有获取到事件(有可能被其他进程获取到了)， 
     * 并且没有超时，则跳转到retry标签处，重新等待 
     * 文件状态就绪。 
     */  
    if (!res && eavail &&  
        !(res = ep_send_events(ep, events, maxevents)) && jtimeout)  
        goto retry;  

    /* 
     * 返回获取到的事件的个数或者错误码 
     */  
    return res;  
}
```

ep\_poll（）的主要过程是：首先将超时时间（以毫秒为单位）转换为 jiffies 时间，然后检查是否有事件发生，如果没有事件发生，则将当前进程加入到 eventpoll 中的等待队列中，直到事件发生或者超时。如果有事件发生，则调用 ep\_send\_events（）将发生的事件传入用户空间的内存。ep\_send\_events（）函数将用户传入的内存简单封装到 ep\_send\_events\_data 结构中，然后调用 ep\_scan\_ready\_list（）将就绪队列中的事件传入用户空间的内存。

 **(3)ep_scan_ready_list（）函数**

```
/** 
 * ep_scan_ready_list - Scans the ready list in a way that makes possible for 
 *                      the scan code, to call f_op->poll(). Also allows for 
 *                      O(NumReady) performance. 
 * 
 * @ep: Pointer to the epoll private data structure. 
 * @sproc: Pointer to the scan callback. 
 * @priv: Private opaque data passed to the @sproc callback. 
 * 
 * Returns: The same integer error code returned by the @sproc callback. 
 */  
static int ep_scan_ready_list(struct eventpoll *ep,  
                  int (*sproc)(struct eventpoll *,  
                       struct list_head *, void *),  
                  void *priv)  
{  
    int error, pwake = 0;  
    unsigned long flags;  
    struct epitem *epi, *nepi;  
    LIST_HEAD(txlist);  

    /* 
     * We need to lock this because we could be hit by 
     * eventpoll_release_file() and epoll_ctl(). 
     */  
    /* 
     * 获取互斥锁，该互斥锁在移除eventpoll文件(eventpoll_release_file() )、 
     * 操作文件描述符(epoll_ctl())和向用户传递事件(epoll_wait())之间进行互斥 
     */  
    mutex_lock(&ep->mtx);  

    /* 
     * Steal the ready list, and re-init the original one to the 
     * empty list. Also, set ep->ovflist to NULL so that events 
     * happening while looping w/out locks, are not lost. We cannot 
     * have the poll callback to queue directly on ep->rdllist, 
     * because we want the "sproc" callback to be able to do it 
     * in a lockless way. 
     */  
    spin_lock_irqsave(&ep->lock, flags);  
    /* 
     * 将就绪队列中就绪的文件链表暂存在临时 
     * 表头txlist中，并且初始化就绪队列。 
     */  
    list_splice_init(&ep->rdllist, &txlist);  
    /* 
     * 将ovflist置为NULL，表示此时正在向用户空间传递 
     * 事件。如果此时有文件状态就绪，不会放在 
     * 就绪队列中，而是放在ovflist链表中。 
     */  
    ep->ovflist = NULL;  
    spin_unlock_irqrestore(&ep->lock, flags);  

    /* 
     * Now call the callback function. 
     */  
    /* 
     * 调用ep_send_events_proc()将就绪队列中的事件 
     * 存入用户传入的内存中。 
     */  
    error = (*sproc)(ep, &txlist, priv);  

    spin_lock_irqsave(&ep->lock, flags);  
    /* 
     * During the time we spent inside the "sproc" callback, some 
     * other events might have been queued by the poll callback. 
     * We re-insert them inside the main ready-list here. 
     */  
    /* 
     * 在调用sproc指向的函数将就绪队列中的事件 
     * 传递到用户传入的内存的过程中，可能有文件 
     * 状态就绪，这些事件会暂存在ovflist链表中， 
     * 所以这里要将ovflist中的事件移到就绪队列中。 
     */  
    for (nepi = ep->ovflist; (epi = nepi) != NULL;  
         nepi = epi->next, epi->next = EP_UNACTIVE_PTR) {  
        /* 
         * We need to check if the item is already in the list. 
         * During the "sproc" callback execution time, items are 
         * queued into ->ovflist but the "txlist" might already 
         * contain them, and the list_splice() below takes care of them. 
         */  
        if (!ep_is_linked(&epi->rdllink))  
            list_add_tail(&epi->rdllink, &ep->rdllist);  
    }  
    /* 
     * We need to set back ep->ovflist to EP_UNACTIVE_PTR, so that after 
     * releasing the lock, events will be queued in the normal way inside 
     * ep->rdllist. 
     */  
    /* 
     * 重新初始化ovflist，表示传递事件已经完成， 
     * 之后再有文件状态就绪，这些事件会直接 
     * 放在就绪队列中。 
     */  
    ep->ovflist = EP_UNACTIVE_PTR;  

    /* 
     * Quickly re-inject items left on "txlist". 
     */  
    /* 
     * 如果sproc指向的函数ep_send_events_proc()中处理出错或者某些文件的 
     * 触发方式设置为水平触发(Level Trigger)，txlist中可能还有事件，需要 
     * 将这些就绪的事件重新添加回eventpoll文件的就绪队列中。 
     */  
    list_splice(&txlist, &ep->rdllist);  

    if (!list_empty(&ep->rdllist)) {  
        /* 
         * Wake up (if active) both the eventpoll wait list and 
         * the ->poll() wait list (delayed after we release the lock). 
         */  
        if (waitqueue_active(&ep->wq))  
            wake_up_locked(&ep->wq);  
        if (waitqueue_active(&ep->poll_wait))  
            pwake++;  
    }  
    spin_unlock_irqrestore(&ep->lock, flags);  

    mutex_unlock(&ep->mtx);  

    /* We have to call this outside the lock */  
    if (pwake)  
        ep_poll_safewake(&ep->poll_wait);  

    return error;  
}
```

ep\_scan\_ready\_list（）函数的参数 sproc 指向的函数是 ep\_send\_events\_proc（），参见 ep\_send\_events（）函数。

 **(4)ep_send_events_proc（）函数**

```
/* 
 * @head:已经就绪的文件列表 
 * @priv:用来存储已经就绪的文件 
 */  
static int ep_send_events_proc(struct eventpoll *ep, struct list_head *head,  
                   void *priv)  
{  
    struct ep_send_events_data *esed = priv;  
    int eventcnt;  
    unsigned int revents;  
    struct epitem *epi;  
    struct epoll_event __user *uevent;  

    /* 
     * We can loop without lock because we are passed a task private list. 
     * Items cannot vanish during the loop because ep_scan_ready_list() is 
     * holding "mtx" during this call. 
     */  
    for (eventcnt = 0, uevent = esed->events;  
         !list_empty(head) && eventcnt < esed->maxevents;) {  
        epi = list_first_entry(head, struct epitem, rdllink);  

        list_del_init(&epi->rdllink);  

        /* 
         * 调用文件的poll函数有两个作用，一是在文件的唤醒 
         * 队列上注册回调函数，二是返回文件当前的事件状 
         * 态，如果第二个参数为NULL，则只是查看文件当前 
         * 状态。 
         */  
        revents = epi->ffd.file->f_op->poll(epi->ffd.file, NULL) &  
            epi->event.events;  

        /* 
         * If the event mask intersect the caller-requested one, 
         * deliver the event to userspace. Again, ep_scan_ready_list() 
         * is holding "mtx", so no operations coming from userspace 
         * can change the item. 
         */  
        if (revents) {  
            /* 
             * 向用户内存传值失败时，将当前epitem实例重新放回 
             * 到链表中，从这里也可以看出，在处理失败后，head指向的 
             * 链表(对应ep_scan_ready_list()中的临时变量txlist)中 
             * 有可能会没有完全处理完，因此在ep_scan_ready_list()中 
             * 需要下面的语句 
             *    list_splice(&txlist, &ep->rdllist); 
             * 来将未处理的事件重新放回到eventpoll文件的就绪队列中。 
             */  
            if (__put_user(revents, &uevent->events) ||  
                __put_user(epi->event.data, &uevent->data)) {  
                list_add(&epi->rdllink, head);  
                /* 
                 * 如果此时已经获取了部分事件，则返回已经获取的事件个数， 
                 * 否则返回EFAULT错误。 
                 */  
                return eventcnt ? eventcnt : -EFAULT;  
            }  
            eventcnt++;  
            uevent++;  
            if (epi->event.events & EPOLLONESHOT)  
                epi->event.events &= EP_PRIVATE_BITS;  
            /* 
             * 如果是触发方式不是边缘触发(Edge Trigger)，而是水平 
             * 触发(Level Trigger)，需要将当前的epitem实例添加回 
             * 链表中，下次读取事件时会再次上报。 
             */  
            else if (!(epi->event.events & EPOLLET)) {  
                /* 
                 * If this file has been added with Level 
                 * Trigger mode, we need to insert back inside 
                 * the ready list, so that the next call to 
                 * epoll_wait() will check again the events 
                 * availability. At this point, noone can insert 
                 * into ep->rdllist besides us. The epoll_ctl() 
                 * callers are locked out by 
                 * ep_scan_ready_list() holding "mtx" and the 
                 * poll callback will queue them in ep->ovflist. 
                 */  
                list_add_tail(&epi->rdllink, &ep->rdllist);  
            }  
        }  
    }  

    return eventcnt;  
}
```

### 如何加锁

**3 个 api 做什么事情：**

```
epoll_create() ===》创建红黑树的根节点
epoll_ctl() ===》add,del,mod 增加、删除、修改结点
epoll_wait() ===》把就绪队列的结点copy到用户态放到events里面，跟recv函数很像
```

**分析加锁**

* 如果有 3 个线程同时操作 epoll，有哪些地方需要加锁？我们用户层面一共就只有 3 个 api 可以使用
* 如果同时调用 epoll\_create() ，那就是创建三颗红黑树，没有涉及到资源竞争，没有关系。
* 如果同时调用 epoll\_ctl() ，对同一颗红黑树进行，增删改，这就涉及到资源竞争需要加锁了，此时我们对整棵树进行加锁。
* 如果同时调用 epoll\_wait() ，其操作的是就绪队列，所以需要对就绪队列进行加锁。

我们要扣住 epoll 的工作环境，在应用程序调用 epoll\_ctl() ，协议栈会不会有回调操作红黑树结点？调用 epoll\_wait() copy 出来的时候，协议栈会不会操作操作红黑树结点加入就绪队列？综上所述：

```
epoll_ctl() 对红黑树加锁epoll_wait()对就绪队列加锁回调函数()   对红黑树加锁,对就绪队列加锁
```

**那么红黑树加什么锁，就绪队列加什么锁呢？**

对于红黑树这种节点比较多的时候，采用互斥锁来加锁。就绪队列就跟生产者消费者一样，结点是从协议栈回调函数来生产的，消费是 epoll\_wait()来消费。那么对于队列而言，用自旋锁（对于队列而言，插入删除比较简单，cpu 自旋等待比让出的成本更低，所以用自旋锁）。

## 七、ET 与 LT 的实现

* ET 边沿触发，只触发一次
* LT 水平触发，如果没有读完就一直触发

**代码如何实现 ET 和 LT 的效果呢？**

水平触发和边沿触发不是故意设计出来的，这是自然而然，水到渠成的功能。水平触发和边沿触发代码只需要改一点点就能实现。从协议栈检测到接收数据，就调用一次回调，这就是 ET，接收到数据，调用一次回调。而 LT 水平触发，检测到 recvbuf 里面有数据就调用回调。所以 ET 和 LT 就是在使用回调的次数上面的差异。

**那么具体如何实现呢？**

协议栈流程里面触发回调，是天然的符合 ET 只触发一次的。那么如果是 LT，在 recv 之后，如果缓冲区还有数据那么加入到就绪队列。那么如果是 LT，在 send 之后，如果缓冲区还有空间那么加入到就绪队列。那么这样就能实现 LT 了。

## 八、epoll 内核源码详解

网上很多博客说 epoll 使用了共享内存,这个是完全错误的 ,可以阅读源码,会发现完全没有使用共享内存的任何 api，而是 使用了 copy\_from\_user 跟\_\_put\_user 进行内核跟用户虚拟空间数据交互。

```
/*
 *  fs/eventpoll.c (Efficient event retrieval implementation)
 *  Copyright (C) 2001,...,2009	 Davide Libenzi
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  Davide Libenzi <davidel@xmailserver.org>
 *
 */
/*
 * 在深入了解epoll的实现之前, 先来了解内核的3个方面.
 * 1. 等待队列 waitqueue
 * 我们简单解释一下等待队列:
 * 队列头(wait_queue_head_t)往往是资源生产者,
 * 队列成员(wait_queue_t)往往是资源消费者,
 * 当头的资源ready后, 会逐个执行每个成员指定的回调函数,
 * 来通知它们资源已经ready了, 等待队列大致就这个意思.
 * 2. 内核的poll机制
 * 被Poll的fd, 必须在实现上支持内核的Poll技术,
 * 比如fd是某个字符设备,或者是个socket, 它必须实现
 * file_operations中的poll操作, 给自己分配有一个等待队列头.
 * 主动poll fd的某个进程必须分配一个等待队列成员, 添加到
 * fd的对待队列里面去, 并指定资源ready时的回调函数.
 * 用socket做例子, 它必须有实现一个poll操作, 这个Poll是
 * 发起轮询的代码必须主动调用的, 该函数中必须调用poll_wait(),
 * poll_wait会将发起者作为等待队列成员加入到socket的等待队列中去.
 * 这样socket发生状态变化时可以通过队列头逐个通知所有关心它的进程.
 * 这一点必须很清楚的理解, 否则会想不明白epoll是如何
 * 得知fd的状态发生变化的.
 * 3. epollfd本身也是个fd, 所以它本身也可以被epoll,
 * 可以猜测一下它是不是可以无限嵌套epoll下去... 
 *
 * epoll基本上就是使用了上面的1,2点来完成.
 * 可见epoll本身并没有给内核引入什么特别复杂或者高深的技术,
 * 只不过是已有功能的重新组合, 达到了超过select的效果.
 */
/* 
 * 相关的其它内核知识:
 * 1. fd我们知道是文件描述符, 在内核态, 与之对应的是struct file结构,
 * 可以看作是内核态的文件描述符.
 * 2. spinlock, 自旋锁, 必须要非常小心使用的锁,
 * 尤其是调用spin_lock_irqsave()的时候, 中断关闭, 不会发生进程调度,
 * 被保护的资源其它CPU也无法访问. 这个锁是很强力的, 所以只能锁一些
 * 非常轻量级的操作.
 * 3. 引用计数在内核中是非常重要的概念,
 * 内核代码里面经常有些release, free释放资源的函数几乎不加任何锁,
 * 这是因为这些函数往往是在对象的引用计数变成0时被调用,
 * 既然没有进程在使用在这些对象, 自然也不需要加锁.
 * struct file 是持有引用计数的.
 */
/* --- epoll相关的数据结构 --- */
/*
 * This structure is stored inside the "private_data" member of the file
 * structure and rapresent the main data sructure for the eventpoll
 * interface.
 */
/* 每创建一个epollfd, 内核就会分配一个eventpoll与之对应, 可以说是
 * 内核态的epollfd. */
struct eventpoll {
	/* Protect the this structure access */
	spinlock_t lock;
	/*
	 * This mutex is used to ensure that files are not removed
	 * while epoll is using them. This is held during the event
	 * collection loop, the file cleanup path, the epoll file exit
	 * code and the ctl operations.
	 */
	/* 添加, 修改或者删除监听fd的时候, 以及epoll_wait返回, 向用户空间
	 * 传递数据时都会持有这个互斥锁, 所以在用户空间可以放心的在多个线程
	 * 中同时执行epoll相关的操作, 内核级已经做了保护. */
	struct mutex mtx;
	/* Wait queue used by sys_epoll_wait() */
	/* 调用epoll_wait()时, 我们就是"睡"在了这个等待队列上... */
	wait_queue_head_t wq;
	/* Wait queue used by file->poll() */
	/* 这个用于epollfd本事被poll的时候... */
	wait_queue_head_t poll_wait;
	/* List of ready file descriptors */
	/* 所有已经ready的epitem都在这个链表里面 */
	struct list_head rdllist;
	/* RB tree root used to store monitored fd structs */
	/* 所有要监听的epitem都在这里 */
	struct rb_root rbr;
	/*
		这是一个单链表链接着所有的struct epitem当event转移到用户空间时
	 */
	 * This is a single linked list that chains all the "struct epitem" that
	 * happened while transfering ready events to userspace w/out
	 * holding ->lock.
	 */
	struct epitem *ovflist;
	/* The user that created the eventpoll descriptor */
	/* 这里保存了一些用户变量, 比如fd监听数量的最大值等等 */
	struct user_struct *user;
};
/*
 * Each file descriptor added to the eventpoll interface will
 * have an entry of this type linked to the "rbr" RB tree.
 */
/* epitem 表示一个被监听的fd */
struct epitem {
	/* RB tree node used to link this structure to the eventpoll RB tree */
	/* rb_node, 当使用epoll_ctl()将一批fds加入到某个epollfd时, 内核会分配
	 * 一批的epitem与fds们对应, 而且它们以rb_tree的形式组织起来, tree的root
	 * 保存在epollfd, 也就是struct eventpoll中. 
	 * 在这里使用rb_tree的原因我认为是提高查找,插入以及删除的速度.
	 * rb_tree对以上3个操作都具有O(lgN)的时间复杂度 */
	struct rb_node rbn;
	/* List header used to link this structure to the eventpoll ready list */
	/* 链表节点, 所有已经ready的epitem都会被链到eventpoll的rdllist中 */
	struct list_head rdllink;
	/*
	 * Works together "struct eventpoll"->ovflist in keeping the
	 * single linked chain of items.
	 */
	/* 这个在代码中再解释... */
	struct epitem *next;
	/* The file descriptor information this item refers to */
	/* epitem对应的fd和struct file */
	struct epoll_filefd ffd;
	/* Number of active wait queue attached to poll operations */
	int nwait;
	/* List containing poll wait queues */
	struct list_head pwqlist;
	/* The "container" of this item */
	/* 当前epitem属于哪个eventpoll */
	struct eventpoll *ep;
	/* List header used to link this item to the "struct file" items list */
	struct list_head fllink;
	/* The structure that describe the interested events and the source fd */
	/* 当前的epitem关系哪些events, 这个数据是调用epoll_ctl时从用户态传递过来 */
	struct epoll_event event;
};
struct epoll_filefd {
	struct file *file;
	int fd;
};
/* poll所用到的钩子Wait structure used by the poll hooks */
struct eppoll_entry {
	/* List header used to link this structure to the "struct epitem" */
	struct list_head llink;
	/* The "base" pointer is set to the container "struct epitem" */
	struct epitem *base;
	/*
	 * Wait queue item that will be linked to the target file wait
	 * queue head.
	 */
	wait_queue_t wait;
	/* The wait queue head that linked the "wait" wait queue item */
	wait_queue_head_t *whead;
};
/* Wrapper struct used by poll queueing */
struct ep_pqueue {
	poll_table pt;
	struct epitem *epi;
};
/* Used by the ep_send_events() function as callback private data */
struct ep_send_events_data {
	int maxevents;
	struct epoll_event __user *events;
};

/* --- 代码注释 --- */
/* 你没看错, 这就是epoll_create()的真身, 基本啥也不干直接调用epoll_create1了,
 * 另外你也可以发现, size这个参数其实是没有任何用处的... */
SYSCALL_DEFINE1(epoll_create, int, size)
{
        if (size <= 0)
                return -EINVAL;
        return sys_epoll_create1(0);
}
/* 这才是真正的epoll_create啊~~ */
SYSCALL_DEFINE1(epoll_create1, int, flags)
{
	int error;
	struct eventpoll *ep = NULL;//主描述符
	/* Check the EPOLL_* constant for consistency.  */
	/* 这句没啥用处... */
	BUILD_BUG_ON(EPOLL_CLOEXEC != O_CLOEXEC);
	/* 对于epoll来讲, 目前唯一有效的FLAG就是CLOEXEC */
	if (flags & ~EPOLL_CLOEXEC)
		return -EINVAL;
	/*
	 * Create the internal data structure ("struct eventpoll").
	 */
	/* 分配一个struct eventpoll, 分配和初始化细节我们随后深聊~ */
	error = ep_alloc(&ep);
	if (error < 0)
		return error;
	/*
	 * Creates all the items needed to setup an eventpoll file. That is,
	 * a file structure and a free file descriptor.
	 */
	/* 这里是创建一个匿名fd, 说起来就话长了...长话短说:
	 * epollfd本身并不存在一个真正的文件与之对应, 所以内核需要创建一个
	 * "虚拟"的文件, 并为之分配真正的struct file结构, 而且有真正的fd.
	 * 这里2个参数比较关键:
	 * eventpoll_fops, fops就是file operations, 就是当你对这个文件(这里是虚拟的)进行操作(比如读)时,
	 * fops里面的函数指针指向真正的操作实现, 类似C++里面虚函数和子类的概念.
	 * epoll只实现了poll和release(就是close)操作, 其它文件系统操作都有VFS全权处理了.
	 * ep, ep就是struct epollevent, 它会作为一个私有数据保存在struct file的private指针里面.
	 * 其实说白了, 就是为了能通过fd找到struct file, 通过struct file能找到eventpoll结构.
	 * 如果懂一点Linux下字符设备驱动开发, 这里应该是很好理解的,
	 * 推荐阅读 <Linux device driver 3rd>
	 */
	error = anon_inode_getfd("[eventpoll]", &eventpoll_fops, ep,
				 O_RDWR | (flags & O_CLOEXEC));
	if (error < 0)
		ep_free(ep);
	return error;
}
/* 
* 创建好epollfd后, 接下来我们要往里面添加fd咯
* 来看epoll_ctl
* epfd 就是epollfd
* op ADD,MOD,DEL
* fd 需要监听的描述符
* event 我们关心的events
*/
SYSCALL_DEFINE4(epoll_ctl, int, epfd, int, op, int, fd,
		struct epoll_event __user *, event)
{
	int error;
	struct file *file, *tfile;
	struct eventpoll *ep;
	struct epitem *epi;
	struct epoll_event epds;
	error = -EFAULT;
	/* 
	 * 错误处理以及从用户空间将epoll_event结构copy到内核空间.
	 */
	if (ep_op_has_event(op) &&
	    copy_from_user(&epds, event, sizeof(struct epoll_event)))
		goto error_return;
	/* Get the "struct file *" for the eventpoll file */
	/* 取得struct file结构, epfd既然是真正的fd, 那么内核空间
	 * 就会有与之对于的一个struct file结构
	 * 这个结构在epoll_create1()中, 由函数anon_inode_getfd()分配 */
	error = -EBADF;
	file = fget(epfd);
	if (!file)
		goto error_return;
	/* Get the "struct file *" for the target file */
	/* 我们需要监听的fd, 它当然也有个struct file结构, 上下2个不要搞混了哦 */
	tfile = fget(fd);
	if (!tfile)
		goto error_fput;
	/* The target file descriptor must support poll */
	error = -EPERM;
	/* 如果监听的文件不支持poll, 那就没辙了.
	 * 你知道什么情况下, 文件会不支持poll吗?
	 */
	if (!tfile->f_op || !tfile->f_op->poll)
		goto error_tgt_fput;
	/*
	 * We have to check that the file structure underneath the file descriptor
	 * the user passed to us _is_ an eventpoll file. And also we do not permit
	 * adding an epoll file descriptor inside itself.
	 */
	error = -EINVAL;
	/* epoll不能自己监听自己... */
	if (file == tfile || !is_file_epoll(file))
		goto error_tgt_fput;
	/*
	 * At this point it is safe to assume that the "private_data" contains
	 * our own data structure.
	 */
	/* 取到我们的eventpoll结构, 来自与epoll_create1()中的分配 */
	ep = file->private_data;
	/* 接下来的操作有可能修改数据结构内容, 锁之~ */
	mutex_lock(&ep->mtx);
	/*
	 * Try to lookup the file inside our RB tree, Since we grabbed "mtx"
	 * above, we can be sure to be able to use the item looked up by
	 * ep_find() till we release the mutex.
	 */
	/* 对于每一个监听的fd, 内核都有分配一个epitem结构,
	 * 而且我们也知道, epoll是不允许重复添加fd的,
	 * 所以我们首先查找该fd是不是已经存在了.
	 * ep_find()其实就是RBTREE查找, 跟C++STL的map差不多一回事, O(lgn)的时间复杂度.
	 */
	epi = ep_find(ep, tfile, fd);
	error = -EINVAL;
	switch (op) {
		/* 首先我们关心添加 */
	case EPOLL_CTL_ADD:
		if (!epi) {
			/* 之前的find没有找到有效的epitem, 证明是第一次插入, 接受!
			 * 这里我们可以知道, POLLERR和POLLHUP事件内核总是会关心的
			 * */
			epds.events |= POLLERR | POLLHUP;
			/* rbtree插入, 详情见ep_insert()的分析
			 * 其实我觉得这里有insert的话, 之前的find应该
			 * 是可以省掉的... */
			error = ep_insert(ep, &epds, tfile, fd);
		} else
			/* 找到了!? 重复添加! */
			error = -EEXIST;
		break;
		/* 删除和修改操作都比较简单 */
	case EPOLL_CTL_DEL:
		if (epi)
			error = ep_remove(ep, epi);
		else
			error = -ENOENT;
		break;
	case EPOLL_CTL_MOD:
		if (epi) {
			epds.events |= POLLERR | POLLHUP;
			error = ep_modify(ep, epi, &epds);
		} else
			error = -ENOENT;
		break;
	}
	mutex_unlock(&ep->mtx);
error_tgt_fput:
	fput(tfile);
error_fput:
	fput(file);
error_return:
	return error;
}
/* 分配一个eventpoll结构 */
static int ep_alloc(struct eventpoll **pep)
{
	int error;
	struct user_struct *user;
	struct eventpoll *ep;
	/* 获取当前用户的一些信息, 比如是不是root啦, 最大监听fd数目啦 */
	user = get_current_user();
	error = -ENOMEM;
	ep = kzalloc(sizeof(*ep), GFP_KERNEL);
	if (unlikely(!ep))
		goto free_uid;
	/* 这些都是初始化啦 */
	spin_lock_init(&ep->lock);
	mutex_init(&ep->mtx);
	init_waitqueue_head(&ep->wq);//初始化自己睡在的等待队列
	init_waitqueue_head(&ep->poll_wait);//初始化
	INIT_LIST_HEAD(&ep->rdllist);//初始化就绪链表
	ep->rbr = RB_ROOT;
	ep->ovflist = EP_UNACTIVE_PTR;
	ep->user = user;
	*pep = ep;
	return 0;
free_uid:
	free_uid(user);
	return error;
}
/*
 * Must be called with "mtx" held.
 */
/* 
 * ep_insert()在epoll_ctl()中被调用, 完成往epollfd里面添加一个监听fd的工作
 * tfile是fd在内核态的struct file结构
 */
static int ep_insert(struct eventpoll *ep, struct epoll_event *event,
		     struct file *tfile, int fd)
{
	int error, revents, pwake = 0;
	unsigned long flags;
	struct epitem *epi;
	struct ep_pqueue epq;
	/* 查看是否达到当前用户的最大监听数 */
	if (unlikely(atomic_read(&ep->user->epoll_watches) >=
		     max_user_watches))
		return -ENOSPC;
	/* 从著名的slab中分配一个epitem */
	if (!(epi = kmem_***_alloc(epi_***, GFP_KERNEL)))
		return -ENOMEM;
	/* Item initialization follow here ... */
	/* 这些都是相关成员的初始化... */
	INIT_LIST_HEAD(&epi->rdllink);
	INIT_LIST_HEAD(&epi->fllink);
	INIT_LIST_HEAD(&epi->pwqlist);
	epi->ep = ep;
	/* 这里保存了我们需要监听的文件fd和它的file结构 */
	ep_set_ffd(&epi->ffd, tfile, fd);
	epi->event = *event;
	epi->nwait = 0;
	/* 这个指针的初值不是NULL哦... */
	epi->next = EP_UNACTIVE_PTR;
	/* Initialize the poll table using the queue callback */
	/* 好, 我们终于要进入到poll的正题了 */
	epq.epi = epi;
	/* 初始化一个poll_table
	 * 其实就是指定调用poll_wait(注意不是epoll_wait!!!)时的回调函数,和我们关心哪些events,
	 * ep_ptable_queue_proc()就是我们的回调啦, 初值是所有event都关心 */
	init_poll_funcptr(&epq.pt, ep_ptable_queue_proc);
	/*
	 * Attach the item to the poll hooks and get current event bits.
	 * We can safely use the file* here because its usage count has
	 * been increased by the caller of this function. Note that after
	 * this operation completes, the poll callback can start hitting
	 * the new item.
	 */
	/* 这一部很关键, 也比较难懂, 完全是内核的poll机制导致的...
	 * 首先, f_op->poll()一般来说只是个wrapper, 它会调用真正的poll实现,
	 * 拿UDP的socket来举例, 这里就是这样的调用流程: f_op->poll(), sock_poll(),
	 * udp_poll(), datagram_poll(), sock_poll_wait(), 最后调用到我们上面指定的
	 * ep_ptable_queue_proc()这个回调函数...(好深的调用路径...).
	 * 完成这一步, 我们的epitem就跟这个socket关联起来了, 当它有状态变化时,
	 * 会通过ep_poll_callback()来通知.
	 * 最后, 这个函数还会查询当前的fd是不是已经有啥event已经ready了, 有的话
	 * 会将event返回. */
	revents = tfile->f_op->poll(tfile, &epq.pt);
	/*
	 * We have to check if something went wrong during the poll wait queue
	 * install process. Namely an allocation for a wait queue failed due
	 * high memory pressure.
	 */
	error = -ENOMEM;
	if (epi->nwait < 0)
		goto error_unregister;
	/* Add the current item to the list of active epoll hook for this file */
	/* 这个就是每个文件会将所有监听自己的epitem链起来 */
	spin_lock(&tfile->f_lock);
	list_add_tail(&epi->fllink, &tfile->f_ep_links);
	spin_unlock(&tfile->f_lock);
	/*
	 * Add the current item to the RB tree. All RB tree operations are
	 * protected by "mtx", and ep_insert() is called with "mtx" held.
	 */
	/* 都搞定后, 将epitem插入到对应的eventpoll中去 */
	ep_rbtree_insert(ep, epi);
	/* We have to drop the new item inside our item list to keep track of it */
	spin_lock_irqsave(&ep->lock, flags);
	/* If the file is already "ready" we drop it inside the ready list */
	/* 到达这里后, 如果我们监听的fd已经有事件发生, 那就要处理一下 */
	if ((revents & event->events) && !ep_is_linked(&epi->rdllink)) {
		/* 将当前的epitem加入到ready list中去 */
		list_add_tail(&epi->rdllink, &ep->rdllist);
		/* Notify waiting tasks that events are available */
		/* 谁在epoll_wait, 就唤醒它... */
		if (waitqueue_active(&ep->wq))
			wake_up_locked(&ep->wq);
		/* 谁在epoll当前的epollfd, 也唤醒它... */
		if (waitqueue_active(&ep->poll_wait))
			pwake++;
	}
	spin_unlock_irqrestore(&ep->lock, flags);
	atomic_inc(&ep->user->epoll_watches);
	/* We have to call this outside the lock */
	if (pwake)
		ep_poll_safewake(&ep->poll_wait);
	return 0;
error_unregister:
	ep_unregister_pollwait(ep, epi);
	/*
	 * We need to do this because an event could have been arrived on some
	 * allocated wait queue. Note that we don't care about the ep->ovflist
	 * list, since that is used/cleaned only inside a section bound by "mtx".
	 * And ep_insert() is called with "mtx" held.
	 */
	spin_lock_irqsave(&ep->lock, flags);
	if (ep_is_linked(&epi->rdllink))
		list_del_init(&epi->rdllink);
	spin_unlock_irqrestore(&ep->lock, flags);
	kmem_***_free(epi_***, epi);
	return error;
}
/*
 * This is the callback that is used to add our wait queue to the
 * target file wakeup lists.
 */
/* 
 * 该函数在调用f_op->poll()时会被调用.
 * 也就是epoll主动poll某个fd时, 用来将epitem与指定的fd关联起来的.
 * 关联的办法就是使用等待队列(waitqueue)
 */
static void ep_ptable_queue_proc(struct file *file, wait_queue_head_t *whead,
				 poll_table *pt)
{
	struct epitem *epi = ep_item_from_epqueue(pt);
	struct eppoll_entry *pwq;
	if (epi->nwait >= 0 && (pwq = kmem_***_alloc(pwq_***, GFP_KERNEL))) {
		/* 初始化等待队列, 指定ep_poll_callback为唤醒时的回调函数,
		 * 当我们监听的fd发生状态改变时, 也就是队列头被唤醒时,
		 * 指定的回调函数将会被调用. */
		init_waitqueue_func_entry(&pwq->wait, ep_poll_callback);
		pwq->whead = whead;
		pwq->base = epi;
		/* 将刚分配的等待队列成员加入到头中, 头是由fd持有的 */
		add_wait_queue(whead, &pwq->wait);
		list_add_tail(&pwq->llink, &epi->pwqlist);
		/* nwait记录了当前epitem加入到了多少个等待队列中,
		 * 我认为这个值最大也只会是1... */
		epi->nwait++;
	} else {
		/* We have to signal that an error occurred */
		epi->nwait = -1;
	}
}
/*
 * This is the callback that is passed to the wait queue wakeup
 * machanism. It is called by the stored file descriptors when they
 * have events to report.
 */
/* 
 * 这个是关键性的回调函数, 当我们监听的fd发生状态改变时, 它会被调用.
 * 参数key被当作一个unsigned long整数使用, 携带的是events.
 */
static int ep_poll_callback(wait_queue_t *wait, unsigned mode, int sync, void *key)
{
	int pwake = 0;
	unsigned long flags;
	struct epitem *epi = ep_item_from_wait(wait);//从等待队列获取epitem.需要知道哪个进程挂载到这个设备
	struct eventpoll *ep = epi->ep;//获取
	spin_lock_irqsave(&ep->lock, flags);
	/*
	 * If the event mask does not contain any poll(2) event, we consider the
	 * descriptor to be disabled. This condition is likely the effect of the
	 * EPOLLONESHOT bit that disables the descriptor when an event is received,
	 * until the next EPOLL_CTL_MOD will be issued.
	 */
	if (!(epi->event.events & ~EP_PRIVATE_BITS))
		goto out_unlock;
	/*
	 * Check the events coming with the callback. At this stage, not
	 * every device reports the events in the "key" parameter of the
	 * callback. We need to be able to handle both cases here, hence the
	 * test for "key" != NULL before the event match test.
	 */
	/* 没有我们关心的event... */
	if (key && !((unsigned long) key & epi->event.events))
		goto out_unlock;
	/*
	 * If we are trasfering events to userspace, we can hold no locks
	 * (because we're accessing user memory, and because of linux f_op->poll()
	 * semantics). All the events that happens during that period of time are
	 * chained in ep->ovflist and requeued later on.
	 */
	/* 
	 * 这里看起来可能有点费解, 其实干的事情比较简单:
	 * 如果该callback被调用的同时, epoll_wait()已经返回了,
	 * 也就是说, 此刻应用程序有可能已经在循环获取events,
	 * 这种情况下, 内核将此刻发生event的epitem用一个单独的链表
	 * 链起来, 不发给应用程序, 也不丢弃, 而是在下一次epoll_wait
	 * 时返回给用户.
	 */
	if (unlikely(ep->ovflist != EP_UNACTIVE_PTR)) {
		if (epi->next == EP_UNACTIVE_PTR) {
			epi->next = ep->ovflist;
			ep->ovflist = epi;
		}
		goto out_unlock;
	}
	/* If this file is already in the ready list we exit soon */
	/* 将当前的epitem放入ready list */
	if (!ep_is_linked(&epi->rdllink))
		list_add_tail(&epi->rdllink, &ep->rdllist);
	/*
	 * Wake up ( if active ) both the eventpoll wait list and the ->poll()
	 * wait list.
	 */
	/* 唤醒epoll_wait... */
	if (waitqueue_active(&ep->wq))
		wake_up_locked(&ep->wq);
	/* 如果epollfd也在被poll, 那就唤醒队列里面的所有成员. */
	if (waitqueue_active(&ep->poll_wait))
		pwake++;
out_unlock:
	spin_unlock_irqrestore(&ep->lock, flags);
	/* We have to call this outside the lock */
	if (pwake)
		ep_poll_safewake(&ep->poll_wait);
	return 1;
}
/*
 * Implement the event wait interface for the eventpoll file. It is the kernel
 * part of the user space epoll_wait(2).
 */
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events,
		int, maxevents, int, timeout)
{
	int error;
	struct file *file;
	struct eventpoll *ep;
	/* The maximum number of event must be greater than zero */
	if (maxevents <= 0 || maxevents > EP_MAX_EVENTS)
		return -EINVAL;
	/* Verify that the area passed by the user is writeable */
	/* 这个地方有必要说明一下:
	 * 内核对应用程序采取的策略是"绝对不信任",
	 * 所以内核跟应用程序之间的数据交互大都是copy, 不允许(也时候也是不能...)指针引用.
	 * epoll_wait()需要内核返回数据给用户空间, 内存由用户程序提供,
	 * 所以内核会用一些手段来验证这一段内存空间是不是有效的.
	 */
	if (!access_ok(VERIFY_WRITE, events, maxevents * sizeof(struct epoll_event))) {
		error = -EFAULT;
		goto error_return;
	}
	/* Get the "struct file *" for the eventpoll file */
	error = -EBADF;
	/* 获取epollfd的struct file, epollfd也是文件嘛 */
	file = fget(epfd);
	if (!file)
		goto error_return;
	/*
	 * We have to check that the file structure underneath the fd
	 * the user passed to us _is_ an eventpoll file.
	 */
	error = -EINVAL;
	/* 检查一下它是不是一个真正的epollfd... */
	if (!is_file_epoll(file))
		goto error_fput;
	/*
	 * At this point it is safe to assume that the "private_data" contains
	 * our own data structure.
	 */
	/* 获取eventpoll结构 */
	ep = file->private_data;
	/* Time to fish for events ... */
	/* OK, 睡觉, 等待事件到来~~ */
	error = ep_poll(ep, events, maxevents, timeout);
error_fput:
	fput(file);
error_return:
	return error;
}
/* 这个函数真正将执行epoll_wait的进程带入睡眠状态... */
static int ep_poll(struct eventpoll *ep, struct epoll_event __user *events,
		   int maxevents, long timeout)
{
	int res, eavail;
	unsigned long flags;
	long jtimeout;
	wait_queue_t wait;//等待队列
	/*
	 * Calculate the timeout by checking for the "infinite" value (-1)
	 * and the overflow condition. The passed timeout is in milliseconds,
	 * that why (t * HZ) / 1000.
	 */
	/* 计算睡觉时间, 毫秒要转换为HZ */
	jtimeout = (timeout < 0 || timeout >= EP_MAX_MSTIMEO) ?
		MAX_SCHEDULE_TIMEOUT : (timeout * HZ + 999) / 1000;
retry:
	spin_lock_irqsave(&ep->lock, flags);
	res = 0;
	/* 如果ready list不为空, 就不睡了, 直接干活... */
	if (list_empty(&ep->rdllist)) {
		/*
		 * We don't have any available event to return to the caller.
		 * We need to sleep here, and we will be wake up by
		 * ep_poll_callback() when events will become available.
		 */
		/* OK, 初始化一个等待队列, 准备直接把自己挂起,
		 * 注意current是一个宏, 代表当前进程 */
		init_waitqueue_entry(&wait, current);//初始化等待队列,wait表示当前进程
		__add_wait_queue_exclusive(&ep->wq, &wait);//挂载到ep结构的等待队列
		for (;;) {
			/*
			 * We don't want to sleep if the ep_poll_callback() sends us
			 * a wakeup in between. That's why we set the task state
			 * to TASK_INTERRUPTIBLE before doing the checks.
			 */
			/* 将当前进程设置位睡眠, 但是可以被信号唤醒的状态,
			 * 注意这个设置是"将来时", 我们此刻还没睡! */
			set_current_state(TASK_INTERRUPTIBLE);
			/* 如果这个时候, ready list里面有成员了,
			 * 或者睡眠时间已经过了, 就直接不睡了... */
			if (!list_empty(&ep->rdllist) || !jtimeout)
				break;
			/* 如果有信号产生, 也起床... */
			if (signal_pending(current)) {
				res = -EINTR;
				break;
			}
			/* 啥事都没有,解锁, 睡觉... */
			spin_unlock_irqrestore(&ep->lock, flags);
			/* jtimeout这个时间后, 会被唤醒,
			 * ep_poll_callback()如果此时被调用,
			 * 那么我们就会直接被唤醒, 不用等时间了... 
			 * 再次强调一下ep_poll_callback()的调用时机是由被监听的fd
			 * 的具体实现, 比如socket或者某个设备驱动来决定的,
			 * 因为等待队列头是他们持有的, epoll和当前进程
			 * 只是单纯的等待...
			 **/
			jtimeout = schedule_timeout(jtimeout);//睡觉
			spin_lock_irqsave(&ep->lock, flags);
		}
		__remove_wait_queue(&ep->wq, &wait);
		/* OK 我们醒来了... */
		set_current_state(TASK_RUNNING);
	}
	/* Is it worth to try to dig for events ? */
	eavail = !list_empty(&ep->rdllist) || ep->ovflist != EP_UNACTIVE_PTR;
	spin_unlock_irqrestore(&ep->lock, flags);
	/*
	 * Try to transfer events to user space. In case we get 0 events and
	 * there's still timeout left over, we go trying again in search of
	 * more luck.
	 */
	/* 如果一切正常, 有event发生, 就开始准备数据copy给用户空间了... */
	if (!res && eavail &&
	    !(res = ep_send_events(ep, events, maxevents)) && jtimeout)
		goto retry;
	return res;
}
/* 这个简单, 我们直奔下一个... */
static int ep_send_events(struct eventpoll *ep,
			  struct epoll_event __user *events, int maxevents)
{
	struct ep_send_events_data esed;
	esed.maxevents = maxevents;
	esed.events = events;
	return ep_scan_ready_list(ep, ep_send_events_proc, &esed);
}
/**
 * ep_scan_ready_list - Scans the ready list in a way that makes possible for
 *                      the scan code, to call f_op->poll(). Also allows for
 *                      O(NumReady) performance.
 *
 * @ep: Pointer to the epoll private data structure.
 * @sproc: Pointer to the scan callback.
 * @priv: Private opaque data passed to the @sproc callback.
 *
 * Returns: The same integer error code returned by the @sproc callback.
 */
static int ep_scan_ready_list(struct eventpoll *ep,
			      int (*sproc)(struct eventpoll *,
					   struct list_head *, void *),
			      void *priv)
{
	int error, pwake = 0;
	unsigned long flags;
	struct epitem *epi, *nepi;
	LIST_HEAD(txlist);
	/*
	 * We need to lock this because we could be hit by
	 * eventpoll_release_file() and epoll_ctl().
	 */
	mutex_lock(&ep->mtx);
	/*
	 * Steal the ready list, and re-init the original one to the
	 * empty list. Also, set ep->ovflist to NULL so that events
	 * happening while looping w/out locks, are not lost. We cannot
	 * have the poll callback to queue directly on ep->rdllist,
	 * because we want the "sproc" callback to be able to do it
	 * in a lockless way.
	 */
	spin_lock_irqsave(&ep->lock, flags);
	/* 这一步要注意, 首先, 所有监听到events的epitem都链到rdllist上了,
	 * 但是这一步之后, 所有的epitem都转移到了txlist上, 而rdllist被清空了,
	 * 要注意哦, rdllist已经被清空了! */
	list_splice_init(&ep->rdllist, &txlist);
	/* ovflist, 在ep_poll_callback()里面我解释过, 此时此刻我们不希望
	 * 有新的event加入到ready list中了, 保存后下次再处理... */
	ep->ovflist = NULL;
	spin_unlock_irqrestore(&ep->lock, flags);
	/*
	 * Now call the callback function.
	 */
	/* 在这个回调函数里面处理每个epitem
	 * sproc 就是 ep_send_events_proc, 下面会注释到. */
	error = (*sproc)(ep, &txlist, priv);
	spin_lock_irqsave(&ep->lock, flags);
	/*
	 * During the time we spent inside the "sproc" callback, some
	 * other events might have been queued by the poll callback.
	 * We re-insert them inside the main ready-list here.
	 */
	/* 现在我们来处理ovflist, 这些epitem都是我们在传递数据给用户空间时
	 * 监听到了事件. */
	for (nepi = ep->ovflist; (epi = nepi) != NULL;
	     nepi = epi->next, epi->next = EP_UNACTIVE_PTR) {
		/*
		 * We need to check if the item is already in the list.
		 * During the "sproc" callback execution time, items are
		 * queued into ->ovflist but the "txlist" might already
		 * contain them, and the list_splice() below takes care of them.
		 */
		/* 将这些直接放入readylist */
		if (!ep_is_linked(&epi->rdllink))
			list_add_tail(&epi->rdllink, &ep->rdllist);
	}
	/*
	 * We need to set back ep->ovflist to EP_UNACTIVE_PTR, so that after
	 * releasing the lock, events will be queued in the normal way inside
	 * ep->rdllist.
	 */
	ep->ovflist = EP_UNACTIVE_PTR;
	/*
	 * Quickly re-inject items left on "txlist".
	 */
	/* 上一次没有处理完的epitem, 重新插入到ready list */
	list_splice(&txlist, &ep->rdllist);
	/* ready list不为空, 直接唤醒... */
	if (!list_empty(&ep->rdllist)) {
		/*
		 * Wake up (if active) both the eventpoll wait list and
		 * the ->poll() wait list (delayed after we release the lock).
		 */
		if (waitqueue_active(&ep->wq))
			wake_up_locked(&ep->wq);
		if (waitqueue_active(&ep->poll_wait))
			pwake++;
	}
	spin_unlock_irqrestore(&ep->lock, flags);
	mutex_unlock(&ep->mtx);
	/* We have to call this outside the lock */
	if (pwake)
		ep_poll_safewake(&ep->poll_wait);
	return error;
}
/* 该函数作为callbakc在ep_scan_ready_list()中被调用
 * head是一个链表, 包含了已经ready的epitem,
 * 这个不是eventpoll里面的ready list, 而是上面函数中的txlist.
 */
static int ep_send_events_proc(struct eventpoll *ep, struct list_head *head,
			       void *priv)
{
	struct ep_send_events_data *esed = priv;
	int eventcnt;
	unsigned int revents;
	struct epitem *epi;
	struct epoll_event __user *uevent;
	/*
	 * We can loop without lock because we are passed a task private list.
	 * Items cannot vanish during the loop because ep_scan_ready_list() is
	 * holding "mtx" during this call.
	 */
	/* 扫描整个链表... */
	for (eventcnt = 0, uevent = esed->events;
	     !list_empty(head) && eventcnt < esed->maxevents;) {
		/* 取出第一个成员 */
		epi = list_first_entry(head, struct epitem, rdllink);
		/* 然后从链表里面移除 */
		list_del_init(&epi->rdllink);
		/* 读取events, 
		 * 注意events我们ep_poll_callback()里面已经取过一次了, 为啥还要再取?
		 * 1. 我们当然希望能拿到此刻的最新数据, events是会变的~
		 * 2. 不是所有的poll实现, 都通过等待队列传递了events, 有可能某些驱动压根没传
		 * 必须主动去读取. */
		revents = epi->ffd.file->f_op->poll(epi->ffd.file, NULL) &
			epi->event.events;
		if (revents) {
			/* 将当前的事件和用户传入的数据都copy给用户空间,
			 * 就是epoll_wait()后应用程序能读到的那一堆数据. */
			if (__put_user(revents, &uevent->events) ||
			    __put_user(epi->event.data, &uevent->data)) {
				list_add(&epi->rdllink, head);
				return eventcnt ? eventcnt : -EFAULT;
			}
			eventcnt++;
			uevent++;
			if (epi->event.events & EPOLLONESHOT)
				epi->event.events &= EP_PRIVATE_BITS;
			else if (!(epi->event.events & EPOLLET)) {
				/* 嘿嘿, EPOLLET和非ET的区别就在这一步之差呀~
				 * 如果是ET, epitem是不会再进入到readly list,
				 * 除非fd再次发生了状态改变, ep_poll_callback被调用.
				 * 如果是非ET, 不管你还有没有有效的事件或者数据,
				 * 都会被重新插入到ready list, 再下一次epoll_wait
				 * 时, 会立即返回, 并通知给用户空间. 当然如果这个
				 * 被监听的fds确实没事件也没数据了, epoll_wait会返回一个0,
				 * 空转一次.
				 */
				list_add_tail(&epi->rdllink, &ep->rdllist);
			}
		}
	}
	return eventcnt;
}
/* ep_free在epollfd被close时调用,
 * 释放一些资源而已, 比较简单 */
static void ep_free(struct eventpoll *ep)
{
	struct rb_node *rbp;
	struct epitem *epi;
	/* We need to release all tasks waiting for these file */
	if (waitqueue_active(&ep->poll_wait))
		ep_poll_safewake(&ep->poll_wait);
	/*
	 * We need to lock this because we could be hit by
	 * eventpoll_release_file() while we're freeing the "struct eventpoll".
	 * We do not need to hold "ep->mtx" here because the epoll file
	 * is on the way to be removed and no one has references to it
	 * anymore. The only hit might come from eventpoll_release_file() but
	 * holding "epmutex" is sufficent here.
	 */
	mutex_lock(&epmutex);
	/*
	 * Walks through the whole tree by unregistering poll callbacks.
	 */
	for (rbp = rb_first(&ep->rbr); rbp; rbp = rb_next(rbp)) {
		epi = rb_entry(rbp, struct epitem, rbn);
		ep_unregister_pollwait(ep, epi);
	}
	/*
	 * Walks through the whole tree by freeing each "struct epitem". At this
	 * point we are sure no poll callbacks will be lingering around, and also by
	 * holding "epmutex" we can be sure that no file cleanup code will hit
	 * us during this operation. So we can avoid the lock on "ep->lock".
	 */
	/* 之所以在关闭epollfd之前不需要调用epoll_ctl移除已经添加的fd,
	 * 是因为这里已经做了... */
	while ((rbp = rb_first(&ep->rbr)) != NULL) {
		epi = rb_entry(rbp, struct epitem, rbn);
		ep_remove(ep, epi);
	}
	mutex_unlock(&epmutex);
	mutex_destroy(&ep->mtx);
	free_uid(ep->user);
	kfree(ep);
}
/* File callbacks that implement the eventpoll file behaviour */
static const struct file_operations eventpoll_fops = {
	.release	= ep_eventpoll_release,
	.poll		= ep_eventpoll_poll
};
/* Fast test to see if the file is an evenpoll file */
static inline int is_file_epoll(struct file *f)
{
	return f->f_op == &eventpoll_fops;
}
/* OK, eventpoll我认为比较重要的函数都注释完了... */
```

 **(1)epoll_create**

从 slab 缓存中创建一个 eventpoll 对象,并且创建一个匿名的 fd 跟 fd 对应的 file 对象, 而 eventpoll 对象保存在 struct file 结构的 private 指针中,并且返回, 该 fd 对应的 file operations 只是实现了 poll 跟 release 操作。

创建 eventpoll 对象的初始化操作，获取当前用户信息,是不是 root,最大监听 fd 数目等并且保存到 eventpoll 对象中 初始化等待队列,初始化就绪链表,初始化红黑树的头结点。

 **(2)epoll_ctl 操作**

将 epoll\_event 结构拷贝到内核空间中，并且判断加入的 fd 是否支持 poll 结构(epoll,poll,selectI/O 多路复用必须支持 poll 操作)，并且从 epfd-\>file-\>privatedata 获取 event\_poll 对象,根据 op 区分是添加删除还是修改, 首先在 eventpoll 结构中的红黑树查找是否已经存在了相对应的 fd,没找到就支持插入操作,否则报重复的错误，相对应的修改,删除比较简单就不啰嗦了。

插入操作时,会创建一个与 fd 对应的 epitem 结构,并且初始化相关成员,比如保存监听的 fd 跟 file 结构之类的，重要的是指定了调用 poll\_wait 时的回调函数用于数据就绪时唤醒进程,(其内部,初始化设备的等待队列,将该进程注册到等待队列)完成这一步, 我们的 epitem 就跟这个 socket 关联起来了, 当它有状态变化时, 会通过 ep\_poll\_callback()来通知，最后调用加入的 fd 的 file operation-\>poll 函数(最后会调用 poll\_wait 操作)用于完成注册操作，最后将 epitem 结构添加到红黑树中。

 **(4)epoll_wait 操作**

计算睡眠时间(如果有),判断 eventpoll 对象的链表是否为空,不为空那就干活不睡眠，并且初始化一个等待队列,把自己挂上去,设置自己的进程状态，为可睡眠状态.判断是否有信号到来(有的话直接被中断醒来,),如果啥事都没有那就调用 schedule\_timeout 进行睡眠，如果超时或者被唤醒,首先从自己初始化的等待队列删除,然后开始拷贝资源给用户空间了，拷贝资源则是先把就绪事件链表转移到中间链表,然后挨个遍历拷贝到用户空间, 并且挨个判断其是否为水平触发,是的话再次插入到就绪链表。

## 九、Epoll 性能优势

### Epoll 与 Select/Poll 的对比分析

在网络编程领域，epoll 能脱颖而出，离不开和 select、poll 的对比。从数据拷贝的角度来看，select 和 poll 每次调用时，都需要把大量的文件描述符集合从用户态拷贝到内核态 。假设一个服务器需要监听 1000 个文件描述符，每次调用 select 或 poll，这 1000 个文件描述符都要在用户态和内核态之间来回拷贝，这无疑会消耗大量的时间和系统资源。而 epoll 则不同，它通过 epoll\_ctl 函数将文件描述符添加到内核的红黑树中时就完成了一次拷贝，后续 epoll\_wait 等待事件时，无需再次拷贝大量数据，因为就绪的 socket 是通过共享内存（内核态和用户态共享内存）的方式，直接从内核态的就绪链表中获取的，大大减少了数据拷贝的开销 。

再看时间复杂度。select 和 poll 的时间复杂度都是 O (n) ，这里的 n 是监听的文件描述符数量。这意味着，随着监听的文件描述符数量增加，它们的性能会急剧下降。比如，当监听的文件描述符达到 1 万个时，每次调用 select 或 poll，都需要线性遍历这 1 万个文件描述符，检查是否有事件发生，这会消耗大量的 CPU 时间。而 epoll 的时间复杂度是 O (1) ，它通过红黑树快速定位文件描述符，通过回调机制将就绪的 socket 加入双向链表，epoll\_wait 只需要遍历双向链表，就能获取到就绪的 socket，无论监听的文件描述符有多少，它的时间复杂度都不会改变，性能非常稳定 。

文件描述符数量限制也是一个关键区别。select 有文件描述符数量的限制，在 32 位系统中，默认的文件描述符数量上限通常是 1024，64 位系统中一般是 2048。虽然可以通过修改系统参数来调整这个限制，但这并不是一个理想的解决方案，而且这种修改可能会带来其他潜在问题。poll 虽然没有像 select 那样严格的固定数量限制，但它基于链表存储文件描述符，在处理大量文件描述符时，链表的遍历效率较低，性能也会受到影响。而 epoll 没有这样的限制，它可以轻松处理大量的文件描述符，理论上只受限于系统的内存资源。在一个拥有 1GB 内存的机器上，epoll 可以支持大约 10 万个左右的文件描述符，这使得它在高并发场景下具有极大的优势 。

### 高效性能的具体体现

在实际的高并发场景中，epoll 的高效性能得到了充分体现 。以大型电商网站为例，在促销活动期间，会有海量的用户同时访问网站，产生大量的并发连接。假设每秒有 10 万用户访问，每个用户与服务器建立一个 TCP 连接，这就意味着服务器需要同时处理 10 万个并发连接 。如果使用 select 或 poll，由于它们的性能瓶颈，在处理如此大量的连接时，服务器的 CPU 很快就会被耗尽，响应速度会变得极慢，甚至出现服务不可用的情况。而采用 epoll，服务器可以轻松应对这些并发连接 。epoll 通过其高效的事件通知机制，能够快速地将有数据可读或可写的连接通知给应用程序，应用程序可以及时处理这些连接上的事件，比如读取用户的购买请求、返回商品信息等 。这样，服务器能够在高并发的情况下，保持较高的吞吐量和快速的响应速度，为用户提供流畅的购物体验 。

再比如即时通讯软件，它需要实时处理大量用户的消息收发。假设一个即时通讯软件有 100 万在线用户，每个用户可能随时发送消息。如果使用传统的 select 或 poll 技术，在处理这 100 万用户的连接时，由于频繁的轮询和大量的数据拷贝，系统资源会被大量消耗，导致消息处理延迟严重，用户发送的消息可能要等很久才能被接收和转发。而 epoll 可以高效地管理这些连接，当某个用户发送消息时，epoll 能迅速感知到，并将对应的 socket 加入就绪链表，通知应用程序读取和处理消息，实现消息的快速收发，满足即时通讯对实时性的严格要求 。

## 十、实际应用案例

### 知名项目中的 Epoll 应用

epoll 在许多知名项目中都发挥着关键作用，成为提升性能的 “秘密武器”。Nginx 作为一款高性能的 Web 服务器和反向代理服务器，就大量运用了 epoll 来实现高效的网络通信 。Nginx 在处理大量并发请求时，每个请求都对应一个 socket 连接，也就是一个文件描述符。通过 epoll，Nginx 可以同时监听这些大量的 socket，当有新的请求到达或者某个连接上有数据可读 / 可写时，epoll 能够迅速感知并通知 Nginx 进行处理。在一个高并发的电商网站中，Nginx 可能同时需要处理成千上万的用户请求，epoll 的高效事件通知机制使得 Nginx 能够快速响应这些请求，保证网站的流畅运行 ，大大提高了用户体验。

Redis 同样是 epoll 的忠实用户。Redis 是一个基于内存的高性能键值对数据库，它需要处理大量的客户端连接和数据读写操作 。Redis 利用 epoll 来管理这些客户端连接对应的 socket，实现了单线程高效处理大量并发请求。当有新的客户端连接时，Redis 通过 epoll 将新连接的 socket 添加到事件监听列表中 。当某个客户端发送数据（比如执行 SET、GET 等命令）时，epoll 会检测到对应的 socket 有可读事件发生，通知 Redis 读取数据并执行相应的命令，然后将结果返回给客户端 。在一个大型的社交平台中，用户频繁地进行点赞、评论等操作，这些操作都会产生大量的 Redis 请求，epoll 帮助 Redis 高效地处理这些并发请求，保证社交平台的实时性和高性能 。

### 代码示例与性能测试

为了更直观地展示 epoll 在实际编程中的使用，我们来看一个简单的代码示例 。下面是一个使用 epoll 实现的简单的 TCP 服务器代码（以 C 语言为例）：

```
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/epoll.h>

#define MAX_EVENTS 10
#define PORT 8888

int main() {
    int listenfd, connfd, nfds, epfd;
    struct sockaddr_in servaddr, cliaddr;
    socklen_t clilen;
    struct epoll_event ev, events[MAX_EVENTS];

    // 创建监听socket
    listenfd = socket(AF_INET, SOCK_STREAM, 0);
    if (listenfd == -1) {
        perror("socket creation failed");
        exit(EXIT_FAILURE);
    }

    // 初始化服务器地址结构
    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = INADDR_ANY;
    servaddr.sin_port = htons(PORT);

    // 绑定socket到地址
    if (bind(listenfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) == -1) {
        perror("bind failed");
        close(listenfd);
        exit(EXIT_FAILURE);
    }

    // 监听socket
    if (listen(listenfd, 10) == -1) {
        perror("listen failed");
        close(listenfd);
        exit(EXIT_FAILURE);
    }

    // 创建epoll实例
    epfd = epoll_create1(0);
    if (epfd == -1) {
        perror("epoll_create1 failed");
        close(listenfd);
        exit(EXIT_FAILURE);
    }

    // 将监听socket添加到epoll实例中
    ev.events = EPOLLIN;
    ev.data.fd = listenfd;
    if (epoll_ctl(epfd, EPOLL_CTL_ADD, listenfd, &ev) == -1) {
        perror("epoll_ctl: listenfd");
        close(listenfd);
        close(epfd);
        exit(EXIT_FAILURE);
    }

    while (1) {
        // 等待事件发生
        nfds = epoll_wait(epfd, events, MAX_EVENTS, -1);
        if (nfds == -1) {
            perror("epoll_wait failed");
            break;
        }

        for (int i = 0; i < nfds; i++) {
            if (events[i].data.fd == listenfd) {
                // 处理新的连接
                clilen = sizeof(cliaddr);
                connfd = accept(listenfd, (struct sockaddr *)&cliaddr, &clilen);
                if (connfd == -1) {
                    perror("accept failed");
                    continue;
                }

                // 将新连接的socket添加到epoll实例中
                ev.events = EPOLLIN;
                ev.data.fd = connfd;
                if (epoll_ctl(epfd, EPOLL_CTL_ADD, connfd, &ev) == -1) {
                    perror("epoll_ctl: connfd");
                    close(connfd);
                }
            } else {
                // 处理已连接socket上的读事件
                connfd = events[i].data.fd;
                char buffer[1024] = {0};
                int valread = read(connfd, buffer, 1024);
                if (valread == -1) {
                    perror("read failed");
                    close(connfd);
                    continue;
                } else if (valread == 0) {
                    // 客户端关闭连接
                    close(connfd);
                } else {
                    // 处理接收到的数据
                    printf("Received: %s\n", buffer);
                    // 简单回显数据给客户端
                    write(connfd, buffer, strlen(buffer));
                }
            }
        }
    }

    // 关闭socket和epoll实例
    close(listenfd);
    close(epfd);

    return 0;
}
```

这个代码首先创建了一个监听 socket，绑定到指定端口并开始监听。然后创建了一个 epoll 实例，并将监听 socket 添加到 epoll 中，监听读事件（EPOLLIN）。在主循环中，通过 epoll\_wait 等待事件发生，当有新连接到达时，接受连接并将新连接的 socket 也添加到 epoll 中；当已连接的 socket 有数据可读时，读取数据并进行简单的处理（这里是回显数据给客户端） 。

为了测试 epoll 的性能，我们可以进行一个简单的性能测试。假设我们使用一个客户端程序向上述服务器发送大量的请求，分别使用 epoll、select 和 poll 三种 I/O 模型来实现服务器，并记录它们在处理相同数量请求时的时间和吞吐量等性能指标 。测试环境为一台配置为 Intel Core i7-10700K CPU、16GB 内存的 Linux 服务器，客户端和服务器在同一局域网内 。**测试结果如下表所示：**

|I/O 模型|处理 10000 个请求时间（秒）|吞吐量（请求 / 秒）|
| --------| ---------------------------| -------------------|
|epoll|1.2|8333.33|
|select|5.6|1785.71|
|poll|4.8|2083.33|

从测试结果可以明显看出，epoll 在处理大量并发请求时，无论是时间还是吞吐量上，都远远优于 select 和 poll。epoll 处理 10000 个请求只需要 1.2 秒，吞吐量达到了 8333.33 请求 / 秒，而 select 和 poll 处理相同数量的请求所需时间分别是 5.6 秒和 4.8 秒，吞吐量也远低于 epoll 。我们还可以通过图表更直观地展示这些数据，比如使用柱状图，横坐标为 I/O 模型，纵坐标为吞吐量，这样可以清晰地看到 epoll 在性能上的巨大优势 。
