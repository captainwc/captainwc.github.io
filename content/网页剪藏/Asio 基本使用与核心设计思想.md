---
title: Asio 基本使用与核心设计思想 | [转载](https://blog.csdn.net/gma999/article/details/143983035)
date: 2025-04-17
tags: [asio]
categories: ["博客剪藏"]
series: [网络编程]
author: gma999
---

# 【Boost】Asio 基本使用与核心设计思想_boost::asio-CSDN博客

> [!warning] 声明
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://blog.csdn.net/gma999/article/details/143983035)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [【Boost】Asio 基本使用与核心设计思想_boost::asio-CSDN博客](https://blog.csdn.net/gma999/article/details/143983035)

---


概述
--

> 基本了解

主要用于网络编程和底层I/O操作，支持同步异步操作，提供队列各种接口，从而帮助我们快速构建网路哦应用程序，目的就是简化I/O代码，提高性能和可维护性

> 主要特点总结

*   **跨平台支持**：Boost.Asio 支持 Windows、Linux、Mac OS 等多个操作系统。它封装了底层的 I/O 机制，使得开发者能够无缝地在不同平台之间切换
*   **同步和异步操作**：Boost.Asio 提供了同步和异步两种操作模型。在同步模式下，操作会阻塞线程直到完成；在异步模式下，操作会立即返回，并通过回调函数在操作完成时通知应用程序。异步操作通过 `io_service` 或 `io_context` 来管理事件和任务调度
*   **支持各种 I/O 类型**
    *   **网络编程**：Boost.Asio 提供了对 TCP 和 UDP 网络编程的支持，可以用来开发高效的服务器和客户端程序
    *   **定时器**：Boost.Asio 可以设置定时器来在指定的时间点执行操作，广泛应用于定时任务和超时控制。
    *   **串行端口**：通过 Boost.Asio，开发者还可以进行串行端口的通信操作
*   **不依赖于线程池**：Boost.Asio 本身不依赖于线程池，它使用 `io_service`（在新版中为 `io_context`）来调度异步操作。开发者可以灵活地决定如何管理线程池，或者在单线程模式下使用

> 核心概念

**o\_service / io\_context**：`io_service`（在新版本中为 `io_context`）是 Boost.Asio 的核心组件，负责管理和调度所有异步操作。通过 `io_service`，可以注册异步操作，并在操作完成时通过回调函数得到通知

**异步操作**：Boost.Asio 提供的异步操作模型基于回调函数。开发者可以通过 `async_` 系列函数（如 `async_read`、`async_write` 等）启动异步操作。这些操作不会阻塞线程，而是将操作提交给 `io_service`，并在操作完成时执行回调

**套接字（Socket）**：Boost.Asio 提供了对 TCP 和 UDP 套接字的支持。TCP 套接字（`tcp::socket`）用于建立面向连接的通信，UDP 套接字（`udp::socket`）则用于无连接的通信。开发者可以通过这些类实现网络通信功能

常用接口与应用
-------

### boost::asio::io\_context

> 主要作用

主要作用就是调用异步操作和处理这些操作的核心函数，内部提供了事件循环机制

*   **调度异步任务**：`io_context` 是一个任务队列，可以调度和执行异步任务。所有异步操作都需要绑定到一个`io_context` 对象
*   **事件循环**：`io_context` 提供事件循环（通过 `run()` 方法），用于不断检查和执行任务队列中的任务
*   线程安全：可以被多个线程共享，使得多个线程可以并发地处理同一个 `io_context` 上的任务
*   **同步与异步支持**：它既支持异步任务，也可以在事件循环内执行同步任务

> 常用方法总结

*   **`run()`** 启动事件循环，处理所有挂起的任务，直到任务队列清空为止
*   **`run_one()`** 处理任务队列中的一个任务，然后立即返回
*    **`poll()`** 非阻塞地处理任务队列中的所有任务。如果任务队列为空，则立即返回
*   **`poll_one()`** 非阻塞地处理一个任务。如果任务队列中没有任务，则立即返回
*   **`stop()`** 停止事件循环。`run()` 方法会尽快返回，但不会清空未处理的任务队列
*   **`reset()`** 重置事件循环的状态，使得可以再次调用 `run()` 或 `poll()` 方法。通常在调用 `stop()` 后使用
*   **`get_executor()`** 获取与当前 `io_context` 关联的执行器（executor）
*   **`post(handler)`** 将一个任务添加到任务队列。任务是通过 `handler` 函数对象定义的
*   **`dispatch(handler)`** 如果可能的话，立即在当前线程中执行任务；否则，将其添加到任务队列中
*   **`work_guard`（类）** 用于确保 `io_context` 不会因为任务队列为空而自动退出。它能够保持事件循环处于活跃状态

> 使用步骤总结

*   创建 `io_context` 对象
*   为异步操作或回调绑定 `io_context`
*   调用 `run()` 或其他事件循环方法启动 `io_context`

#### 单任务循环

![](https://i-blog.csdnimg.cn/direct/c6175a895e6f4568a07ba7987d894f12.png)

```
#include <boost/asio.hpp>
#include <iostream>

int main() {
    // 创建 io_context 对象
    boost::asio::io_context io_context;

    // 提交一个简单任务到 io_context
    io_context.post([]() {
        std::cout << "Hello, Boost.Asio!" << std::endl;
    });

    // 启动事件循环
    io_context.run();

    return 0;
}
```

#### 多任务调度

![](https://i-blog.csdnimg.cn/direct/c90467c298754e4d9087953587f92d18.png)

```
int main()
{
    boost::asio::io_context io_context;

    io_context.post([](){
        std::cout<<"Hello,Boost.Asio"<<std::endl;
    });

    io_context.post([]() {
        std::cout << "Task 1" << std::endl;
    });

    io_context.post([]() {
        std::cout << "Task 2" << std::endl;
    });

    io_context.post([]() {
        std::cout << "Task 3" << std::endl;
    });

    io_context.run();

    return 0;
}
```

> 多线程共享一个io\_context对象，实现并发处理

![](https://i-blog.csdnimg.cn/direct/c741e5177130456daa8bb3826a3454ea.png)

```
#include <boost/asio.hpp>
#include <iostream>
#include <thread>

void worker(boost::asio::io_context& io_context, int id) {
    io_context.run();
    std::cout << "Thread " << id << " finished." << std::endl;
}

int main() {
    boost::asio::io_context io_context;

    // 提交任务
    for (int i = 0; i < 10; ++i) {
        io_context.post([i]() {
            std::cout << "Task " << i << " is running" << std::endl;
        });
    }

    // 创建线程池
    std::vector<std::thread> threads;
    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(worker, std::ref(io_context), i);
    }

    // 等待所有线程完成
    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

### boost::asio::ip::tcp::socket

处理 TCP 连接的类，用于发送和接收数据。它支持异步操作，可以在后台完成网络通信任务，而不会阻塞主线程

> 主要功能

*   连接到服务器或监听来自客户端的连接
*   发送和接收数据
*   支持异步操作，如 **`async_read()`, `async_write()`**，可以通过回调处理结果

> **常用方法**

**构造函数**

*   **`tcp::socket(io_context)`** 创建一个未绑定的 TCP 套接字，需通过后续操作指定使用目标
*   **`tcp::socket(io_context, endpoint)`** 创建并绑定到指定端点的 TCP 套接字
*   **`tcp::socket(io_context, protocol)`** 使用指定协议（如 IPv4 或 IPv6）初始化一个 TCP 套接字

**成员函数**

*   **`connect(endpoint)`** 同步连接到指定的远程端点，阻塞直到连接完成
*   **`async_connect(endpoint, handler)`** 异步连接到远程端点，完成时调用指定的处理函数 `handler`
*   **`read_some(buffer)`** 从套接字同步读取数据到缓冲区，返回读取的字节数
*   **`async_read_some(buffer, handler)`** 异步读取数据到缓冲区，完成时调用处理函数 `handler`
*   **`write_some(buffer)`** 从缓冲区同步写入数据到套接字，返回写入的字节数
*   **`async_write_some(buffer, handler)`** 异步写入数据到套接字，完成时调用处理函数 `handler`
*   **`close()`** 关闭套接字以释放资源
*   **`is_open()`** 检查套接字是否处于打开状态
*   **`cancel()`** 取消挂起的异步操作，操作结果将通过处理函数返回
*   **`remote_endpoint()`** 获取远程连接的 IP 和端口信息
*   **`local_endpoint()`** 获取本地绑定的 IP 和端口信息

> **使用步骤**

*   **创建和初始化 `tcp::socket` 对象**： 通过绑定 `io_context` 来初始化套接字
*   **连接远程端点（客户端）或接受连接（服务器）**： 使用 `connect()` 或 `accept()` 建立连接
*   **发送和接收数据**： 使用 `read()`、`write()`（同步）或 `async_read()`、`async_write()`（异步）
*   **关闭套接字**： 通过 `close()` 方法关闭套接字

#### **同步TCP客户端与服务端搭建**

![](https://i-blog.csdnimg.cn/direct/c403a3b4770c4d2a9a4e4eb5bbb27f5f.png)

![](https://i-blog.csdnimg.cn/direct/93778b2f4ffa42deb9a27e6866148a35.png)

```
//
///TCP同步客户端
//

int main() {
    try {
        // 创建 io_context 和 socket
        boost::asio::io_context io_context;
        boost::asio::ip::tcp::socket socket(io_context);

        // 定义远程端点（IP 和端口）
        boost::asio::ip::tcp::endpoint endpoint(
            boost::asio::ip::address::from_string("127.0.0.1"), 8080);

        // 连接到服务器
        socket.connect(endpoint);

        // 发送数据到服务器
        std::string message = "Hello, Server!";
        boost::asio::write(socket, boost::asio::buffer(message));

        // 接收服务器响应
        char buffer[128];
        size_t len = socket.read_some(boost::asio::buffer(buffer));
        std::cout << "Server response: " << std::string(buffer, len) << std::endl;

        // 关闭连接
        socket.close();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```
```
//
///TCP同步服务器
//

int main() {
    try {
        boost::asio::io_context io_context;

        // 创建监听器
        boost::asio::ip::tcp::acceptor acceptor(
            io_context, boost::asio::ip::tcp::endpoint(boost::asio::ip::tcp::v4(), 8080));

        std::cout << "Server is running on port 8080..." << std::endl;

        // 接受客户端连接
        boost::asio::ip::tcp::socket socket(io_context);
        acceptor.accept(socket);

        std::cout << "Client connected: " << socket.remote_endpoint() << std::endl;

        // 接收客户端数据
        char buffer[128];
        size_t len = socket.read_some(boost::asio::buffer(buffer));
        std::cout << "Received: " << std::string(buffer, len) << std::endl;

        // 发送响应
        std::string response = "Hello, Client!";
        boost::asio::write(socket, boost::asio::buffer(response));

        // 关闭连接
        socket.close();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

#### **异步TCP客户端与服务端搭建**

![](https://i-blog.csdnimg.cn/direct/b3ce74a09ffa49099aaf2ee5ddd1ba6f.png)

![](https://i-blog.csdnimg.cn/direct/a557c801f65b4399a799178e3c35fbba.png)

```

//
///TCP异步服务器
//

void on_accept(const boost::system::error_code& ec, boost::asio::ip::tcp::socket socket) {
    if (!ec) {
        std::cout << "Client connected: " << socket.remote_endpoint() << std::endl;

        // 异步读取数据
        auto buffer = std::make_shared<std::vector<char>>(128);
        socket.async_read_some(boost::asio::buffer(*buffer),
            [buffer](const boost::system::error_code& ec, std::size_t length) {
                if (!ec) {
                    std::cout << "Received: " << std::string(buffer->data(), length) << std::endl;
                }
            });
    } else {
        std::cerr << "Accept failed: " << ec.message() << std::endl;
    }
}

int main() {
    boost::asio::io_context io_context;

    // 创建监听器
    boost::asio::ip::tcp::acceptor acceptor(
        io_context, boost::asio::ip::tcp::endpoint(boost::asio::ip::tcp::v4(), 8080));

    // 异步接受连接
    acceptor.async_accept(
        [&acceptor](const boost::system::error_code& ec, boost::asio::ip::tcp::socket socket) {
            on_accept(ec, std::move(socket));
        });

    std::cout << "Server is running on port 8080..." << std::endl;

    // 启动事件循环
    io_context.run();

    return 0;
}
```
```
//
///TCP异步步客户端
//

void on_connect(const boost::system::error_code& ec) {
    if (!ec) {
        std::cout << "Connected to server!" << std::endl;
    } else {
        std::cerr << "Failed to connect: " << ec.message() << std::endl;
    }
}

int main() {
    boost::asio::io_context io_context;
    boost::asio::ip::tcp::socket socket(io_context);

    // 定义远程端点
    boost::asio::ip::tcp::endpoint endpoint(
        boost::asio::ip::address::from_string("127.0.0.1"), 8080);

    // 异步连接
    socket.async_connect(endpoint, on_connect);

    // 运行事件循环
    io_context.run();

    return 0;
}
```

### boost::asio::ip::tcp::acceptor

`acceptor` 类用于监听进入的 TCP 连接。它用于接受客户端发起的连接，并为每个连接创建一个新的 `socket` 实例

> 主要功能

*   监听端口，等待客户端连接
*   一旦有客户端连接成功，创建一个新的 `socket` 来处理与客户端的通信

> 构造函数

*   io\_context：参考上文
*   endpoint：绑定的端点，一般是服务器的IP和端口号

```
boost::asio::ip::tcp::acceptor(io_context, const endpoint&);
// 使用事例
boost::asio::io_context io_context;
boost::asio::ip::tcp::endpoint endpoint(boost::asio::ip::tcp::v4(), 8080);
boost::asio::ip::tcp::acceptor acceptor(io_context, endpoint);
```

> accept（socket）：接收一个客户端连接请求，该方法是阻塞的直到客户端连接成功

*   `socket`：接收客户端连接的 `boost::asio::ip::tcp::socket` 实例。成功连接后，`socket` 会被自动填充为新的连接
*   ：无返回值。如果连接成功，`socket` 已经准备好与客户端进行通信

```
boost::asio::ip::tcp::socket socket(io_context);
acceptor.accept(socket);  // 阻塞，直到有客户端连接
```

> async\_accept(socket , handler）

*    异步接收客户端的连接请求，调用的时候不会阻塞，接受连接的操作在后台执行，操作完成后的会调用handler函数
*   参数：一个Socket对象一个handle回调函数

```
boost::asio::ip::tcp::socket socket(io_context);
acceptor.async_accept(socket, [](const boost::system::error_code& ec) {
    if (!ec) {
        std::cout << "Client connected successfully!" << std::endl;
    } else {
        std::cerr << "Error: " << ec.message() << std::endl;
    }
});
io_context.run();  // 运行事件循环，处理异步操作
```

>  local\_endpoint()

*    获取acceptor绑定的本地端点
*   返回一个boost::asio::ip::tcp::endpoint ，表示绑定到服务器的IP地址和端口

```
boost::asio::ip::tcp::endpoint local_endpoint = acceptor.local_endpoint();
std::cout << "Server is listening on " << local_endpoint << std::endl;
```

>  close（）

*   关闭acceptor，停止监听新连接，一般是在应用程序退出的时候调用，释放资源

> 具体使用参考同步与异步服务器搭建

### boost::asio::deadline\_timer / steady\_timer

这两个类是用于异步编程中的定时操作类，主要用于设置延时操作

*   **`deadline_timer`** 是基于绝对时间的定时器，适用于在某一指定时刻执行操作
*   **`steady_timer`** 是基于相对时间的定时器，适用于相对延迟

> 主要功能

*   异步定时操作
*   定时器过期时，调用指定的回调函数

#### deadline\_timer（基于绝对时间）

> 构造函数

*   ptime：定时器到期的绝对时间点
*   time\_duration：从当前时间开始，持续时间

```
boost::asio::deadline_timer(io_context, const boost::posix_time::ptime&);
boost::asio::deadline_timer(io_context, const boost::posix_time::time_duration&);
```

> 常用方法

*   async\_wait(handler)：异步等待定时器到期，handler是定时器到期时候的回调函数
*   expires\_at(ptime)：设置定时器的到期时间为指定的绝对时间点
*   expires\_from\_now(time\_duration)：设置定时器到期时间为相对时间
*   cancel()：取消定时器

> 具体使用

#### 定时器1

![](https://i-blog.csdnimg.cn/direct/8141b73834dc4f509f1f5d1d4965941f.png)

```
#include <boost/asio.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>
#include <iostream>

void handler(const boost::system::error_code& /*ec*/) {
    std::cout << "Deadline timer expired!" << std::endl;
}

int main() {
    try {
        boost::asio::io_context io_context;

        // 设置绝对到期时间（5秒后）
        boost::asio::deadline_timer timer(io_context, boost::posix_time::seconds(5));

        // 异步等待定时器到期
        timer.async_wait(handler);

        // 启动事件循环
        io_context.run();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

#### steady\_timer（相对时间）

相对时间也就是到期时间是从当前时间开始的延迟

> 构造函数

```
boost::asio::steady_timer(io_context, const boost::chrono::steady_clock::duration&);
```

> 常用方法

*    async\_wait(handler)：异步等待到期后调用handler回调函数
*   expires\_after(duration)：设置定时器的到期时间为从当前时间开始的相对时间
*   cancel()：取消定时器

```
#include <boost/asio.hpp>
#include <iostream>

void handler(const boost::system::error_code& /*ec*/) {
    std::cout << "Steady timer expired!" << std::endl;
}

int main() {
    try {
        boost::asio::io_context io_context;

        // 设置相对到期时间（5秒后）
        boost::asio::steady_timer timer(io_context, boost::asio::chrono::seconds(5));

        // 异步等待定时器到期
        timer.async_wait(handler);

        // 启动事件循环
        io_context.run();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

### boost::asio::ip::tcp::resolver

`resolver` 是用来解析主机名和服务名的类。它将域名解析为具体的 IP 地址，用于建立连接

> 主要功能

*   解析主机名或 IP 地址，返回可以用于连接的端点（`endpoint`）
*   异步解析支持，通过 `async_resolve()` 实现

> 主要功能

*   解析主机名和服务名：resolver可以将主机名或者服务名解析成为一个或者多个IP地址和端口对
*   支持同步和异步两种操作
*   返回endpoint列表，返回一个boost::asio::ip::tcp::resolver::results\_type类型的对象，其可以解析一个或者多个endpoint，这些endpoint直接用于建立连接

> 构造函数

```
boost::asio::ip::tcp::resolver(io_context);
```

> 常用方法

*   resolve(const std::string& host, const std::string& service)：指定主机名和服务名然后返回一个endpoint列表
*   async\_resolve(const std::string& host, const std::string& service, handler)：异步解析

#### 同步解析

![](https://i-blog.csdnimg.cn/direct/d83ea92b29f34801afa173119e1658e5.png)

```
int main() {
    try {
        boost::asio::io_context io_context;

        // 创建一个 resolver 对象
        boost::asio::ip::tcp::resolver resolver(io_context);

        // 同步解析主机名和服务名
        auto endpoints = resolver.resolve("example.com", "http");

        for (const auto& endpoint : endpoints) {
            std::cout << "Resolved endpoint: " << endpoint.endpoint() << std::endl;
        }

    } catch (const boost::system::system_error& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

####  异步解析

![](https://i-blog.csdnimg.cn/direct/b08277a48bb84dca8ee6bf854bdfa853.png)

```
void on_resolve(const boost::system::error_code& ec, boost::asio::ip::tcp::resolver::results_type endpoints) {
    if (!ec) {
        for (const auto& endpoint : endpoints) {
            std::cout << "Resolved endpoint: " << endpoint.endpoint() << std::endl;
        }
    } else {
        std::cerr << "Resolve failed: " << ec.message() << std::endl;
    }
}

int main() {
    try {
        boost::asio::io_context io_context;

        // 创建 resolver 对象
        boost::asio::ip::tcp::resolver resolver(io_context);

        // 异步解析主机名和服务名
        resolver.async_resolve("example.com", "http", on_resolve);

        // 启动事件循环，等待解析完成
        io_context.run();

    } catch (const boost::system::system_error& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

### boost::asio::buffer / mutable\_buffer

`buffer` 是 `Boost.Asio` 中用于封装数据块的类。它用于表示读写操作的数据区，支持多种数据类型（如数组、`std::vector`、`std::string`）

> **主要功能**

*   用于缓冲区管理，通常用于传递给异步读写操作
*   `mutable_buffer` 用于可以修改的数据缓冲区，`const_buffer` 用于只读缓冲区

#### Buffer

> **创建使用**

*   该函数将数据容器封装成一个缓冲区对象
*   通过该接口可以将容器包装成一个可以传递给异步读写操作的缓冲区对象
*   支持的数据类型
    *   oost::asio::buffer(my\_array)数组类型
    *   vector 、 string、array

```
#include <boost/asio.hpp>
#include <vector>
#include <iostream>

int main() {
    std::vector<char> data(128);  // 创建一个存储 128 字节的 vector
    boost::asio::buffer(data);     // 使用 boost::asio::buffer() 创建一个缓冲区
    std::cout << "Buffer size: " << data.size() << std::endl;
    return 0;
}
```

#### mutable\_buffer

表示一个可修改的数据缓冲区，表示可以修改缓冲区的数据，异步操作中一般用于读取缓冲区数据或者发送数据

> **构造函数**

*   data：指向数据存储区域的指针
*   size：缓冲区的大小，字节为单位

```
boost::asio::mutable_buffer buffer(void* data, std::size_t size);
```

> **测试**

![](https://i-blog.csdnimg.cn/direct/c838c06b7866452b99f15972866c6e74.png)

```
int main() {
    std::vector<char> data(128);  // 创建一个存储 128 字节的 vector
    boost::asio::mutable_buffer buffer(data.data(), data.size());  // 创建一个可修改的缓冲区
    std::cout << "Mutable buffer size: " << buffer.size() << std::endl;
    return 0;
}
```

### boost::asio::streambuf

`streambuf` 是一个内存缓冲区类，提供了一个流接口来读写数据。它常用于处理异步读取的数据

> **主要功能**

*   为流式输入/输出提供一个缓冲区
*   适用于处理流数据，如 HTTP 请求/响应、网络协议等

> **构造函数**

*   通过默认构造函数创建一个空的缓冲区，可以通过异步读写操作将数据存入或者从中读取

```
boost::asio::streambuf buf;  // 创建一个空的 streambuf 对象
```

> **常用方法**

*   获取或写入缓冲区数据：通过data()获取数据区域，consume()方法从缓冲区中消费数据
    *   streambuf对象的转换为boost::asio::mutable\_buffer或者boost::asio::const\_buffer，然后进行读写操作
*   std::istream和std::ostream构造函数接收streambuf对象，然后就可以像标准流一样读写或者写入数据

#### 异步读取数据

```
#include <boost/asio.hpp>
#include <iostream>

void read_handler(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    if (!ec) {
        std::cout << "Successfully read " << bytes_transferred << " bytes." << std::endl;
    } else {
        std::cerr << "Error during read: " << ec.message() << std::endl;
    }
}

int main() {
    try {
        boost::asio::io_context io_context;

        boost::asio::ip::tcp::socket socket(io_context);
        boost::asio::ip::tcp::resolver resolver(io_context);
        auto endpoints = resolver.resolve("example.com", "http");

        // 连接到服务器
        boost::asio::connect(socket, endpoints);

        boost::asio::streambuf buf;  // 创建一个 streambuf 对象
        boost::asio::async_read(socket, buf, read_handler);  // 异步读取数据到 streambuf 中

        io_context.run();  // 启动事件循环
    } catch (const boost::system::system_error& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

#### 异步写入数据

```
#include <boost/asio.hpp>
#include <iostream>

void write_handler(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    if (!ec) {
        std::cout << "Successfully sent " << bytes_transferred << " bytes." << std::endl;
    } else {
        std::cerr << "Error during write: " << ec.message() << std::endl;
    }
}

int main() {
    try {
        boost::asio::io_context io_context;

        boost::asio::ip::tcp::socket socket(io_context);
        boost::asio::ip::tcp::resolver resolver(io_context);
        auto endpoints = resolver.resolve("example.com", "http");

        // 连接到服务器
        boost::asio::connect(socket, endpoints);

        // 将数据放入 streambuf
        boost::asio::streambuf buf;
        std::ostream os(&buf);
        os << "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n";  // 向 buf 中写入 HTTP 请求

        // 异步写入数据
        boost::asio::async_write(socket, buf, write_handler);

        io_context.run();  // 启动事件循环
    } catch (const boost::system::system_error& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

### boost::asio::async\_read() / write()

这两个函数用于异步地从 `socket` 读取数据或写入数据。它们支持回调机制，在操作完成时调用指定的回调函数

> **主要功能**

*   异步读写操作，避免阻塞主线程
*   支持传输数据（如字符串、文件等）

> **接口在前面的事例中已经被广泛使用**

```
boost::asio::async_read(socket, boost::asio::buffer(data), handler);  // 异步读取数据
boost::asio::async_write(socket, boost::asio::buffer(data), handler);  // 异步写入数据
```

### boost::asio::connect() / async\_connect()

`connect` 用于同步连接到远程主机，而 `async_connect` 用于异步连接，后者更常用于高性能网络编程

> **主要功能**

*   用于客户端连接远程服务器。
*   `async_connect` 支持异步连接，在连接成功后调用回调函数

```
boost::asio::async_connect(socket, endpoints, handler);
```

### boost::asio::post()

`post` 是一个简单的异步任务调度器，它将任务投递到 `io_context` 中，任务会在 `io_context.run()` 循环中执行

> **主要功能**

在事件循环中调度任务执行，类似于线程池的任务调度

```
boost::asio::post(io_context, [](){ std::cout << "Hello, Asio!" << std::endl; });
```

### boost::asio::strand

`strand` 是 `Boost.Asio` 中用于处理线程安全问题的类。在多线程环境中，它确保多个异步操作的回调函数不会同时执行，从而避免数据竞争和不一致性

> **主要功能**

*   提供线程安全的任务执行模型
*   确保同一 `strand` 中的回调函数按顺序执行
*   使用strand可以避免在多线程环境中出现数据竞争或者死锁，尤其是在需要访问共享资源的时候

> **构造函数**

*    io\_context.get\_executor()提供了io\_context的执行器，定义了strand中的任务执行上下文

```
boost::asio::strand<boost::asio::io_context::executor_type> strand(io_context.get_executor());
```

> **boost::asio::post(strand, handler)**

*   使用strand提交一个回调函数，然后strand会确保这些回调函数按照顺序执行

```
boost::asio::post(strand, handler);  // 保证 handler 按顺序执行
```

> **strand 和 async\_\***

```
boost::asio::async_read(socket, buffer, strand.wrap(handler));  // wrap 使回调函数按顺序执行
```

#### strand保证回调顺序

![](https://i-blog.csdnimg.cn/direct/9062af24f58449dbadc6c3703ffe06e6.png)

```
///
///strand 保证回调顺序
///

void handler(int id) {
    std::cout << "Handler " << id << " executed in thread: "
              << std::this_thread::get_id() << std::endl;
}

int main() {
    boost::asio::io_context io_context;
    boost::asio::strand<boost::asio::io_context::executor_type> strand(io_context.get_executor());

    // 提交多个任务到同一个 strand，确保它们按顺序执行
    boost::asio::post(strand, std::bind(handler, 1));  // 提交任务1
    boost::asio::post(strand, std::bind(handler, 2));  // 提交任务2
    boost::asio::post(strand, std::bind(handler, 3));  // 提交任务3

    // 在多线程环境中运行 io_context
    std::thread t1([&io_context](){ io_context.run(); });
    std::thread t2([&io_context](){ io_context.run(); });

    t1.join();
    t2.join();

    return 0;
}
```

> **strand.wrap()**

将异步操作的回调函数打包在一起，从而保证回调函数在同一strand中按照顺序执行，主要是在多线程中使用

```
boost::asio::async_read(socket, buffer, strand.wrap(handler));
```

####  strand.wrap() 保证顺序执行

```
#include <boost/asio.hpp>
#include <iostream>
#include <thread>

void handler(int id) {
    std::cout << "Handler " << id << " executed in thread: "
              << std::this_thread::get_id() << std::endl;
}

int main() {
    boost::asio::io_context io_context;
    boost::asio::strand<boost::asio::io_context::executor_type> strand(io_context.get_executor());

    // 提交多个任务到同一个 strand，确保它们按顺序执行
    boost::asio::async_read_some(socket, buffer, strand.wrap(std::bind(handler, 1)));
    boost::asio::async_read_some(socket, buffer, strand.wrap(std::bind(handler, 2)));
    boost::asio::async_read_some(socket, buffer, strand.wrap(std::bind(handler, 3)));

    // 在多线程环境中运行 io_context
    std::thread t1([&io_context](){ io_context.run(); });
    std::thread t2([&io_context](){ io_context.run(); });

    t1.join();
    t2.join();

    return 0;
}
```

核心设计思想
------

### 异步模型与事件循环机制

> **整体逻辑**

当调用一个异步操作的时候，io\_service会启动事件循环

*   **提交异步操作**
*   **进入事件循环，不断监视异步操作的状态，直到其完成**
*   **回调通知，如果操作完成，会调用其预先注册的好的回调函数**
*   **继续执行其他任务**

> 内部实现结合具体方法

**post() 和 dispatch()**

*   post方法就是将任务投递到任务队列，任务不会打断线程，而是会在队列中等待执行
*   dispath(）方法则是提交给当前线程立即执行，不会将任务放到队列中，而是直接在当前线程中执行

**io\_service/io\_context**

*   **run()方法：会将程序进入循环，开始调度和执行已经提交的异步操作**
*   **io\_serive：则可以将回调函数添加到任务队列中，等待线程进行处理**

> **多线程与事件循环机制结合**

多核机器上通过多核线程可以提高运行性能，多线程设计的核心之一就是确保其互相不会打扰，高效的执行异步任务，所以通过循环机制和任务队列。该处的核心思想可以参考modou网络库的设计思想

### 多路复用机制

asio中对于多路复用机制的使用在于确保在I/O操作时及时触发回调函数，不需要为每一个I/O操作都创建新的线程

> **strand设计**

asio设计stand机制的核心目的就是保证异步编程中回调函数的顺序性，避免多个回调函数并发执行时的竞态条件。因为多线程环境中，**多个异步操作的回调可能会在不同的线程中并发执行**，那么就有可能造成数据不一致或者竞争情况

strand的核心作用就是让异步操作放入一个队列中，然后让其排队，从而确保同一strand中的回调函数按顺序执行，这样即使多个回调函数在被不同线程执行的时候，也不会出现竞态条件

**核心特点：通过队列确保顺序性；通过事件循环机制执行任务，从而减少了锁的开销**

> **拓展1：设计高效I/O复用机制，减少阻塞和提高吞吐量的思路**

*   **非阻塞 I/O：** 采用非阻塞 I/O 操作，避免线程被阻塞，浪费计算资源。当某个文件描述符或套接字准备好进行 I/O 操作时，才通知事件循环来处理
*   **事件通知机制：** 在高并发环境中，尽量使用高效的事件通知机制
*   **线程池：** 如果 I/O 操作涉及复杂的计算，可以使用线程池来处理。通过将计算密集型任务从主线程中分离出来，避免阻塞事件循环，从而提升系统的并发性
*   **事件循环设计：** 确保事件循环高效执行，可以通过优化任务调度、减少空转等待等方式提高事件循环的吞吐量。要避免将阻塞的操作放入事件循环中，避免影响其他异步任务的执行
*   **批量操作和分片：** 对于大量的 I/O 操作，可以将它们合并为批量操作，减少每次 I/O 操作的开销，提升整体吞吐量。另外，拆分大任务为多个小任务也能提高并发执行效率

### 其他设计思想

之前学习modou网络库中接触并总结过这些思想，所以此处省略

*   **内存缓冲区机制：**预先设置一块缓冲区，从而减少内存分配从而提高内存利用率
*   **定时器与异步事件调度：**其中核心思想就是时间轮的设计
*   **回调函数与生命周期管理：**通过智能指针以及绑定到连接从而控制其生命周期
