---
title: leetcode调试指南
date: 2024-03-14
tags: [leetcode]
---

# leetcode 调试

## 方法 2

> 代码拷贝到本地，用 ide/gdb 调试。
> 比如使用 vim + floaterm + cgdb，效果见后图

对于此法，提供一个 **header-only** 的头文件 📜[《lc.h》](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/pic_bed/2024_7/lc.h)，只需要引用此头文件，然后将 Class Solution 复制到本地，加上 main 函数即可运行

### 功能简介

- 常用头文件（类似<bits/stdc++.h>，但是 win 上没有）以及 `using namespace std;`
- leetcode 的链表和二叉树的定义，以及快速构建函数
- 随机数库封装，可以直接获取随机 vector、字符串等
- Logger，可以打印包括**容器**、**嵌套容器**、**自定义类型**在内的各种类型
- Assert, 一些断言。是的，这跟 leetcode 无关，可以在你编写自己的小算法的时候提供一些测试套件。效果如图：
- benchmark，简单的性能测试（测试运行 n 次用时、平均每次用时）
- 其他的，大杂烩。（比如对 ppm 位图的封装，你可以由此实现一个对可视化的排序算法...）

### 效果图

![image](https://img2024.cnblogs.com/blog/1578652/202407/1578652-20240719183806684-1731724980.png)

另外，推荐使用 **vim + floaterm + cgdb** 的方式，配合此头文件对 leetcode 代码进行调试，喜欢的点是比较轻量，随时随地能调一下子。效果如下
![image](https://img2024.cnblogs.com/blog/1578652/202407/1578652-20240719184145994-538062460.png)

## 方法 1

> 在 leetcode 代码头上定义测试宏，使用 print 大法来调试。

这里我把代码用 vscode 的 join line 合并成一行了，不然有些喧宾夺主。记得**提交的时候把 DEBUG 宏关闭**就好。格式化后的代码见后文

```c++
#define DEBUG 1
#if DEBUG
#include <iostream>
#include <numeric>
#include <string>
#include <type_traits>
template <typename T> struct ListType { template <typename Ptr> static auto test(Ptr ptr) -> decltype(ptr->val, ptr->next, std::true_type{}); template <typename Ptr> static std::false_type test(...); static constexpr bool value = decltype(test<T>(nullptr))::value; }; template <typename T, typename = void> struct Container : std::false_type {}; template <typename T> struct Container<T, std::void_t<typename T::value_type>> : std::true_type {}; const std::string sep = ","; template <typename T> std::string skToString(T c) { if constexpr (ListType<T>::value) { std::string ret = "["; auto p = c; while (p != nullptr && p->next != nullptr) { ret = ret + skToString(p->val) + sep; p = p->next; } if (p != nullptr) { ret += skToString(p->val); } ret += "]"; return ret; } else if constexpr (Container<T>::value && !std::is_convertible_v<T, std::string>) { if (c.empty()) { return "[]"; } return "[" + std::accumulate(std::next(c.begin()), c.end(), skToString(*(c.begin())), [](std::string a, auto b) { return a + sep + skToString(b); }) + "]"; } else if constexpr (std::is_arithmetic_v<T>) { return std::to_string(c); } else if constexpr (std::is_convertible_v<T, std::string>) { return c; } else { return "{" + skToString(c.first) + sep + skToString(c.second) + "}"; } } template <typename... Args> std::string skFmt(std::string_view format, Args... args) { std::string fmtStr(format); return ((fmtStr.replace(fmtStr.find("{}"), 2, skToString(args))), ...); } template <typename... PairTypes> void dumpWithName(PairTypes... args) { ((std::cout << "【" << skToString(std::get<0>(args)) << "】:" << skToString(std::get<1>(args)) << " "), ...); }
#define TO_PAIR(x) std::make_pair(#x, x)
#define DUMP1(x) dumpWithName(TO_PAIR(x))
#define DUMP2(x, ...) dumpWithName(TO_PAIR(x)), DUMP1(__VA_ARGS__)
#define DUMP3(x, ...) dumpWithName(TO_PAIR(x)), DUMP2(__VA_ARGS__)
#define DUMP4(x, ...) dumpWithName(TO_PAIR(x)), DUMP3(__VA_ARGS__)
#define DUMP5(x, ...) dumpWithName(TO_PAIR(x)), DUMP4(__VA_ARGS__)
#define DUMP6(x, ...) dumpWithName(TO_PAIR(x)), DUMP5(__VA_ARGS__)
#define DUMP7(x, ...) dumpWithName(TO_PAIR(x)), DUMP6(__VA_ARGS__)
#define DUMP8(x, ...) dumpWithName(TO_PAIR(x)), DUMP7(__VA_ARGS__)
#define GET_MACRO(_1, _2, _3, _4, _5, _6, _7, _8, NAME, ...) NAME
#define OUTV(...) std::cout << skFmt(__VA_ARGS__) << std::endl;
#define DUMP(...) do{GET_MACRO(__VA_ARGS__, DUMP8, DUMP7, DUMP6, DUMP5, DUMP4, DUMP3,DUMP2, DUMP1)(__VA_ARGS__);std::cout << "\n";}while(0)
#else
#define OUTV(...)
#define DUMP(...)
#endif
```

### 功能简介

- LOG(X) 输出 [#x] X \n 的效果
- LOGF(...) 即 format，可以实现 `LOGF("This's my var: list:{}, map:{}, vector:{}, string:{}, int:{} ...", l, mp, vc, str, i)`等类型的输出
- 对 leetcode 涉及到类型（无非就是容器，链表，和基本类型）进行 toString()转换。（正因为有此假设，所以实现时重点在于简洁而不在鲁棒，不支持类型可能会 segment fault）

### 效果图

![image](https://img2024.cnblogs.com/blog/1578652/202407/1578652-20240719184408739-392283445.png)
**进行了一波小更新**，DUMP 可以将传入的变量（最多 8 个）按照【name】: value 的格式打印出来，省去了写 format 字串的麻烦，更方便一些。
![image](https://img2024.cnblogs.com/blog/1578652/202408/1578652-20240817163141183-257422433.png)

### 附：

格式化后的代码，供诸君参考

```c++
#define DEBUG 1
#if DEBUG
#include <iostream>
#include <numeric>
#include <string>
#include <type_traits>
template <typename T>
struct ListType {
    template <typename Ptr>
    static auto test(Ptr ptr) -> decltype(ptr->val, ptr->next,
                                          std::true_type{});
    template <typename Ptr>
    static std::false_type test(...);
    static constexpr bool value = decltype(test<T>(nullptr))::value;
};
template <typename T, typename = void>
struct Container : std::false_type {};
template <typename T>
struct Container<T, std::void_t<typename T::value_type>> : std::true_type {};
const std::string sep = ",";
template <typename T>
std::string skToString(T c) {
    if constexpr (ListType<T>::value) {
        std::string ret = "[";
        auto p = c;
        while (p != nullptr && p->next != nullptr) {
            ret = ret + skToString(p->val) + sep;
            p = p->next;
        }
        if (p != nullptr) {
            ret += skToString(p->val);
        }
        ret += "]";
        return ret;
    } else if constexpr (Container<T>::value &&
                         !std::is_convertible_v<T, std::string>) {
        if (c.empty()) {
            return "[]";
        }
        return "[" +
               std::accumulate(std::next(c.begin()), c.end(),
                               skToString(*(c.begin())),
                               [](std::string a, auto b) {
                                   return a + sep + skToString(b);
                               }) +
               "]";
    } else if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(c);
    } else if constexpr (std::is_convertible_v<T, std::string>) {
        return c;
    } else {
        return "{" + skToString(c.first) + sep + skToString(c.second) + "}";
    }
}
template <typename... Args>
std::string skFmt(std::string_view format, Args... args) {
    std::string fmtStr(format);
    return ((fmtStr.replace(fmtStr.find("{}"), 2, skToString(args))), ...);
}
template <typename... PairTypes>
void dumpWithName(PairTypes... args) {
    ((std::cout << "【" << skToString(std::get<0>(args))
                << "】:" << skToString(std::get<1>(args)) << " "),
     ...);
}
#define TO_PAIR(x) std::make_pair(#x, x)
#define DUMP1(x) dumpWithName(TO_PAIR(x))
#define DUMP2(x, ...) dumpWithName(TO_PAIR(x)), DUMP1(__VA_ARGS__)
#define DUMP3(x, ...) dumpWithName(TO_PAIR(x)), DUMP2(__VA_ARGS__)
#define DUMP4(x, ...) dumpWithName(TO_PAIR(x)), DUMP3(__VA_ARGS__)
#define DUMP5(x, ...) dumpWithName(TO_PAIR(x)), DUMP4(__VA_ARGS__)
#define DUMP6(x, ...) dumpWithName(TO_PAIR(x)), DUMP5(__VA_ARGS__)
#define DUMP7(x, ...) dumpWithName(TO_PAIR(x)), DUMP6(__VA_ARGS__)
#define DUMP8(x, ...) dumpWithName(TO_PAIR(x)), DUMP7(__VA_ARGS__)
#define GET_MACRO(_1, _2, _3, _4, _5, _6, _7, _8, NAME, ...) NAME
#define OUTV(...) std::cout << skFmt(__VA_ARGS__) << std::endl;
#define DUMP(...)                                                        \
    do {                                                                 \
        GET_MACRO(__VA_ARGS__, DUMP8, DUMP7, DUMP6, DUMP5, DUMP4, DUMP3, \
                  DUMP2, DUMP1)                                          \
        (__VA_ARGS__);                                                   \
        std::cout << "\n";                                               \
    } while (0)
#else
#define OUTV(...)
#define DUMP(...)
#endif
```
