---
title: GoogleTest入门指南 | [转载](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)
date: 2025-04-16
tags: [GoogleTest]
categories: ["博客剪藏"]
series: []
author: 缙云烧饼
---

# 【C++】GoogleTest入门指南 - 缙云烧饼 - 博客园

> [!warning] 声明
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [【C++】GoogleTest入门指南](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)

---

参考：  
[GoogleTest官网](https://google.github.io/googletest/)

## 基本概念

要使用GoogleTest，需要包含header `gtest/gtest.h`

## 断言Assertions[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#728254241)

断言是检查条件是否为真的语句，其结果可能是成功或失败，失败分为非致命失败和致命失败两种，后者会终止当前运行，前者则会继续运行。  
GoogleTest中，断言类似于函数调用的宏，断言失败时，GoogleTest会输出断言的源文件和行号位置以及失败消息（所有断言都可以使用<<输出自定义失败消息）

### ASSERT\_\*[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#4031066449)

会抛出致命失败故障的断言，断言失败时中止当前测试函数的运行（不是中断整个TEST）。

```
ASSERT_EQ(x.size(),y.size())  "x与y的大小不相同"

```

### EXPECT\_\*[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2723575970)

会抛出非致命失败故障的断言，不会停止当前函数运行，而是继续往下运行下去

```
EXPECT_EQ(x,y)  "x与y不相等"

```

### 断言分类[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#41088525)

前缀都会是ASSERT\_或者EXPECT\_,它们的区别上面已经进行了说明，所以以下都用X\_来略写

#### 基本断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1101063573)

-   X\_TRUE(condition)：断言condition为True
-   X\_FALSE(condition)：断言condition为False

#### 普通比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2970445533)

-   X\_EQ(v1,v2)：==
-   X\_NE(v1,v2)：!=
-   X\_LT(v1,v2)：<
-   X\_LE(v1,v2)：<=
-   X\_GT(v1,v2)：>
-   X\_GE(v1,v2)：>=

#### C字符串比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3651399125)

-   X\_STREQ(s1,s2)：s1==s2
-   X\_STRNE(s1,s2)：s1!=s2
-   X\_STRCASEEQ(s1,s2)：忽略大小写，s1==s2
-   X\_STRCASENE(s1,s2)：忽略大小写，s1!=s2
    注意：
-   Null指针和空字符""是不相同的
-   假如char \*s1 = "abc"，char \*s2 = "abc"，那么X\_EQ(s1,s2)不通过，因为s1与s2实际上是地址指针，不相同;X\_STREQ(s1,s2)通过，因为字符串相同

#### 浮点数比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3278043603)

对于浮点数，断言只是判断几乎相等

-   X\_FLOAT\_EQ(f1,f2)：f1和f2两个float值几乎相等
-   X\_DOUBLE\_EQ(f1,f2)：f1和f2两个double值几乎相等
-   X\_NEAR(v1,v2,abs\_error)：v1和v2两个浮点数的值差的绝对值不超过abs\_error

#### 明确的成功与失败[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3815582)

-   SUCCEED()：生成一个成功，放行，但是并不代表整个测试成功
-   FAIL()：生成致命错误，立即终止当前测试
-   ADD\_FAILURE()：生成非致命错误，继续运行测试
-   ADD\_FAILURE\_AT("file\_path",line\_number)：生成非致命错误，输出文件名和行号
-   GTEST\_SKIP()：直接结束当前测试
    明确的成功与失败相较于前面的断言更适合判断条件复杂的情况，因为判断条件复杂不适合写成一个表达式condition用于判断。例如`if...else if...else if... else...`

#### 异常断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3202904611)

用于验证一段代码是否抛出给定类型的异常

-   X\_THROW(statement,exception\_type)：statement代码会抛出exception\_type的异常
-   X\_ANY\_THROW(statement)：statement代码会抛出异常，不限异常类型
-   X\_NO\_THROW(statement)：statement代码不会抛出任何类型异常

#### 自定义布尔函数断言（谓词断言）[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2027338141)

-   X\_PREDn(fun,v1,v2...)：拥有n个参数的函数fun会返回True
    例如有一个函数equal(a,b)，那么就是ASSERT\_PRED2(equal,a,b)
    与ASSERT\_EQ、ASSERT\_TRUE()这些断言的区别在于输出的错误信息不同，同时它的功能更加强大

#### 谓词格式化程序断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2572316932)

普通的断言输出信息的内容是预定好的，如果想要自定义输出的内容，可以使用谓词格式化程序断言
具体接口使用可参考：[EXPECT\_PRED\_FORMAT](https://google.github.io/googletest/reference/assertions.html#EXPECT_PRED_FORMAT)
为了避免新的断言宏爆炸式增长，GoogleTest提供了很多谓词格式函数，它们可以使用谓词断言的方式组装成需要的断言，例如浮点数的小于等于

```
using ::testing::FloatLE;
using ::testing::DoubleLE;
...
EXPECT_PRED_FORMAT2(FloatLE, val1, val2);
EXPECT_PRED_FORMAT2(DoubleLE, val1, val2);

```

#### 匹配器断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2179868448)

`X_THAT(value, matcher)`：value的值满足matcher的要求

```cpp
#include "gmock/gmock.h"

using ::testing::AllOf;
using ::testing::Gt;
using ::testing::Lt;
using ::testing::MatchesRegex;
using ::testing::StartsWith;

...
EXPECT\_THAT(value1, StartsWith("Hello"));
EXPECT\_THAT(value2, MatchesRegex("Line \\d+"));
ASSERT\_THAT(value3, AllOf(Gt(5), Lt(10)));
```

关于matcher的具体接口文档，详见[matchers](https://google.github.io/googletest/reference/matchers.html)

#### 类型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2273366328)

调用函数::testing::StaticAssertTypeEq<T1,T2>();
用于断言T1和T2是同一种类型，如果断言满足，该函数什么也不做，如果不同，函数调用会无法编译并报错`T1 and T2 are not the same type`
注意：如果是在类模板或者函数模板中使用时，仅当该函数被实例化（被调用）时才会生效报错，否则不会报错

### 断言使用的位置[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1386563112)

除了在测试代码中使用断言外，在任何C++函数中也都可以使用断言。但是注意，产生致命错误的断言只能用在返回void的函数（构造与析构函数不是返回void的函数）

## 测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#4059550918)

### 简单测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2137147839)

-   使用`TEST()`宏定义和命名测试函数，这个函数是不返回值的普通C++函数

-   函数中可以包含任何有效的C++语句以及各种GoogleTest断言来检查值

-   测试的结果由断言决定，如果测试时没有任何断言失败（致命或非致命）或者测试程序崩溃，则测试成功

-   第一个参数是测试套件的名称，第二个参数是测试套件中的测试名称，这两个名称都必须是有效的C++标识符，并且不能含有任何下划线。测试的全名由测试套件和测试名称组成，不同测试套件的测试可以有相同的测试名称

    TEST(TestSuiteName, TestName){
    ... test body ...
    }


#### 举个栗子[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#69825821)

函数funA有一个输入n，返回n^2，两个测试都属于FunATests测试套件，名字分别是HandlesZeroInput和HandlesPositiveInput用于测试不同的情况

```
int funA(int n);

TEST(FunATests, HandlesZeroInput){
    EXPECT_EQ(funA(0), 0);
}
TEST(FunATests, HandlesPositiveInput){
    EXPECT_EQ(funA(1), 1);
    EXPECT_EQ(funA(2), 4);
    ...
}

```

### 测试夹具[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3748996127)

如果发现自己编写了两个或多个对相似数据进行操作的测试，可以使用测试夹具，它允许我们为多个不同的测试重用相同的对象配置

#### 创建并使用夹具[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2800151575)

-   从::tesing::Test派生一个类，它的主体内容设置为protected，因为我们要从子类中访问夹具成员
-   在类中，声明计划使用的所有对象数据
-   如有必要，编写一个默认构造函数或者SetUp()函数来为每个测试准备对象
-   如有必要，编写一个析构函数或者TearDown()函数来释放测试对象数据
-   如有需要，编写函数供使用该测试夹具的测试内使用
-   注意，GoogleTest不会在多个测试中重用同一个测试夹具对象。对于每个TEST\_F，GoogleTest会创建一个新的测试夹具对象并立刻调用SetUp()，运行测试主题结束后调用TearDown()，最后删除测试夹具对象
-   使用测试夹具的时候，用TEST\_F代替TEST，TEST\_F的第一个参数不再是测试套件名，而是测试夹具类名，具体见下方样例

#### 举个栗子[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#978734251)

假设我们有一个类Queue需要进行测试，它长这样：

```
template typename E  // E is the element type.
class Queue {
public:
    Queue();
    void Enqueue(const E element);
    E* Dequeue();  // Returns NULL if the queue is empty.
    size_t size() const;
...
};

```

定义它的测试夹具类，一般情况下测试夹具类名=类名+Test

```
class QueueTest : public ::testing::Test {
protected:
    void SetUp() override {
        q1_.Enqueue(1);
        q2_.Enqueue(2);
        q2_.Enqueue(3);
    }

    // void TearDown() override {}

    Queueint q0_;
    Queueint q1_;
    Queueint q2_;
};

```

在这里，TearDown()并不需要，因为我们并不需要进行任何清理工作，直接析构就可以了

使用测试夹具进行测试

```
TEST_F(QueueTest, IsEmptyInitially) {
  EXPECT_EQ(q0_.size(), 0);
}

TEST_F(QueueTest, DequeueWorks) {
  int* n = q0_.Dequeue();
  EXPECT_EQ(n, nullptr);

  n = q1_.Dequeue();
  ASSERT_NE(n, nullptr);
  EXPECT_EQ(*n, 1);
  EXPECT_EQ(q1_.size(), 0);
  delete n;

  n = q2_.Dequeue();
  ASSERT_NE(n, nullptr);
  EXPECT_EQ(*n, 2);
  EXPECT_EQ(q2_.size(), 1);
  delete n;
}

```

在这个栗子里，第一个TEST\_F创建一个QueueTest对象t1，t1.SetUp()后进入测试内容进行使用。测试结束后t1.TearDown()然后销毁。对于第二个TEST\_F进行相同的过程

## 调用测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2047075719)

TEST()和TEST\_F都会自动的隐式注册到GoogleTest，所以并不需要为了测试再重新列举所有定义的测试
在定义测试之后，可以直接使用RUN\_ALL\_TESTS()来运行所有测试，如果所有测试都通过了，它会返回0。注意，RUNN\_ALL\_TESTS()会运行所有测试，哪怕这些测试来源于不同的测试套件、不同的源文件。

### 运行测试的过程[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1753488367)

-   保存所有googletest标志的状态
-   为第一个测试创建测试夹具对象，通过SetUp()初始化
-   使用测试夹具对象运行测试
-   测试结束，调用TearDown()清理夹具然后销毁夹具对象
-   恢复所有googletest标志的状态
-   对下一个测试重复以上步骤，直到所有测试都运行结束
    注意：不能忽略RUN\_ALL\_TESTS()的返回值，否则会产生编译器错误。自动化测试服务根据退出代码来判断测试是否通过，而不是通过stdout/sederr来判断，所以main()函数必须返回RUN\_ALL\_TESTS();

### main()的编写[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1752583433)

大部分情况下，我们并不需要自己编写main方法，而是直接链接gtest\_main(注意不是gtest)，这个链接库定义了合适的接入点会帮我们进行测试
如果想自行书写main方法，它需要返回RUN\_ALL\_TESTS()的返回值

```
int main(int argc, char **argv) {
  ::testing::InitGoogleTest(argc, argv);
  return RUN_ALL_TESTS();
}

```

在这段代码里，InitGoogleTest()的作用是解析命令行里GoogleTest的指令参数，这允许用户控制测试程序的行为。它必须在RUN\_ALL\_TESTS之前调用，否则命令行参数不会生效  
在旧版本里，使用的是ParseGUnitFlags()，但是目前它已经被弃用，需要使用InitGoogleTest()

## 后续可填坑[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1717359307)

`gMock`
