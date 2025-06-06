---
title: GTest / GMock 单元测试实践手册 | [转载](https://imageslr.com/2023/gtest.html)
date: 2025-04-16
tags: [GoogleTest]
categories: ["博客剪藏"]
series: []
author: Images
---

# GTest / GMock 单元测试实践手册

> [!warning] 声明
> - 本文由插件[Markdown Web Clipper](https://chromewebstore.google.com/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi?pli=1)自动提取网页正文而来，并未获取原作者授权！
> - 本文仅作个人存档学习使用，如有任何疑问/需求请查看[原文](https://imageslr.com/2023/gtest.html)！
> - 如有侵权，请联系本人立刻删除！
> - 原文链接: [💻【C++】研发基本功 - GTest / GMock 单元测试实践手册](https://imageslr.com/2023/gtest.html)

---

## 一、前言

📌 本文来自 Ads Infra 内部分享，[欢迎加入 👉🏻](https://imageslr.com/ads-infra)

作为架构部门，我们的很多核心仓库都是 C++ 编写，目前基本都有 80% 的增量单测覆盖率卡点。编写单测的好处不言而喻：通过构造各种 case，可以发现空指针、大数越界等肉眼不容易发现的 bug。此外，单测也可以在不引流的情况下，测试功能是否正确。因此，编写单测是必要的，**为新增代码补充单测是每个研发同学的基本功**。

但是，**C++ 编写单测也是最麻烦的**。根据日常观察，大部分同学没有系统地写过单测，基本依赖照抄现有代码，单测写得慢，且不标准。此外，没有掌握常见的调试技巧，主要通过 `cout` 逐行打日志和重新编译来定位问题，进一步降低了单测编写效率。

本文旨在解决上述问题：

+   本文的**受众**：开发过 C++ 模块、知道 GTest / GMock 的基本使用、编写过单测代码、能完成简单场景的单测需求、但对于复杂的代码则无从下手的同学；写单测感觉很不爽、知道痛点在哪儿、但不知道如何解决的同学；平时 review 代码只看业务逻辑、不看单测合理性的 reviewer 同学。
+   本文的**内容**：分享 GTest、GMock 的核心用法、常用技巧 + 单测编写的思路 + GDB 调试方法。只讲最必要的、最常用的内容，能覆盖大部分场景的单测需求。不讲花活儿，但会引用外部文档供扩展阅读。
+   本文的**目标**：(1) 通过分享上述内容，让大家系统掌握单测编写和调试方法，**写起来更丝滑**，查问题更高效。(2) 对齐认知，**让单测真正发挥作用**。知道什么是正确的、有效的、好的单测，并写出这样的单测。知道什么是无效的、差的单测，并避免写出 / 合入这样的单测。以对待线上代码的标准来对待单测。

## 二、Hello, world：从一个单测示例开始

为下面这段代码编写单测：

```cpp
int check_threshold(RequestContext ctx, Ad ad) {
    if (ad.pricing == CPT) {
        return -1;
    }
    if (ad.pricing == CPM) {
        if (ctx.params.use_stable_thresh || ad.use_stable_thresh()) {
            return 2;
        }
        return ctx.get_threshold(ad);
    }
    ...
}
```

编写出来的单测代码可能是这样的：

```cpp
// Case 1
TEST(ChecksThresholdTest, CheckThreshForCPT) {
    // 1. 构造输入
    RequestContext ctx;
    Ad ad;
    ad.pricing = CPT;

    // 2. 检查输出
    EXPECT_EQ(check_threshold(ctx, ad), -1);
}

// Case 2
TEST(CheckThresholdTest, CheckThreshForCPM) {
    // 1. 构造输入
    MockRequestContext ctx;  // 这是一个 GMock 对象

    // 使用大括号分隔不同 case
    {
        Ad ad;
        ad.pricing = CPM;
        ctx.params.use_stable_thresh = true;
        EXPECT_EQ(check_threshold(ctx, ad), 2);
        ctx.params.use_stable_thresh = false;  // reset
    }

    // 上面对于 if(a||b) 的分支来说，只达到了 50% 分支覆盖率
    // 尝试达到 100% 覆盖率
    {
        Ad ad;
        ad.pricing = CPM;
        ad.should_use_stable_thresh = true; // 假设 ad.use_stable_thresh() 函数内部用了这个字段来判断
        ASSERT_TRUE(ad.use_stable_thresh()); // 上一行修改是为了控制这个函数的结果，所以最好 ASSERT 一下
        EXPECT_EQ(check_threshold(ctx, ad), 2);
    }

    // 默认分支
    {
        Ad ad;
        ad.pricing = CPM;
        EXPECT_CALL(ctx, get_threshold).WillOnce(Return(100));
        EXPECT_EQ(check_threshold(ctx, ad), 100);
    }
}
```

涉及到的方面：

+   构造输入：手动
+   检测输出：EXPECT
+   控制外部函数的返回值：EXPECT\_CALL
+   分支覆盖率：对于 `if(a||b)`，需要分别构造 `a == true` 和 `b == true` 两个 case。

## 三、GTest

### 基本概念：Test Suite、Test Case

#### Test Suite

```cpp
TEST(TestSuiteName, TestCaseName) {
    // 单测代码
    EXPECT_EQ(func(0), 0);
}
```

+   `TestSuiteName` 用来汇总 test case，相关的 test case 应该是相同的 `TestSuiteName`。一个文件里只能有一个 `TestSuiteName`，建议命名为这个文件测试的类名。
+   `TestCaseName` 是测试用例的名称。建议有意义，比如“被测试的函数名称”，或者被测试的函数名的不同输入的情况。
+   `TestSuiteName_TestCaseName` 的组合应该是唯一的。
+   GTest 生成的类名是带下划线的，所以上面这些名字里不建议有下划线。

#### Test Case

一个 `TEST(Foo, Bar){...}` 就是一个 Test Case。考虑到构造输入有成本，通常一个 `TEST(Foo, Bar)` 里会反复修改输入，构造多个 case，测试不同的执行流程。这里建议**用大括号分隔不同的 case**，整体更条理。另一个好处在于：**每个变量的生命周期仅限于大括号内**。这样就可以反复使用相同的变量名，而不用给变量名编号。

```cpp
TEST(Foo, bar) {
    // case 1: enable = true
    {
        Context ctx;
        params.enable_refresh = true;
        ASSERT_EQ(ctx->is_enable_fresh(), true);
    }

    // case 2: enable = false
    {
        Context ctx;
        params.enable_refresh = false;
        ASSERT_EQ(ctx->is_enable_fresh(), false);
    }
}
```

此外，如果待测函数十分复杂，建议拆分多个 `TEST(Foo, Bar){...}`，避免 Test Case 代码膨胀。比如：

```cpp
// 待测函数
int foo(Ad ad) {
    if (!ad)
        return -1;
    switch(ad.pricing) {
        case CPT:
            ...
        case GD:
            ...
    }
}
// 输入为空
TEST(Foo, IsNil) {
    ...
}

// 输入是 CPT 广告
TEST(Foo, IsCpt) {
    ...
}

// 输入是 GD 广告
TEST(Foo, IsGd) {
    ...
}
```

### 善用 TEST\_F，避免写重复的代码

GTest 提供了多种测试宏，其中最为常用的是 `TEST`、`TEST_F`，它们的区别如下：

1.  `TEST`：这是最基本的测试宏，代表一个最小测试单元。在执行 `TEST` 宏时，gtest 会为每个 `TEST` 定义一个独立的实例，使其互相隔离，避免对同一个变量进行修改或共享等可能带来的副作用。
2.  **`TEST_F`**：这是 TestFixture 的测试宏。TestFixture 是一个类，可以在**多个****测试用例****之间共享数据结构或方法**。对于同一个 Test Suite 的所有 Test Cases，会创建一个 TestFixture 对象，其 SetUp 函数会在每个 Test Case 执行之前被调用，而 TearDown 函数则会在每个 Test Case 执行之后被调用。

使用 Test Fixture Class，可以避免写重复的代码：

+   将共享的变量作为成员变量，可以在 test case 中直接访问；变量初始化、回收逻辑放到 SetUp()、TearDown()
+   提供公共方法，可以在 test case 中直接使用

示例代码：

```cpp
class FooTest : public ::testing::Test {
protected:
  // 在每个 Test Case 运行开始前，都会调用 SetUp，这里可以初始化
  void SetUp() override {
    ctx = RequestContext("123");
  }

  // 在每个 Test Case 运行结束后，都会调用 TearDown
  void TearDown() override {}

  // 所有 Test Case 都可以直接访问这些变量和方法
  Ad new_ad() { return Ad(ctx); }
  RequestContext ctx;
};

TEST_F(FooTest, enable_foo) { // 这里会初始化 FooTest 对象
  ctx->params.enable_foo = true; // 可以访问 FooTest 中的变量
  auto item = new_ad(); // 可以调用 FooTest 中的方法
  ...
}

// 每个 test case 都是独立的，这里会初始化另一个 FooTest 对象
TEST_F(FooTest, OnTestProgramStart) {
  // ...
}
```

实际使用技巧：

+   共享一些变量，比如预先初始化好单测依赖的 Context 对象
+   封装一些公共方法，尤其是构造通用数据对象的方法
+   派生更多子类：
    +   建议每个服务有一个公共的 `BaseTestFixture`，继承 `::testing::Test`，封装全局通用的方法
    +   其他单测可以再继承 `BaseTestFixture`，提供某个测试场景下共享变量和方法

### 断言：EXPECT 与 ASSERT 宏

用来判断某个变量的值是否符合预期。前者在校验失败时会打印失败信息，然后继续运行。后者会直接终止。

💡 **正确使用 ASSERT 和 EXPECT 前缀：**

+   如果某个判断不通过时，会影响后续步骤，要使用 ASSERT。常见的是空指针，或者数组访问越界。

    > 如果某个 EXPECT 失败会导致后续一连串 EXPECT 失败，那么第一个 EXPECT 应该换成 ASSERT。这就像编译时的报错信息，往往只有第一个是有用的，其他错误都只是刷屏。

+   其他情况，可以使用 EXPECT，尽可能多测试几个用例。

下面罗列一些最常用的 EXPECT 宏，把前缀换成 ASSERT 也可以使用。完整列表见[文档](http://google.github.io/googletest/reference/assertions.html)。

#### (1) 一元 / 二元比较

+   `EXPECT_TRUE(foo)`、`EXPECT_FALSE(foo)`：判断一个变量是否是 true 或 false。
+   二元比较：
    +   `EXPECT_EQ(foo, bar)`：判断两个变量是否相等。
        +   只要重载了`==`运算符就可以，所以也可以判断两个 vector 是否相等。
    +   `EXPECT_NE(foo, bar)`：判断 foo != bar。
    +   `EXPECT_LT(foo, bar)`：foo < bar，less than。
    +   `EXPECT_LE(foo, bar)`: foo ≤ bar，less or equal。
    +   `EXPECT_GT(foo, bar)`：foo > bar，greater than。
    +   `EXPECT_GE(foo, bar)`: foo ≥ bar，greater or equal。

#### (2) 浮点数比较

+   `EXPECT_DOUBLE_EQ(foo, 0.1)`：浮点数比较不能使用 `EXPECT_EQ`。
+   `EXPECT_FLOAT_EQ`：同上。
+   `EXPECT_NEAR(foo, bar, abs_val)`：判断两个数字的绝对值相差是否小于等于 abs\_val。

    ```cpp
    double pi = 3.141592653589793238;
    double approx_pi = 3.14;
    EXPECT_NEAR(pi, approx_pi, 0.01);  // 检测两个 π 值，允许误差在 0.01 以内
    ```


#### (3) 字符串比较

+   `EXPECT_STREQ(foo, "bar")`：判断两个字符串是否相等。这里比较的是 C 风格的字符串，即 `char*`。如果某个对象是 `std::string`，需要调用其 `c_str()` 方法。如果两个对象都是 `std::string`，可以使用 `EXPECT_EQ`。

    ```cpp
    std::string str = "hello";
    EXPECT_STREQ(str.c_str(), "hello");
    ```

+   `EXPECT_STRNE`：不相等。
+   `EXPECT_STRCASEEQ`：忽略大小写，是否相等。
+   `EXPECT_STRCASENE`：忽略大小写，是否相等。

#### (4) 其他

+   `EXPECT_THROW`/`EXPECT_NO_THROW`：处理异常，不要自行`try-catch`。

+   `EXPECT_THAT`：这实际上是 GMock 提供的宏，需要和 [匹配器 Matcher](#matcher) 配合使用，详见下文。这是**写出优雅单测的必备技能**。

+   `EXPECT_CALL`：同样是 GMock 提供的宏，判断函数被调用的次数，详见下文。

+   `EXPECT_PRED(func, arg1, arg2, ...)`：自定义一个返回 bool 的谓词，传给该谓词一系列参数，判断是否返回 true。如果失败，会依次打印传入的参数值。

    ```cpp
    std::vector<int> vec = {1, 2, 3};
    EXPECT_PRED([](const std::vector<int>& v) { return v.size() == 3; }, vec);
    ```


#### 断言失败时输出自定义信息

默认当 EXPECT 或 ASSERT 失败时，GTest 会打印预期值和实际值：

```cpp
EXPECT_EQ(4, 3);

/path/to/test.cpp:7: Failure
Expected equality of these values:
  4
  result
    Which is: 3
```

但有时候，这些信息不够定位具体的失败原因。可以像这样**输出自定义日志**，这些日志仅在 EXPECT 失败时才打印：

```cpp
for (int i = 0; i < x.size(); i++) {
  EXPECT_EQ(x[i], y[i]) << "x and y differ at index " << i;
}
```

还可以**在 TestFixture 中封装 debug 函数**，输出更详细的信息。比如，被测对象中包含了一些位图 std::bitset。在 EXPECT 失败时打印位图信息，有助于排查单测失败的原因：

```cpp
class BitsetTest : public BaseTest {
public:
  std::string debug_message() {
      stringstream ss;
      for (const auto& iter : bitset_maps) {
        ss << "bitset: name=" << iter.first << " value=" << iter.second << std::endl;
      }
      return ss.string();
  }
}

TEST_F(BitsetTest, validate) {
    // ...
    EXPECT_TRUE(validate(ad, pos)) << debug_message();
}
```

## 四、GMock

> [!info]
>
> 使用GMock要先明白GMock是做什么的。它模拟了接口的行为，所以如果你验证接口的结果的话，那肯定怎么验证都是对的。这会接口还不存在呢，它验证的是你的函数与接口的交互方式，比如
>
> 1. **被测代码是否正确调用了依赖接口**：验证被测代码在特定条件下是否调用了正确的接口方法。
> 2. **调用顺序是否符合预期**：验证方法调用的顺序是否正确。
> 3. **调用次数是否符合预期**：验证方法被调用的次数是否符合预期。
> 4. **调用参数是否正确**：验证调用接口时传递的参数是否正确。
> 5. **被测代码对接口返回值的响应是否正确**：我们设置模拟返回值，然后验证被测代码是否正确处理了这些返回值。

> [!idea]
>
> 也就是说，你写测试的时候，脑袋瓜子是清醒的，你知道你的函数**应该**怎么使用接口。比如数据库连接场景，你写好了客户端，但是数据库封装类Database还没有实现。你想验证的只是你的客户端行为是否符合预期，
>
> 比如一次正确的查询的**预期**过程应该是：
>
> 1. 调用`connect`创建连接
> 2. 调用`query`查询
> 3. 调用`disconnect`释放连接
>
> **那么你的函数中是否调用了，以及是否是按顺序调用了这些呢？**再比如一次错误的连接，那么就应该校验非法，然后就应该调用接口中的`HandleBadMan`函数，那么是否调用了呢？明白没，重点不是在接口的结果是否正确，不是验证connect函数是否能帮你连接到数据库，而是验证你写的客户端代码，是否正确执行了接口的调用流程。

### 原理与示例

GMock 是 Google Test 提供的一个 C++ mocking 框架，可以用于创建虚拟的对象和方法。GMock 的原理是利用 C++ 的多态特性，覆盖 virtual 函数，将函数调用转发到相应的 mock 函数中。

GMock 基本使用流程如下：

1.  继承被 mock 的类，定义一个新的 Mock 类
2.  使用 GMock 提供的 mock 宏，用于实现 Mock 类的方法
3.  通过上面的 Mock 类，创建一个模拟对象
4.  通过 EXPECT\_CALL 宏，控制模拟方法的返回值

```cpp
#include <gmock/gmock.h>

class FooInterface {
public:
    virtual int foo(int) { return 3; } // ① 需要定义为虚函数
};

// ② 需要声明一个 Mock 类，并声明 MOCK_METHOD
class MockFoo: public FooInterface {
public:
    MOCK_METHOD1(foo, int(int)); // 记录函数名字 + 类型信息到 MockFoo 对象上
};

using ::testing::Return;
TEST(FooInterface, foo) {
    MockFoo mockFoo; // ③ 需要声明 Mock 出来的子类
    EXPECT_CALL(mockFoo, foo(3)).Times(1). // 自定义函数返回值
                WillOnce(Return(10));
    EXPECT_EQ(mockFoo.foo(3), 10); // return 10
}
```

使用 GMock 有**两个前提**：

(1) 被 Mock 的方法必须是虚函数；

(2) 必须替换掉被 mock 的对象，将其赋值为 mock 对象。

其**不足之处**：

(1) 使用 GMock 时必须定义一个 Mock class；

(2) 如果想 mock 非虚函数，需要变更函数签名，这可能不太安全；

(3) 对于函数内部的局部变量，无法赋值，也就无法 mock。

### EXPECT\_CALL

语法：

```cpp
EXPECT_CALL(mock_object, method(matchers))
    .Times(cardinality)
    .WillOnce(action)
    .WillRepeatedly(action);
```

比如下面代码的含义是：调用 `turtle` 对象的 `GetX(string)` 方法 5 次，每次传入的参数都是”hello”，第一次返回 100，第二次返回 150，之后几次返回 200：

```cpp
using ::testing::Return;
...
EXPECT_CALL(turtle, GetX("hello"))
    .Times(5)
    .WillOnce(Return(100))
    .WillOnce(Return(150))
    .WillRepeatedly(Return(200));
```

#### 基数：判断函数调用次数

+   `Times(n)`：调用 n 次
+   `Times(0)`：不被调用
+   `Times(AtLeast(n))`：至少被调用 n 次
+   `WillOnce(action)`：被调用 1 次，执行自定义行为
+   `WillRepeatedly(action)`：被调用任意次，执行自定义行为

#### Action：控制被调用时的行为

`Will` 开头的接口可以传入一个 Action 参数，设置 mock 函数被调用时的行为。常用的：

+   `Return`：返回指定值。比如 `WillOnce(Return(100))`。

+   `ReturnRef`、`ByRef`：`Return` 不支持返回引用类型的变量，需要用这两个宏。

+   `SetArgReferee<n>(value)`：修改传入的第 n 个引用类型的参数的值，下标 n 从 0 开始。

    ```cpp
    class MockGetter : public Getter {
        public:
        MOCK_METHOD(int, get, (const string&, string&));
    };

    TEST(MockGetter, SetArgRefereeTest) {
        const std::string key = "foo_key";
        std::string value;

        MockGetter getter;
        EXPECT_CALL(getter, get(key, _))
            .WillOnce(SetArgReferee<1>("bar_value"));

        getter.get(key ,value);
        EXPECT_EQ(sum, "bar_value");
    }
    ```

+   `DoAll(action1, action2, ...)`：执行多个 Action，比如修改参数的值 + 设定返回值：

    ```cpp
    EXPECT_CALL(calc, Add(_, _, _))
      .WillOnce(DoAll(SetArgReferee<2>(8), Return(true)));
    ```

+   直接传入一个 lambda 函数，或者 `Invoke(function)`：执行自定义的函数，比如：

    ```cpp
    // 传入 lambda 函数
    EXPECT_CALL(calc, Add).WillOnce([](int a, int b)) {
        return a + b + 1;
    });
    
    // 传入函数指针
    int AddFunc(int a, int b) {
        return a + b + 1;
    }
    EXPECT_CALL(calc, Add(_, _)).WillOnce(Invoke(AddFunc));
    
    // 传入类方法
    class AddHelper {
        public:
        int Add(int a, int b) {
            return a + b + 1;
        }
    };
    AddHelper helper;
    EXPECT_CALL(calc, Add(_, _)).WillOnce(Invoke(&helper, &AddHelper::Add));
    ```

    +   Lambda 函数的签名必须和被 Mock 的函数一致。
    +   Invoke 函数可接受任何可调用对象作为参数，包括函数指针、函数对象、Lambda 表达式等

#### Matcher：匹配传给函数的参数

Matcher 能够实现在复杂场景下进行断言，可以让测试用例更加灵活和可读，是写出优雅单测的必备工具。

Matcher 提供了一系列常用的比较函数，例如 Eq、Ne、Lt、Gt、Le、Ge 等，可以满足不同类型变量的比较。

Matcher 有两个使用场景：

1.  和 EXPECT\_CALL 配合使用，用于检查传递给函数的参数值是否符合预期

    ```cpp
    // 期望第一个参数大于 2，第二个参数小于 6
    EXPECT_CALL(calc, Add(Gt(2), Le(6)));
    calc.Add(3, 5);  // 可以通过检测
    calc.Add(2, 7);  // 不能通过检测
    ```

2.  和 EXPECT\_THAT 配合使用，用于检查某个变量的值是否符合预期

    ```cpp
    // int_foo > 6
    EXPECT_THAT(int_foo, Gt(6));
    
    // 判断一个 vector 的元素值
    std::vector<int> result = {1, 2, 5};
    EXPECT_THAT(result, ElementsAre(1, 2, Gt(3)));
    
    // 判断一个 unordered_map 的元素值
    std::unordered_map<string, int> result = {{"idt_a", 1}, {"idt_b"， 2}};
    EXPECT_THAT(result, UnorderedElementsAre(Pair("idt_a", 1), Pair("idt_b", 2)));
    
    // 期望 foo 包含子串 "hello"
    EXPECT_THAT(foo, HasSubStr("hello"));
    ```


##### 通配符：`_`，`A<type>`

`_` 可以匹配任意类型的任意变量。它位于 `::testing` 命名空间下。示例：

```cpp
using namespace testing;
EXPECT_CALL(calc, Add(_, _)).Times(1);
EXPECT_CALL(calc, Add).Times(1);  // 省略参数列表，和上面等价
```

`A<type>()` 或者 `An<type>()` 匹配类型是 `type` 的任意变量。其应用场景主要是匹配重载函数。示例：

```cpp
class Foo {
    void DoSomething(int a, int b);
    void DoSomething(int a, string b);
}

EXPECT_CALL(foo, DoSomething(_, A<int>()));  // 预期调用第一个函数
```

##### 常用匹配器

完整列表见 [http://google.github.io/googletest/reference/matchers.html](http://google.github.io/googletest/reference/matchers.html)，下面罗列常用的匹配器：

+   一般比较
    +   `value`：写出字面量的值，就是精确匹配，等价于 `Eq(value)`。

        ```cpp
        EXPECT_CALL(foo, method(100)).Times(1);
        EXPECT_CALL(foo, method(Eq(100))).Times(1);  // 和上面等价
        ```

    +   `Ge(value)`、`Gt`、`Le`、`Lt`：>= (greater or equal)、> (greater)、<= (less or equal)、< (less)。

        ```cpp
        EXPECT_THAT(int_foo, Gt(100));  // int_foo > 100
        EXPECT_THAT(int_foo, Le(200));  // int_foo <= 200
        ```

    +   `Ne(value)`：不等于，not equal。
    +   `IsFalse()`、`IsTrue()`：转成 bool 值后是 false 或 true。非 0 值、非空指针等都可以视为 true。
    +   `IsNull()`、`NotNull()`：指针是否为空。
+   浮点数比较
    +   `DoubleEq(a_double)`、`FloatEq(a_float)`：浮点数相等。

        ```cpp
        double foo = 0.01 + 0.02;
        EXPECT_THAT(foo, Eq(0.03));  // 会失败
        EXPECT_THAT(foo, DoubleEq(0.03));  // 会成功
        ```

    +   `DoubleNear(a_double, max_abs_error)`：浮点数近似，差值的绝对值小于给定的 `abs_error`。

        ```cpp
        double foo = 0.03 + 0.001;
        EXPECT_THAT(foo, DoubleNear(0.01));   // 会失败
        EXPECT_THAT(foo, DoubleNear(0.001));  // 会成功
        ```

    +   `FloatNear(a_float, max_abs_error)`：同上。

+   字符串比较
    +   `StartsWith(prefix)`：指定前缀
    +   `EndsWith(suffix)`：指定后缀
    +   `HasSubstr(string)`：包含子串

        ```cpp
        std::string str = "hello, world";
        EXPECT_THAT(str, StartsWith("hello"));
        EXPECT_THAT(str, EndsWith("world"));
        EXPECT_THAT(str, HasSubstr("llo"));
        ```

    +   `IsEmpty()`：字符串为空
    +   `StrEq(string)`、`StrNe(string)`：字符串相等或不等

        ```cpp
        EXPECT_CALL(m, foo(StrEq("hello, world")).Times(1);
        m.foo("hello, world");  // 符合预期
        ```

    +   `StrCaseEq(string)`、`StrCaseNe(string)`：忽略大小写，字符串相等或不等

        ```cpp
        EXPECT_CALL(m, foo(StrCaseEq("hello, world")).Times(1);
        m.foo("HELLO, WORLD");  // 符合预期
        ```

    +   `ContainsRegex(string)`：正则表达式匹配
+   容器比较
    +   `ElementsAre(e0, e1, ..., en)`：每个元素依次是什么，用于 vector、map、set 等。

        ```cpp
        std:vector<int> v = {1, 2, 4};
        EXPECT_THAT(v, ElementsAre(1, 2, 4));  // 值是 {1, 2, 4}
        EXPECT_THAT(v, ElementsAre(1, 2, Gt(3)));  // 值是 {1, 2, 大于 3 的任意值}

        // 下面这样也可以，但不如上面只写一行优雅，不推荐
        vector<int> expect_vector = {1, 2, 4};
        EXPECT_EQ(v, expected_vector);
        ```

    +   `UnorderedElementsAre(e0, e1, ..., en)`：同上，用于 unordered\_set、unordered\_map 等。

        ```cpp
        std:set<int> v = {1, 2, 4};
        EXPECT_THAT(v, UnorderedElementsAre(1, 2, 4));  // 值包含 {1, 2, 4}
        EXPECT_THAT(v, UnorderedElementsAre(1, 2, Gt(3)));  // 值包含 {1, 2, 大于 3 的任意值}
        ```

    +   `ContainerEq(container)`：效果同上，但会打印出哪些元素不一致。
    +   `Contains(e)`：包含一个元素和 `e` 匹配，这里 `e` 可以是一个精确值，也可以是一个匹配器。
    +   `Contains(e).Times(n)`：检测 `e` 指定的元素出现 n 次。`Times(0)` 表示不能包含这样的元素。

        ```cpp
        EXPECT_THAT(v, Contains(5));  // 需要包含一个值为 5 的元素
        EXPECT_THAT(v, Contains(Lt(5)));  // 需要包含一个值 <5 的元素
        EXPECT_THAT(v, Contains(Lt(5)).Times(3));  // 需要包含 3 个值 <5 的元素
        ```

    +   `Each(e)`：每个元素都要匹配 `e`。

        ```cpp
        EXPECT_THAT(v, Each(Lt(5)));  // 每个元素都需要 <5
        EXPECT_THAT(v, Each(AllOf(Lt(5), Gt(3)));  // 每个元素都需要 >3 且 <5
        ```

    +   `IsSubsetOf(array)`、`IsSubsetOf(begin, end)`：参数是指定数组的子集，顺序可以不一致。
+   成员匹配
    +   `Field(&class::field, m)`：匹配字段值，用于结构体检测，比如：

        ```cpp
        struct MyStruct {
            int value = 42;
            std::string greeting = "aloha";
        };
        MyStruct s;
        EXPECT_THAT(s, FieldsAre(42, "aloha"));
        ```

    +   `Pair(m1, m2)`：匹配一个 `std::pair`，经常和 `ElementsAre` 配合使用，匹配一个 map：

        ```cpp
        std::map m = {
            {"hello", 1},
            {"world", 2},
        };
        EXPECT_THAT(m, ElementsAre(Pair("hello", 1), Pair("world", 2)));
        ```

+   指针匹配
    +   `Pointee`：匹配一个指针或 shared\_ptr，常和 `Field` 一起检测某个指针的字段值：

        ```cpp
        struct Item { int id; };
        std::shared_ptr<Item> obj = std::make_shared<Item>();
        obj->id = 1;
        EXPECT_THAT(obj, Pointee(Field(&Item::id, 1));
        ```

+   复合匹配
    +   `AllOf(m1, m2, ..., mn)`：匹配所有给定的匹配器。

        ```cpp
        std:vector<int> v = {4, 5};
        EXPECT_THAT(v, Each(AllOf(Le(5), Gt(3)));  // 每个元素都需要 >3 且 <=5
        ```

    +   `AnyOf(m1, m2, ..., mn)`：匹配任何一个给定的匹配器。

        ```cpp
        std:vector<int> v = {1, 2, 6, 7};
        EXPECT_THAT(v, Each(AnyOf(Lt(3), Gt(5)));  // 每个元素要么 <3，要么 >5
        ```

    +   `Not(m)`：不匹配给定的匹配器，可以和 `AllOf`、`AnyOf` 配合使用。

        ```cpp
        EXPECT_THAT(v, Each(AllOf(Gt(3), Lt(5)));  // 3 < each_item < 5
        EXPECT_THAT(v, Each(Not(AllOf(Gt(3), Lt(5))));  // each_item <= 3 || each_item >=5
        ```

    +   `Conditional(cond, m1, m2)`：cond 为 true 时匹配 `m1`，否则匹配 `m2`。

        ```cpp
        EXPECT_THAT(v, Conditional(is_ad, Gt(5), Lt(3));  // v = is_ad ? v > 5 : v < 3
        ```


##### 匹配器的优先级

在使用 GMock 的 EXPECT\_CALL 宏进行 mock 函数参数匹配时，一次函数调用可能命中多个匹配器：

```cpp
EXPECT_CALL(calc, add).Times(1);                // 任意参数
EXPECT_CALL(calc, add(_, _)).Times(1);          // 和上面等价
EXPECT_CALL(calc, add(3, 5)).Times(1);          // 字面量，精确匹配
EXPECT_CALL(calc, add(Gt(2), Lt(6))).Times(1);  // 比较，模糊匹配

calc.add(3, 5);  // 这一行理论上可以匹配上面每一个 EXPECT_CALL
```

匹配的优先级如下：**模糊匹配器 > 精确匹配器 >** **通配符**

+   模糊匹配器：Lt (小于)、Gt (大于) 等
+   精确匹配器：字面量、Eq (相等) 等
+   通配符：\_ 等
+   当优先级相同时，越近的声明优先级越高。

这引入了一些使用技巧：

1.  只设置必要的匹配器。如果对某个参数的值不感兴趣，请写 `_` 作为参数，这意味着“一切皆有可能”。

    ```cpp
    EXPECT_CALL(calc, add(5, _).Times(1);  // 如果只关心第一个参数的值，第二个参数就写成 _
    EXPECT_CALL(calc, add(5, 3).Times(1);  // 如果这样写，之后代码变动，单测可能就不通过了
    ```

2.  如果对所有参数的值都不感兴趣，可以**省略参数列表**，这和把每个参数都写成 `_` 是一致的。好处是后续改了函数签名后，比如新增了一个参数，单测是不需要改动的。

    ```cpp
    EXPECT_CALL(calc, add).Times(1);       // 任意参数
    EXPECT_CALL(calc, add(_, _)).Times(1); // 和上面等价
    ```

3.  利用匹配器的优先级，可以细粒度地**控制函数在不同参数下的返回值**。比如 mock 一个 getter，我们希望在 key == `foo` 时返回 `bar`、key == `hello` 时返回 `world`，其他 key 通通返回空字符串，那么可以这样写：

    ```cpp
    EXPECT_CALL(getter, get).WillRepeatedly(Return(""));
    EXPECT_CALL(getter, get("foo")).WillRepeatedly(Return("bar"));
    EXPECT_CALL(getter, get("hello")).WillRepeatedly(Return("world"));
    
    EXPECT_STREQ(getter.get("foo"), "bar");
    EXPECT_STREQ(getter.get("hello"), "world");
    EXPECT_STREQ(getter.get("aaa"), "");
    EXPECT_STREQ(getter.get("bbb"), "");
    ```


#### Uninteresting call：处理非预期调用

`非预期调用`是指未被 `EXPECT_CALL` 匹配的调用。当有非预期调用时，会有 warning 日志输出：

```plaintext
Uninteresting mock function call - returning default value.
    Function call: foo(42)
          Returns: 0
```

有两种处理方式。

##### NiceMock：不要输出 warning 信息

GMock 有三种级别：Nice Mock、Naggy Mock、Strict Mock。

默认是 Naggy Mock，当有非预期调用时，输出 warning 日志。

```plaintext
Uninteresting mock function call - returning default value.
    Function call: foo(42)
          Returns: 0
```

如果我们希望非预期调用不要有 warning，可以用 `NiceMock`。`NiceMock` 是一个模板类：

```cpp
class MyMockClass : public MyClass {
    MOCK_METHOD(...)
};
MyMockClass mock;  // 这非预期调用会有 warning 日志
NiceMock<MyMockClass> mock; // 改成这样就不会有 warning 日志了
```

也可以在 Mock Class 定义的时候，直接继承 `NiceMock`：

```cpp
class MyMockClass : public NiceMock<MyClass> {
    MOCK_METHOD(...)
};
MyMockClass mock;  // 这里非预期调用会返回默认值，不会有 warning 日志
```

Strict Mock 在有非预期调用时会直接 fail。也是一个模板类，使用方法和 `NiceMock` 类似。

##### 打印调用栈：检查非预期调用来自哪里

当有非预期调用时，如果我们希望检查非预期调用来自哪里，可以打印调用栈。有两种方式。

+   一种是通过 EXPECT\_CALL 打印调用栈：

    ```cpp
    #include <boost/stacktrace.hpp>

    void print_stack_trace() {
      std::cout << "call stack:" << std::endl;
      const auto frames = boost::stacktrace::stacktrace();
      for (const auto& frame : frames) {
        std::cout << "  " << frame << std::endl;
      }
    }

    EXPECT_CALL(...).WillRepeatedly([](){
      print_stack_trace();
      return xxx;  // 返回默认值
    });
    ```

+   另一种方式是使用 GTest 提供的选项 `--gmock_verbose=info`，该选项会打印每次 Mock Method 被调用时的参数和调用栈。需要在单测 main 函数执行 `::testing::InitGoogleMock(&`*`argc`*`,` *`argv)`\*\*。*


### ON\_CALL

ON\_CALL 可以和 EXPECT\_CALL 配合使用。ON\_CALL 设置函数的默认行为，EXPECT\_CALL 临时修改其行为。

💡 ON\_CALL 和 EXPECT\_CALL 的语法很像，但提供了不同的语义。EXPECT\_CALL 目的在于定义一个预期，即我们期望被测试函数在某些特定条件下应该调用哪些函数，如果没有满足预期的调用，则认为是一次失败。ON\_CALL 只是为了指定被测试函数的默认行为。

ON\_CALL 通常用在 **Mock 类的构造函数**、或者 TestFixture 的 **`SetUp`** **函数**里：

1.  令 mock 函数始终返回某个自定义的值
2.  将 mock 函数的默认操作委托给基类或其他实例进行。一个具体使用场景：希望 Mock 某个函数，默认还是执行原有操作，但当有需要的时候，可以临时更改其行为。这时就可以在 ON\_CALL 里把默认操作委托给基类，后续再在 EXPECT\_CALL 里临时控制其返回值。

    ```cpp
     class MockFoo : public Foo {
     public:
     // Normal mock method definitions using gMock.
     MOCK_METHOD(char, DoThis, (int n), (override));
     MOCK_METHOD(void, DoThat, (const char* s, int* p), (override));
    
     // 构造函数里，委托 Mock 接口的操作给其他类
     MockFoo() {
     // 委托给基类
     ON_CALL(*this, DoThat).WillByDefault([this](const char* s, int* p) {
     Foo::DoThat(s, p);
     });
     // 委托给另一个对象
     ON_CALL(*this, DoThis).WillByDefault([this](int n) {
     return fake_.DoThis(n);
     });
     }
    
     private:
     FakeFoo fake_;  // Keeps an instance of the fake in the mock.
     };
    ```


## 五、Tips

### 编译参数

#### 访问私有变量

错误的做法：`#define private public`，或者定义 getter 函数。前者可能导致编译报错，后者需要修改代码。

正确的做法：`-fno-access-control`，放在单测的 optimize 参数里。

#### 修改 Const 字段

错误的做法：定义 setter 函数。需要修改代码。

较好的做法：使用 `const_cast<Type&>` 修改常量类型。

#### 优化级别改为 O0

好处：单测覆盖率报告更准。

### 运行单测

#### 运行特定单测：`--gtest_filter`

什么时候需要运行特定单测：

+   运行所有单测，发现某个单测失败了。但这个时候单测日志已经刷屏，看不到这个单测的具体失败原因了。
+   修复单测 bug 后重新编译，只希望运行上次失败的那个单测。

语法：`--gtest_filter=TestSuite.TestCase`。**支持****通配符** **`\*`** **和排除符** **`-`**。

+   `--gtest_filter=FooTest.Bar`，只运行 `FooTest.Bar`。
+   `--gtest_filter=*FooTest*`，运行所有名称里包含 `FooTest` 的单测。
+   `--gtest_filter=FooTest.*:BarTest.*`，运行 FooTest 和 BarTest 两个 suites 下的所有单测。
+   `--gtest_filter=FooTest.*-FooTest.Bar`，运行 FooTest 下的所有单测，但不运行 FooTest.Bar。
+   `--gtest_filter=FooTest.*:BarTest.*-FooTest.Bar:BarTest.Foo`，运行 FooTest 和 BarTest 下的所有单测，但不运行 FooTest.Bar 和 BarTest.Foo。
+   详细的匹配规则见[文档](https://github.com/google/googletest/blob/main/docs/advanced.md#running-a-subset-of-the-tests)。

#### 重复运行单测多次：`--gtest_repeat`、`--gtest_break_on_failure`

有些单元测试涉及到多线程，可能会偶发性的不通过。

可以使用 `--gtest_repeat=-1`、`--gtest_break_on_failure`运行多次来复现。

#### 临时禁用某个单测：`DISABLED_`

可以使用`DISABLED_`前缀来跳过某项测试：

```cpp
TEST_F(DISABLED_BarTest, DoesXyz) { ... }
TEST_F(BarTest, DISABLED_DoesXyz) { ... }
```

DISABLED 之后，单测日志会输出 DISABLED 的单测数量：

![img](https://imageslr.com/media/gtest/disable.png)

之后在修理单测过程中，可以使用 `--gtest_also_run_disabled_tests` 或者 `--gtest_filter` 来执行被 DISABLED 的单测。

相比于把整段单测代码全部注释掉，加一个 DISABLED\_ 前缀的 diff 更少，而且后续可以直接运行。

### 输出日志

std::cout 输出的日志会直接展示在终端。

💡 建议：**能用 EXPECT 就不要写 std::cout**

+   如果 cout 的日志是确定性的，那么应该写成断言。
+   如果是 debug 用的，那么在写完单测后应该删除。
+   如果期望单测失败时打印，那么应该放在 `EXPECT_CALL()... << ...` 后面，而不是直接输出。
+   除此之外，这些日志没有任何意义，只会刷屏，没有保留的必要。

### 使用 GDB 运行和调试程序

🔗 **GDB** **快速入门 / 速查手册**：[https://imageslr.com/2023/gdb.html](https://imageslr.com/2023/gdb)

GDB 也是研发基本功之一。使用 GDB 断点调试的效率远高于`加日志+重新编译单测`，但大部分人依然使用后面这种调试方式，原因可能是认为 GDB 的上手成本太高。但实际上，GDB 入门只需要 3 分钟。这里罗列 GDB 的基本使用姿势，足够覆盖大部分单测场景。上面高亮块里也提供了一个速查手册。

1.  进入 GDB，同时加载单测程序：

    ```Shell
      gdb ./path/to/unit_test
    ```

2.  加载动态链接库：

    ```Shell
      set env LD_LIBRARY_PATH=...
    ```

3.  运行单测：`r`。如果要运行指定单测，加 `--gtest_filter` 参数：

    ```Shell
      r --gtest_filter=FooTest.bar_method
    ```

4.  打断点：`b`。比如：

    ```Shell
      b 文件名:行号
      b prime/src/auction/validator/frame/validator.cpp:52
    ```

5.  从断点处继续运行：`c`
6.  逐行执行：`n`
7.  打印变量：`p 变量名`
8.  查看 core 栈：`bt`

## 六、单测编写规范

💡 单测代码也需要经过 Code Review。单测代码和线上代码同等重要。

### 目录结构、文件与命名规范

#### 单测的目录结构，要和源码的目录结构一致 `[强制]`

单测文件的路径名，等价于源码的文件名加上 `_test` 后缀。

目的在于：让写单测的人能很快定位是否已经有这个文件或这个类的单测，让新增代码更聚合，避免写重复单测。

```JSON
// bad
src/
  common/
    item_data.cpp
  frame/
    request_context.cpp
unittest/
  item_data_test.cpp // 这里直接平铺在 unittest 目录下了，和 src 目录层级不一致
  request_context_test.cpp

// good
src/
  common/
    item_data.cpp
  frame/
    request_context.cpp
unittest/
  common/
    item_data_test.cpp
  frame/
    request_context_test.cpp
```

#### TestSuite、TestCase 命名规范 `[建议]`

TestSuite 建议命名为被测试的类名加上 `Test` 后缀：

```cpp
// bad
TEST(MyTest, foo) {...}

// good
TEST(RequestContextTest, foo) {...}
```

TestCase 建议命名为被测试的函数名，不要随意起名，也不需要增加不必要的前缀：

```JSON
// bad
TEST(RequestContextTest, test_uav) {
    ASSERT_EQ(ctx->init_uav_to_group_bid(), 1);
}

// good
TEST(RequestContextTest, init_uav_to_group_bid) { // 不需要加 test_ 前缀
    ASSERT_EQ(ctx->init_uav_to_group_bid(), 1);
}
```

GTest 生成的类名是带下划线的，所以上面这些名字建议用驼峰形式。

### 写有用的单测，而不只是通过单测覆盖率卡点

#### 禁止写无用单测 `[强制]`

经典问题：“**假单测**”。为了通过单测覆盖率卡点、便只是在单测里执行了一下新增函数，但**不检测其返回值，没有任何断言逻辑**。之前遇到过有同学写了几百行单测，reviewer 从头看到尾，居然一行 EXPECT 都没有，（╯‵□′）╯。

还有一种场景是“**蹭****单测**”：新增了一个分支逻辑，引入了一坨逻辑，但只是在某个已有单测里，把这分支的控制参数打开了，完全没有自己构造输入去覆盖新增逻辑。这样即使覆盖率也能达标，也属于无用单测。

#### 测试不符合预期的边界情况，而不是只测试符合预期的情况 `[建议]`

单测的目的之一在于测试程序的鲁棒性，即当输入不符合预期时，是否能正确处理。比如一个 `stoi` 函数 —— 将字符串转成整数。在构造输入时，最基本的是 `123` 这种合法字符串，此外还应当构造 `0.9999` (小数)、`123abc` (含非法字符) 等非法输入，以及 `1781234123412341234` 这种合法但越界的输入。

### 写优雅的、可理解的、易于维护的单测：代码风格与注释

#### 不要用 std::cout 输出变量值，改为用 `ASSERT` / `EXPECT` 检查 `[强制]`

能用 EXPECT 就不要写 std::cout：

+   如果 cout 的日志是确定性的，那么应该写成断言。
+   如果是 debug 用的，那么在写完单测后应该删除。
+   如果期望单测失败时打印，那么应该放在 `EXPECT_CALL()... << ...` 后面，而不是直接输出。
+   除此之外，**这些日志没有任何意义**，只会刷屏，没有保留的必要。

```cpp
// bad
std::cout << "ads_size = " << rsp.ads.size() << std::endl; // 这一行多此一举
EXPECT_EQ(rsp.ads.size(), 1);

// good
EXPECT_EQ(rsp.size(), 1); // 这一行在检测失败时，会打印 rsp.size() 的值
EXPECT_EQ(rsp.size(), 1) << rsp.ads.debug_string() << std::endl;  // 可以在检测失败时，打印更多 debug 日志
```

#### 不要直接写数值，要写清楚这个数字是怎么算的 `[建议]`

直接写一个数字 `2965`，其他人并不知道这个数字是怎么算出来的，后续有问题也不好排查。

写出这个数字的计算过程，**映射到代码分支上**，其他人好看懂。这也是白盒化单测的表现之一。

```cpp
// bad
params.alpha = 2;
params.beta = 2.5;
ASSERT_EQ(params.get_score(), 2965); // 这 2965 咋算的？

// good
params.alpha = 2;
params.beta = 2.5;
ASSERT_EQ(params.get_score(), 2 * 2.5 * 593); // alpha * beta * ctx.bid

// good: 把变量名直接注释在字面量后面
ASSERT_EQ(params.get_score(), 2 /* alpha */ * 2.5 /* beta */ * 593 /* ctx.bid */);
```

#### 使用大括号分隔、缩进不同的 Test Case `[建议]`

一个 `TEST(Foo, Bar){...}` 就是一个 Test Case。考虑到构造输入有成本，通常一个 `TEST(Foo, Bar)` 里会反复修改输入，构造多个 case，测试不同的执行流程。这里建议**用大括号分隔不同的 case**，整体更条理。另一个好处在于：**每个变量的生命周期仅限于大括号内**。这样就可以反复使用相同的变量名，而不用给变量名编号。

```cpp
// bad
TEST(Foo, bar) {
    Context ctx1;
    params.enable_refresh = true;
    ASSERT_EQ(ctx1->is_enable_fresh(), true);

    Context ctx2;
    params.enable_refresh = false;
    ASSERT_EQ(ctx2->is_enable_fresh(), false);
}

// good
TEST(Foo, bar) {
    // case 1: enable = true
    {
        Context ctx;
        params.enable_refresh = true;
        ASSERT_EQ(ctx->is_enable_fresh(), true);
    }

    // case 2: enable = false
    {
        Context ctx;
        params.enable_refresh = false;
        ASSERT_EQ(ctx->is_enable_fresh(), false);
    }
}
```

此外，如果待测函数十分复杂，建议拆分多个 `TEST(Foo, Bar){...}`，避免 Test Case 代码膨胀。比如：

```cpp
// 待测函数
int foo(Ad ad) {
    if (!ad)
        return -1;
    switch(ad.pricing) {
        case CPT:
            ...
        case GD:
            ...
    }
}
// 输入为空
TEST(Foo, IsNil) {
    ...
}

// 输入是 CPT 广告
TEST(Foo, IsCpt) {
    ...
}

// 输入是 GD 广告
TEST(Foo, IsGd) {
    ...
}
```

#### 正确使用 `ASSERT` 和 `EXPECT` 前缀 `[建议]`

+   前者在校验失败时会直接终止，后者则会继续运行。
+   如果某个判断不通过时会影响后续步骤 ，需要使用 `ASSERT`。常见的是空指针，或者数组访问越界。

    > 如果某个 EXPECT 失败会导致后续一连串 EXPECT 失败，那么第一个 EXPECT 应该换成 ASSERT。这就像编译时的报错信息，往往只有第一个是有用的，其他错误都只是刷屏。

+   其他情况，可以使用 `EXPECT`，尽可能多测试几个用例。
+   此外，如果修改了某个字段的**目的是影响某个函数的返回值，那么最好补一行** **`ASSERT`**。好处显而易见：代码即注释；且在查单测 bug 的时候，这些断言能够预先排除一些问题。

    ```cpp
    // bad
    req.type = Type::foo;  // 其他人看不懂这一行的目的是什么
    EXPECT_EQ(req.get_value(), 1);
    
    // good
    req.type = Type::foo;
    ASSERT_TRUE(context.is_foo());  // 这里表明，上一行是为了影响代码里这个判断函数的结果
    EXPECT_EQ(req.get_value(), 1);
    ```


#### 解除对外部逻辑的依赖 / 耦合 `[建议]`

+   如果被测代码里用到了某个全局变量：
    +   Bad：从请求入口开始执行全部代码、间接构造该变量。这样太黑盒了。
    +   Good：直接就地构造变量，然后赋值到全局字段上。
+   如果被测代码里调用了某个函数：
    +   Bad：想办法构造外部函数的输入，以此来影响其返回结果。这样会导致被测函数与外部函数耦合 —— 需要看外部函数的实现逻辑，且如果后续外部函数改动了，当前函数的单测可能会不通过。
    +   Good：使用 GMock 劫持该函数，在单测里控制其返回结果。完全不需要关心外部函数的实现。

#### 为单测补充详细的注释 `[建议]`

单测写出来必须的白盒的、可理解的、可维护的。如果不补充注释，其他人根本看不懂这些单测在测试什么逻辑，也无法确保其有效，后续修单测也很痛苦。

为单测补充注释时，重点要说明「这些赋值对应了哪个分支条件」，目标是让其他人扫一眼源码就能知道这些单测在测试哪些逻辑。

```cpp
// bad
req.type = Type::foo;
req.from = "localhost";
EXPECT_EQ(ctx.get_value(), 5);

// good：补充注释
req.type = Type::foo;  // is_foo()
req.from = "localhost";  // is_local_req()
EXPECT_EQ(ctx.get_value(), 5);  // 本地请求，默认值是 5

// best：代码即注释
req.type = Type::foo;
ASSERT_TRUE(ctx->is_foo());
req.from = "localhost";
ASSERT_TRUE(ctx->is_local_req());
EXPECT_EQ(ctx.get_value(), 5);  // 本地请求，默认值是 5
```

### 写稳定的单测

#### Mock 所有 IO，不要依赖外部数据 `[强制]`

单测里**禁止访问外部服务**，最好是整个单测能够断网。

之前遇到的实际 case：

+   单测依赖线上服务，导致必须在一台线上环境的容器里才能启动单测。
+   单测依赖了线上 redis 里的测试数据，过了半年后数据过期了，线上单测突然挂了。

## 参考文档

[Gtest 官方手册 (Google Test Primer)](http://google.github.io/googletest/primer.html) ，以及部门内的分享。
