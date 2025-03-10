---
title: CyberRT中的代码和工程技巧
date: 2025-03-01 18:08:37
tags: [自动驾驶, CyberRT, C++]
categories: [自动驾驶]
series: [CyberRT专项总结]
---

# CyberRT中的代码和工程技巧

## C++规范

> [!tip]
>
> C++设计类时总有一些不确定的写法，这里列举出CyberRT中的一些设计，作为参考

1. 成员命名后划线 `private: int x_;`

2. 很多类成员也是直接就声明的时候就等号赋值了。比如`std::atomic_flag lock_ = ATOMIC_FLAG_INIT;`

3. 头文件中实现函数加上`inline`

4. 也大量用`std::function，std::shared_ptr`等，不至于提到这些就谈性能色变。比如协程中`using RoutineFunc = std::function<void()>;`

   

## C++语法技巧

1. 匿名namespace当static用，限定作用域在当前文文件中
   ```c++
   // file1.cpp
   namesapce {
   	int x = 10;
   }
   int foo(){return x;} // 当前文件内正常访问
   
   // 等价于：
   static int x = 10;
   ```

   

