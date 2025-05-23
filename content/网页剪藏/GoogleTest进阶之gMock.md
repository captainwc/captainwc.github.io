---
title: GoogleTest进阶之gMock | [转载](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)
date: 2025-04-16
tags: [GoogleTest]
categories: ["博客剪藏"]
series: []
author: 缙云烧饼
---

# 【C++】GoogleTest进阶之gMock - 缙云烧饼 - 博客园

> [!warning] 声明
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [【C++】GoogleTest进阶之gMock](https://www.cnblogs.com/jinyunshaobing/p/16804309.html)

---

当我们去写测试时，有些测试对象很单纯简单，例如一个函数完全不依赖于其他的对象，那么就只需要验证其输入输出是否符合预期即可。

但是如果测试对象很复杂或者依赖于其他的对象呢？例如一个函数中需要访问数据库或者消息队列，那么要想按照之前的思路去测试就必须创建好数据库和消息队列的客户端实例，然后放在该函数内使用。很多时候这种操作是很麻烦的，此时Mock Object就能帮助我们解决这个问题。一个Mock Object实现与真实对象相同的接口，它可以替代真实对象去使用，而我们要做的就是制定好该Mock Object的行为（调用多少次、参数、返回值等等）

参考文档：  
[gMock官方文档](https://google.github.io/googletest/gmock_for_dummies.html)

## 安装gMock[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3903036668)

gMock现在与gTest是组合使用的关系，因此在安装gTest时默认就会安装gMock，具体的安装方式见github上的官方说明  
[https://github.com/google/googletest/tree/main/googletest](https://github.com/google/googletest/tree/main/googletest)

## 使用gMock的基本思路[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3770826731)

-   首先，使用一些简单的gMock宏来描述想要模拟的接口，它们会实现你的mock类
-   然后，创建一些mock object然后使用gMock提供的语法指定好它们的行为
-   最后，运行需要使用这些mock object的代码，gMock会在mock object的行为不符合预期的时候发现并指出

## gMock快速入门

假设我们在做一个用户的账户系统，一个用户会有一个账户，用户提供接口salary，账户提供接口add和getAccount，在用户的salary内会调用账户的add和getAccount接口  
特别注意：此处的账户就是我们要mock的对象，它是用户的一个依赖。要想模拟它，它内部必须有虚析构函数，各个接口也建议是虚函数乃至纯虚函数。这里我的理解是，实际上mock object是对真实对象的代理/替换，在代理模式中比较常见的一种做法就是代理类和被代理类继承自同一个父类/接口

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

## mock类编写[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3708843258)

我们要mock的是Account的一个对象，所以书写mock类实现Account接口

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

其中的关键部分在于MOCK\_METHOD，很多老的教程中会使用MOCK\_METHOD0、MOCK\_METHOD1...这些宏，它们分别代表0参数、1参数、2参数的接口。在新的官方教程中没有这种写法，统一都是MOCK\_METHOD，内部有四个参数

-   接口返回值类型
-   接口名
-   接口形参列表，注意，如果有泛型，需要多加一层括号，例如`MOCK_METHOD(void, funName, (int, (map<int,string>)),(override))`
-   为生成的mock object的方法添加关键字（如果是override这个参数其实可以不写，但是如果接口是const的，就必须写const关键字了）

### mock类放在哪[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#4027525425)

按照google的建议，除非整个接口就是你自己持有的，否则mock类不要放在xx\_test下，因为一旦Account接口被它的所有者改变，MockAccount也必须改变才能继续使用
一般来说，我们不应该mock不是自己持有的接口。如果真的需要mock不是自己持有的，mock对象的目录或者testing的子目录下创建一个.h文件和一个 cc\_library with testonly=true，这样一来，每个人都可以使用同一个地方定义的mock类

## mock的使用[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3283843717)

创建好mock类之后，要使用它一般分以下几步

-   创建Mock Object
-   规定Mock Object的预期行为
-   使用Mock Object测试业务代码，业务代码部分可以使用gTest的各种断言
-   一旦Mock Object的方法被调用的情况与前面规定的预期行为不符，测试就会不通过（在Mock Object被析构时也会再次检查）
    其中比较核心代码有两部分：规定Mock Object的预期行为和业务代码测试，前者将会在下面详细展开，后者可以参考Google Test那篇文章
    [google test入门指南](https://www.cnblogs.com/jinyunshaobing/p/16717123.html)

### 样例[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#1045523345)

user\_test.cc文件

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

这里我使用CMake来做构建，注意gTest和gMock需要C++14及以上，在链接时直接链接gtest\_main，这样就不需要自己写main方法了

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

使用Mock最核心的点就在于给一个Mock Object规定好预期行为。这部分也是我们需要斟酌的地方。预期行为是设置的严格一点还是松一点全看需求。

## 一般语法[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#252554791)

在gMock中使用EXPECT\_CALL()这个断言宏去设置一个Mock Object的预期行为
`EXPECT_CALL(mock_object, mock_method(params))...`
其中有两个核心参数，第一个是mock\_object，第二个是mock\_object中的方法，如果有参数同时要把参数传进去，注意，不同参数的mock\_method可以认为是不同的预期行为
...部分可以填写很多链式调用的逻辑来指定该对象该方法的调用运行情况

```
using ::testing::Return;
...
EXPECT_CALL(mock_object, mock_method(params)).Times(5).WillOnce(Return(100)).WillOnce(Return(150)).WillRepeatedly(Return(200));

```

在以上的栗子中，为该对象的该方法指定了四个预期行为：
首先它会被调用5次，第一次返回100，第二次返回150，之后的每次都返回200

### 关于方法的参数params[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#540123511)

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

对于传入确切参数的情况，相当于是使用Eq(100)，以下的前两个写法是等价的

```
EXPECT_CALL(mock_object, mock_method(100))...
EXPECT_CALL(mock_object, mock_method(Eq(100)))...
EXPECT_CALL(mock_object, mock_method(Ge(50)))...//参数大于等于50的所有情况

```

那么除了Eq之外，gMock还提供了其他的一些，可以自行探索

## 预期调用的次数[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#2624830972)

在预期行为部分，我们可以手动写上Times(3)来指定它需要被调用3次，多或少都会导致测试不通过。
AtLeast()是在次数预期里比较常用的一个方法，如果是Times(3)，那方法必须调用且只能调用3次，但是如果是Times(AtLeast(3))，那么就是至少调用3次的意思了。
我们也可以省略Times()，此时gMock会默认根据我们写的链式调用情况添加Times()，具体规则见下面的部分。

关于次数的预期，核心的方法有两个，分别是WillOnce()和WillRepeatedly()，前者表示调用一次，后者表示重复调用，它们可以组合使用，使用的具体规则如下：

-   如果没有WillOnce和WillRepeatedly()，则默认添加Times(1)
-   如果有n个WillOnce，没有WillRepeatedly()，则默认添加Times(n)
-   如果有n个WillOnce，有一个WillRepeatedly()，则默认添加Times(AtLeast(n))，这意味着WillRepeatedly可以匹配调用0次的情况

## 预期发生的行为[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3100169290)

一个mock object的所有方法中都没有具体的实现体，那么它的返回值情况是怎么样设定预期的呢？
默认情况下我们如果不设定返回值预期，也会有默认的返回值（只是我们不使用而已），bool会返回false，int等等的会返回0.
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
首先它会被调用5次，第一次返回100，第二次返回150，之后的每次都返回200
如果去掉Times(5)，那就是第一次返回100，第二次返回150，之后每次都返回200，调用次数不少于2次（WillRepeatedly可以调用0次）

## 预期发生顺序[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#3540544923)

默认情况下，我们设定好一个mock对象的多个预期行为时，是不关心它们的发生顺序的。例如以下代码中，先调用PenDown()或者先调用了Forward(100)都是无所谓的，都能通过测试：

```
EXPECT_CALL(turtle, PenDown());
EXPECT_CALL(turtle, Forward(100));

```

那么如果我们想指定预期发生顺序，我们需要创建InSequence对象，该对象创建处的代码块（scope）内的所有预期行为都必须按照声明顺序发生。

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

EXPECT\_CALL()的链式调用中所有预期都会一次性写入，这意味着不要在链式调用中写运算，可能不会满足预期需求。举个栗子，以下并不能匹配返回100，101，102...而是只匹配返回100的情况，因为++是在预期行为被设定好之后才发生

```
using ::testing::Return;
...
int n = 100;
EXPECT_CALL(turtle, GetX())
    .Times(4)
    .WillRepeatedly(Return(n++));

```

### mock对象方法的预期行为多重定义[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#169742846)

在前面，我们看到的都是单对象单方法仅有1种预期行为定义的情况，如果定义了多个呢？例如：

```
using ::testing::_;
...
EXPECT_CALL(turtle, Forward(_));  // #1
EXPECT_CALL(turtle, Forward(10))  // #2
    .Times(2);

```

假如我们在后面调用了三次Forwar(10)，那么测试会报错不通过。如果调用了两次Forward(10)，一次Forward(20)，那么测试会通过。

### 预期行为粘连问题[#](https://www.cnblogs.com/jinyunshaobing/p/16804309.html#1477489468)

gMock中的预期行为默认是粘连的，它们会一直保持存活状态（哪怕它所规定的预期行为已经完全被匹配过了）
例如以下的情况可能会出错，这种写法下可能最初想的是返回50、40、30、20、10的调用各一次，但是发生调用时就报错了（例如第一次调用返回10，而第二次调用返回20时，预期返回10的那个也还存活着会报错(不满足Once了)）

```
using ::testing::Return;
...
for (int i = 5; i  0; i--) {
  EXPECT_CALL(turtle, GetX())
      .WillOnce(Return(10*i));
}

```

我的理解：所谓预期行为(Expectations)，它所针对的是***一个Mock对象的一个方法在某一种参数***情况下的行为，如果不显式的声明让它在被满足后退休，它会一直存活，一直干活...
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
当然这也可以结合前面的预期发生顺序来写，以下的写法意味着第一次调用返回10，第二次返回20.....

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

gMock进阶指南
