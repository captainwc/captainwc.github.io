---
title: GoogleTest与gMock进阶指南 | [转载](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)
date: 2025-04-16
tags: [GoogleTest]
categories: ["博客剪藏"]
series: []
author: 缙云烧饼
---

# 【C++】GoogleTest 入门指南 - 缙云烧饼 - 博客园

> [!warning] 声明
>
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [【C++】GoogleTest 入门指南](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)

---

参考：  
[GoogleTest 官网](https://google.github.io/googletest/)

## 基本概念

要使用 GoogleTest，需要包含 header `gtest/gtest.h`

## 断言 Assertions[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#728254241)

断言是检查条件是否为真的语句，其结果可能是成功或失败，失败分为非致命失败和致命失败两种，后者会终止当前运行，前者则会继续运行。  
GoogleTest 中，断言类似于函数调用的宏，断言失败时，GoogleTest 会输出断言的源文件和行号位置以及失败消息（所有断言都可以使用<<输出自定义失败消息）

### ASSERT\_\*[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#4031066449)

会抛出致命失败故障的断言，断言失败时中止当前测试函数的运行（不是中断整个 TEST）。

```cpp
ASSERT_EQ(x.size(),y.size())  "x与y的大小不相同"
```

### EXPECT\_\*[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2723575970)

会抛出非致命失败故障的断言，不会停止当前函数运行，而是继续往下运行下去

```cpp
EXPECT_EQ(x,y)  "x与y不相等"
```

### 断言分类[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#41088525)

前缀都会是 ASSERT\_或者 EXPECT\_,它们的区别上面已经进行了说明，所以以下都用 X\_来略写

#### 基本断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1101063573)

- X_TRUE(condition)：断言 condition 为 True
- X_FALSE(condition)：断言 condition 为 False

#### 普通比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2970445533)

- X_EQ(v1,v2)：==
- X_NE(v1,v2)：!=
- X_LT(v1,v2)：<
- X_LE(v1,v2)：<=
- X_GT(v1,v2)：>
- X_GE(v1,v2)：>=

#### C 字符串比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3651399125)

- X_STREQ(s1,s2)：s1==s2
- X_STRNE(s1,s2)：s1!=s2
- X_STRCASEEQ(s1,s2)：忽略大小写，s1==s2
- X_STRCASENE(s1,s2)：忽略大小写，s1!=s2
  注意：
- Null 指针和空字符""是不相同的
- 假如 char \*s1 = "abc"，char \*s2 = "abc"，那么 X_EQ(s1,s2)不通过，因为 s1 与 s2 实际上是地址指针，不相同;X_STREQ(s1,s2)通过，因为字符串相同

#### 浮点数比较型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3278043603)

对于浮点数，断言只是判断几乎相等

- X_FLOAT_EQ(f1,f2)：f1 和 f2 两个 float 值几乎相等
- X_DOUBLE_EQ(f1,f2)：f1 和 f2 两个 double 值几乎相等
- X_NEAR(v1,v2,abs_error)：v1 和 v2 两个浮点数的值差的绝对值不超过 abs_error

#### 明确的成功与失败[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3815582)

- SUCCEED()：生成一个成功，放行，但是并不代表整个测试成功
- FAIL()：生成致命错误，立即终止当前测试
- ADD_FAILURE()：生成非致命错误，继续运行测试
- ADD_FAILURE_AT("file_path",line_number)：生成非致命错误，输出文件名和行号
- GTEST_SKIP()：直接结束当前测试
  明确的成功与失败相较于前面的断言更适合判断条件复杂的情况，因为判断条件复杂不适合写成一个表达式 condition 用于判断。例如`if...else if...else if... else...`

#### 异常断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#3202904611)

用于验证一段代码是否抛出给定类型的异常

- X_THROW(statement,exception_type)：statement 代码会抛出 exception_type 的异常
- X_ANY_THROW(statement)：statement 代码会抛出异常，不限异常类型
- X_NO_THROW(statement)：statement 代码不会抛出任何类型异常

#### 自定义布尔函数断言（谓词断言）[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2027338141)

- X_PREDn(fun,v1,v2...)：拥有 n 个参数的函数 fun 会返回 True
  例如有一个函数 equal(a,b)，那么就是 ASSERT_PRED2(equal,a,b)
  与 ASSERT_EQ、ASSERT_TRUE()这些断言的区别在于输出的错误信息不同，同时它的功能更加强大

#### 谓词格式化程序断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2572316932)

普通的断言输出信息的内容是预定好的，如果想要自定义输出的内容，可以使用谓词格式化程序断言
具体接口使用可参考：[EXPECT_PRED_FORMAT](https://google.github.io/googletest/reference/assertions.html#EXPECT_PRED_FORMAT)
为了避免新的断言宏爆炸式增长，GoogleTest 提供了很多谓词格式函数，它们可以使用谓词断言的方式组装成需要的断言，例如浮点数的小于等于

```
using ::testing::FloatLE;
using ::testing::DoubleLE;
...
EXPECT_PRED_FORMAT2(FloatLE, val1, val2);
EXPECT_PRED_FORMAT2(DoubleLE, val1, val2);

```

#### 匹配器断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2179868448)

`X_THAT(value, matcher)`：value 的值满足 matcher 的要求

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

关于 matcher 的具体接口文档，详见[matchers](https://google.github.io/googletest/reference/matchers.html)

#### 类型断言[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2273366328)

调用函数::testing::StaticAssertTypeEq<T1,T2>();
用于断言 T1 和 T2 是同一种类型，如果断言满足，该函数什么也不做，如果不同，函数调用会无法编译并报错`T1 and T2 are not the same type`
注意：如果是在类模板或者函数模板中使用时，仅当该函数被实例化（被调用）时才会生效报错，否则不会报错

### 断言使用的位置[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1386563112)

除了在测试代码中使用断言外，在任何 C++函数中也都可以使用断言。但是注意，产生致命错误的断言只能用在返回 void 的函数（构造与析构函数不是返回 void 的函数）

## 测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#4059550918)

### 简单测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2137147839)

- 使用`TEST()`宏定义和命名测试函数，这个函数是不返回值的普通 C++函数

- 函数中可以包含任何有效的 C++语句以及各种 GoogleTest 断言来检查值

- 测试的结果由断言决定，如果测试时没有任何断言失败（致命或非致命）或者测试程序崩溃，则测试成功

- 第一个参数是测试套件的名称，第二个参数是测试套件中的测试名称，这两个名称都必须是有效的 C++标识符，并且不能含有任何下划线。测试的全名由测试套件和测试名称组成，不同测试套件的测试可以有相同的测试名称

  TEST(TestSuiteName, TestName){
  ... test body ...
  }

#### 举个栗子[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#69825821)

函数 funA 有一个输入 n，返回 n^2，两个测试都属于 FunATests 测试套件，名字分别是 HandlesZeroInput 和 HandlesPositiveInput 用于测试不同的情况

```cpp
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

- 从::tesing::Test 派生一个类，它的主体内容设置为 protected，因为我们要从子类中访问夹具成员
- 在类中，声明计划使用的所有对象数据
- 如有必要，编写一个默认构造函数或者 SetUp()函数来为每个测试准备对象
- 如有必要，编写一个析构函数或者 TearDown()函数来释放测试对象数据
- 如有需要，编写函数供使用该测试夹具的测试内使用
- 注意，GoogleTest 不会在多个测试中重用同一个测试夹具对象。对于每个 TEST_F，GoogleTest 会创建一个新的测试夹具对象并立刻调用 SetUp()，运行测试主题结束后调用 TearDown()，最后删除测试夹具对象
- 使用测试夹具的时候，用 TEST_F 代替 TEST，TEST_F 的第一个参数不再是测试套件名，而是测试夹具类名，具体见下方样例

#### 举个栗子[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#978734251)

假设我们有一个类 Queue 需要进行测试，它长这样：

```cpp
template <typename E>  // E is the element type.
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

```cpp
class QueueTest : public ::testing::Test {
protected:
    void SetUp() override {
        q1_.Enqueue(1);
        q2_.Enqueue(2);
        q2_.Enqueue(3);
    }

    // void TearDown() override {}

    Queue<int> q0_;
    Queue<int> q1_;
    Queue<int> q2_;
};

```

在这里，TearDown()并不需要，因为我们并不需要进行任何清理工作，直接析构就可以了

使用测试夹具进行测试

```cpp
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

在这个栗子里，第一个 TEST_F 创建一个 QueueTest 对象 t1，t1.SetUp()后进入测试内容进行使用。测试结束后 t1.TearDown()然后销毁。对于第二个 TEST_F 进行相同的过程

## 调用测试[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#2047075719)

TEST()和 TEST_F 都会自动的隐式注册到 GoogleTest，所以并不需要为了测试再重新列举所有定义的测试
在定义测试之后，可以直接使用 RUN_ALL_TESTS()来运行所有测试，如果所有测试都通过了，它会返回 0。注意，RUNN_ALL_TESTS()会运行所有测试，哪怕这些测试来源于不同的测试套件、不同的源文件。

### 运行测试的过程[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1753488367)

- 保存所有 googletest 标志的状态
- 为第一个测试创建测试夹具对象，通过 SetUp()初始化
- 使用测试夹具对象运行测试
- 测试结束，调用 TearDown()清理夹具然后销毁夹具对象
- 恢复所有 googletest 标志的状态
- 对下一个测试重复以上步骤，直到所有测试都运行结束
  注意：不能忽略 RUN_ALL_TESTS()的返回值，否则会产生编译器错误。自动化测试服务根据退出代码来判断测试是否通过，而不是通过 stdout/sederr 来判断，所以 main()函数必须返回 RUN_ALL_TESTS();

### main()的编写[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1752583433)

大部分情况下，我们并不需要自己编写 main 方法，而是直接链接 gtest_main(注意不是 gtest)，这个链接库定义了合适的接入点会帮我们进行测试
如果想自行书写 main 方法，它需要返回 RUN_ALL_TESTS()的返回值

```cpp
int main(int argc, char **argv) {
  ::testing::InitGoogleTest(argc, argv);
  return RUN_ALL_TESTS();
}

```

在这段代码里，InitGoogleTest()的作用是解析命令行里 GoogleTest 的指令参数，这允许用户控制测试程序的行为。它必须在 RUN_ALL_TESTS 之前调用，否则命令行参数不会生效  
在旧版本里，使用的是 ParseGUnitFlags()，但是目前它已经被弃用，需要使用 InitGoogleTest()

## 后续可填坑[#](https://www.cnblogs.com/jinyunshaobing/p/16717123.html#1717359307)

`gMock`

# 【C++】GoogleTest 进阶之 gMock - 缙云烧饼 - 博客园

> [!warning] 声明
>
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [【C++】GoogleTest 进阶之 gMock](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)

---

当我们去写测试时，有些测试对象很单纯简单，例如一个函数完全不依赖于其他的对象，那么就只需要验证其输入输出是否符合预期即可。

但是如果测试对象很复杂或者依赖于其他的对象呢？例如一个函数中需要访问数据库或者消息队列，那么要想按照之前的思路去测试就必须创建好数据库和消息队列的客户端实例，然后放在该函数内使用。很多时候这种操作是很麻烦的，此时 Mock Object 就能帮助我们解决这个问题。一个 Mock Object 实现与真实对象相同的接口，它可以替代真实对象去使用，而我们要做的就是制定好该 Mock Object 的行为（调用多少次、参数、返回值等等）

参考文档：  
[gMock 官方文档](https://google.github.io/googletest/gmock_for_dummies.html)

## 安装 gMock[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3903036668)

gMock 现在与 gTest 是组合使用的关系，因此在安装 gTest 时默认就会安装 gMock，具体的安装方式见 github 上的官方说明  
[https://github.com/google/googletest/tree/main/googletest](https://github.com/google/googletest/tree/main/googletest)

## 使用 gMock 的基本思路[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3770826731)

- 首先，使用一些简单的 gMock 宏来描述想要模拟的接口，它们会实现你的 mock 类
- 然后，创建一些 mock object 然后使用 gMock 提供的语法指定好它们的行为
- 最后，运行需要使用这些 mock object 的代码，gMock 会在 mock object 的行为不符合预期的时候发现并指出

## gMock 快速入门

假设我们在做一个用户的账户系统，一个用户会有一个账户，用户提供接口 salary，账户提供接口 add 和 getAccount，在用户的 salary 内会调用账户的 add 和 getAccount 接口  
特别注意：此处的账户就是我们要 mock 的对象，它是用户的一个依赖。要想模拟它，它内部必须有虚析构函数，各个接口也建议是虚函数乃至纯虚函数。这里我的理解是，实际上 mock object 是对真实对象的代理/替换，在代理模式中比较常见的一种做法就是代理类和被代理类继承自同一个父类/接口

## 基本样例[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3275895804)

### User[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#2659273203)

```
#ifndef USER_H
#define USER_H
#include iostream
#include "account.h"

class User{
public:
    /// @brief User类的对象依赖于Account的对象
    /// @param account Account实例，被User所依赖
    User(Account *account){
        account_ = account;
    }
    /// @brief 模拟发工资的场景
    /// @param money 发的钱数
    /// @return 账户余额
    int salary(int money){
        account_-add(money);
        return account_-getAccount();
    }

private:
    Account *account_;
};

#endif //USER_H

```

### Account[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3825167995)

```
#ifndef ACCOUNT_H
#define ACCOUNT_H

class Account
{
public:
    virtual ~Account() {}
    virtual void add(int money) = 0;
    virtual int getAccount() = 0;
};

#endif //ACCOUNT_H

```

## mock 类编写[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3708843258)

我们要 mock 的是 Account 的一个对象，所以书写 mock 类实现 Account 接口

```
#ifndef MOCK_ACCOUNT_H
#define MOCK_ACCOUNT_H
#include "account.h"
#include gmock/gmock.h

class MockAccount : public Account
{
public:
    MOCK_METHOD(void, add, (int money), (override));
    MOCK_METHOD(int, getAccount, (), (override));
};

#endif // MOCK_ACCOUNT_H

```

其中的关键部分在于 MOCK_METHOD，很多老的教程中会使用 MOCK_METHOD0、MOCK_METHOD1...这些宏，它们分别代表 0 参数、1 参数、2 参数的接口。在新的官方教程中没有这种写法，统一都是 MOCK_METHOD，内部有四个参数

- 接口返回值类型
- 接口名
- 接口形参列表，注意，如果有泛型，需要多加一层括号，例如`MOCK_METHOD(void, funName, (int, (map<int,string>)),(override))`
- 为生成的 mock object 的方法添加关键字（如果是 override 这个参数其实可以不写，但是如果接口是 const 的，就必须写 const 关键字了）

### mock 类放在哪[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#4027525425)

按照 google 的建议，除非整个接口就是你自己持有的，否则 mock 类不要放在 xx_test 下，因为一旦 Account 接口被它的所有者改变，MockAccount 也必须改变才能继续使用
一般来说，我们不应该 mock 不是自己持有的接口。如果真的需要 mock 不是自己持有的，mock 对象的目录或者 testing 的子目录下创建一个.h 文件和一个 cc_library with testonly=true，这样一来，每个人都可以使用同一个地方定义的 mock 类

## mock 的使用[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3283843717)

创建好 mock 类之后，要使用它一般分以下几步

- 创建 Mock Object
- 规定 Mock Object 的预期行为
- 使用 Mock Object 测试业务代码，业务代码部分可以使用 gTest 的各种断言
- 一旦 Mock Object 的方法被调用的情况与前面规定的预期行为不符，测试就会不通过（在 Mock Object 被析构时也会再次检查）
  其中比较核心代码有两部分：规定 Mock Object 的预期行为和业务代码测试，前者将会在下面详细展开，后者可以参考 Google Test 那篇文章
  [google test 入门指南](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)

### 样例[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#1045523345)

user_test.cc 文件

```
#include gtest/gtest.h
#include gmock/gmock.h
#include "user.h"
#include "mock_account.h"

using ::testing::AtLeast;
using ::testing::Return;

TEST(UserTest, SalaryIsOK)
{
    MockAccount mAccount;//创建Mock Object
    EXPECT_CALL(mAccount, add(100)).Times(AtLeast(1));
    EXPECT_CALL(mAccount, getAccount()).Times(AtLeast(1));//规范Mock Object的行为，此处是说该mock对象的getAccount()方法至少被调用1次
    User user(mAccount);//将Mock Obejct注入到user中使用（依赖注入）
    int res = user.salary(100);//测试User业务逻辑
    ASSERT_GE(res, 0);//gTest的断言，res大于等于0则通过
}

```

## 编译运行[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#4022897349)

这里我使用 CMake 来做构建，注意 gTest 和 gMock 需要 C++14 及以上，在链接时直接链接 gtest_main，这样就不需要自己写 main 方法了

### CMakeLists.txt[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#2659422929)

```
cmake_minimum_required(VERSION 3.14)

project(user LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 14)

enable_testing()

find_package(GTest REQUIRED)

add_executable(test_user "${PROJECT_SOURCE_DIR}/user_test.cc")
target_link_libraries(test_user GTest::gtest_main gmock)

include(GoogleTest)
gtest_discover_tests(test_user)

```

### 运行结果[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#90565185)

```
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from UserTest
[ RUN      ] UserTest.SalaryIsOK
[       OK ] UserTest.SalaryIsOK (0 ms)
[----------] 1 test from UserTest (0 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (0 ms total)
[  PASSED  ] 1 test.

```

测试通过了

## 设置预期行为

使用 Mock 最核心的点就在于给一个 Mock Object 规定好预期行为。这部分也是我们需要斟酌的地方。预期行为是设置的严格一点还是松一点全看需求。

## 一般语法[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#252554791)

在 gMock 中使用 EXPECT_CALL()这个断言宏去设置一个 Mock Object 的预期行为
`EXPECT_CALL(mock_object, mock_method(params))...`
其中有两个核心参数，第一个是 mock_object，第二个是 mock_object 中的方法，如果有参数同时要把参数传进去，注意，不同参数的 mock_method 可以认为是不同的预期行为
...部分可以填写很多链式调用的逻辑来指定该对象该方法的调用运行情况

```
using ::testing::Return;
...
EXPECT_CALL(mock_object, mock_method(params)).Times(5).WillOnce(Return(100)).WillOnce(Return(150)).WillRepeatedly(Return(200));

```

在以上的栗子中，为该对象的该方法指定了四个预期行为：
首先它会被调用 5 次，第一次返回 100，第二次返回 150，之后的每次都返回 200

### 关于方法的参数 params[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#540123511)

#### 不确定参数值[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3041163831)

很多时候我们不想让参数值变得固定，这个时候可以使用::testing::\_来表示任意参数值

```
using ::testing::_;
...
EXPECT_CALL(mock_object, mock_method(_))...

```

如果参数有多个，而且全部都是不确定参数值，我们可以这样写：
`EXPECT_CALL(mock_object, mock_method)...`

#### 参数值需要满足某种条件[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#2356712581)

对于传入确切参数的情况，相当于是使用 Eq(100)，以下的前两个写法是等价的

```
EXPECT_CALL(mock_object, mock_method(100))...
EXPECT_CALL(mock_object, mock_method(Eq(100)))...
EXPECT_CALL(mock_object, mock_method(Ge(50)))...//参数大于等于50的所有情况

```

那么除了 Eq 之外，gMock 还提供了其他的一些，可以自行探索

## 预期调用的次数[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#2624830972)

在预期行为部分，我们可以手动写上 Times(3)来指定它需要被调用 3 次，多或少都会导致测试不通过。
AtLeast()是在次数预期里比较常用的一个方法，如果是 Times(3)，那方法必须调用且只能调用 3 次，但是如果是 Times(AtLeast(3))，那么就是至少调用 3 次的意思了。
我们也可以省略 Times()，此时 gMock 会默认根据我们写的链式调用情况添加 Times()，具体规则见下面的部分。

关于次数的预期，核心的方法有两个，分别是 WillOnce()和 WillRepeatedly()，前者表示调用一次，后者表示重复调用，它们可以组合使用，使用的具体规则如下：

- 如果没有 WillOnce 和 WillRepeatedly()，则默认添加 Times(1)
- 如果有 n 个 WillOnce，没有 WillRepeatedly()，则默认添加 Times(n)
- 如果有 n 个 WillOnce，有一个 WillRepeatedly()，则默认添加 Times(AtLeast(n))，这意味着 WillRepeatedly 可以匹配调用 0 次的情况

## 预期发生的行为[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3100169290)

一个 mock object 的所有方法中都没有具体的实现体，那么它的返回值情况是怎么样设定预期的呢？
默认情况下我们如果不设定返回值预期，也会有默认的返回值（只是我们不使用而已），bool 会返回 false，int 等等的会返回 0.
如果需要它有指定的预期返回值，我们可以在次数预期中加入返回值预期

```
using ::testing::Return;
...
EXPECT_CALL(mock_object, mock_method(params))
.Times(5)
.WillOnce(Return(100))
.WillOnce(Return(150))
.WillRepeatedly(Return(200));

```

在以上的栗子中，为该对象的该方法指定了四个预期行为：
首先它会被调用 5 次，第一次返回 100，第二次返回 150，之后的每次都返回 200
如果去掉 Times(5)，那就是第一次返回 100，第二次返回 150，之后每次都返回 200，调用次数不少于 2 次（WillRepeatedly 可以调用 0 次）

## 预期发生顺序[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3540544923)

默认情况下，我们设定好一个 mock 对象的多个预期行为时，是不关心它们的发生顺序的。例如以下代码中，先调用 PenDown()或者先调用了 Forward(100)都是无所谓的，都能通过测试：

```
EXPECT_CALL(turtle, PenDown());
EXPECT_CALL(turtle, Forward(100));

```

那么如果我们想指定预期发生顺序，我们需要创建 InSequence 对象，该对象创建处的代码块（scope）内的所有预期行为都必须按照声明顺序发生。

```
using ::testing::InSequence;
...
TEST(FooTest, DrawsLineSegment) {
  ...
  {
    InSequence seq;

    EXPECT_CALL(turtle, PenDown());
    EXPECT_CALL(turtle, Forward(100));
    EXPECT_CALL(turtle, PenUp());
  }
  Foo();
}

```

## 一些需要注意的点[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#1878194304)

### 预期行为的一次性写入[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#322437472)

EXPECT_CALL()的链式调用中所有预期都会一次性写入，这意味着不要在链式调用中写运算，可能不会满足预期需求。举个栗子，以下并不能匹配返回 100，101，102...而是只匹配返回 100 的情况，因为++是在预期行为被设定好之后才发生

```
using ::testing::Return;
...
int n = 100;
EXPECT_CALL(turtle, GetX())
    .Times(4)
    .WillRepeatedly(Return(n++));

```

### mock 对象方法的预期行为多重定义[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#169742846)

在前面，我们看到的都是单对象单方法仅有 1 种预期行为定义的情况，如果定义了多个呢？例如：

```
using ::testing::_;
...
EXPECT_CALL(turtle, Forward(_));  // #1
EXPECT_CALL(turtle, Forward(10))  // #2
    .Times(2);

```

假如我们在后面调用了三次 Forwar(10)，那么测试会报错不通过。如果调用了两次 Forward(10)，一次 Forward(20)，那么测试会通过。

### 预期行为粘连问题[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#1477489468)

gMock 中的预期行为默认是粘连的，它们会一直保持存活状态（哪怕它所规定的预期行为已经完全被匹配过了）
例如以下的情况可能会出错，这种写法下可能最初想的是返回 50、40、30、20、10 的调用各一次，但是发生调用时就报错了（例如第一次调用返回 10，而第二次调用返回 20 时，预期返回 10 的那个也还存活着会报错(不满足 Once 了)）

```
using ::testing::Return;
...
for (int i = 5; i  0; i--) {
  EXPECT_CALL(turtle, GetX())
      .WillOnce(Return(10*i));
}

```

我的理解：所谓预期行为(Expectations)，它所针对的是**_一个 Mock 对象的一个方法在某一种参数_**情况下的行为，如果不显式的声明让它在被满足后退休，它会一直存活，一直干活...
要想解决上面的问题，可以显式的声明饱和退休

```
using ::testing::Return;
...
for (int i = n; i  0; i--) {
  EXPECT_CALL(turtle, GetX())
      .WillOnce(Return(10*i))
      .RetiresOnSaturation();
}

```

在以上这种写法下，每个.WillOnce()一旦被满足就会退休，后面发生了什么它不会去管了，也就不会报错了
当然这也可以结合前面的预期发生顺序来写，以下的写法意味着第一次调用返回 10，第二次返回 20.....

```
using ::testing::InSequence;
using ::testing::Return;
...
{
  InSequence s;

  for (int i = 1; i = n; i++) {
    EXPECT_CALL(turtle, GetX())
        .WillOnce(Return(10*i))
        .RetiresOnSaturation();
  }
}

```

## 后续可填坑

gMock 进阶指南
