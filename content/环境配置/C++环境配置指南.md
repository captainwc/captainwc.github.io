---
title: 现代C++开发环境配置指南
date: 2025-03-26
categories: ["环境配置"]
tags: ["c++"]
series: ["环境配置专栏"]
---

# 现代c++环境配置指南

## 引言

作为一个高强度冲浪的cpper，经常能在各种地方看到各式各样的大家诟病cpp的地方，其中比较多（但是相对温和）的一条就是，环境配置麻烦。这个问题有多少人说呢？最直观的一条佐证是，迄今为止，我的阅读、点赞、收藏量最多的一篇博文，居然就是随手写的一篇很粗糙的 —— [vscode搭配clangd配置现代c++环境-CSDN博客](https://blog.csdn.net/qq_43533638/article/details/137198166)，这背后又有多少被这编程第一关折磨的旁友......

本人的CPP水平一言难尽，平常喜欢的就是精通各类语言的hello world，以及配置各种有的没的环境，那么闲话少叙，下面就对这个粗糙的环境配置的坑进行补档。

> [!goal]
>
> 1. 所谓CPP环境，具体指的是什么？
>    - 高亮、跳转、补全、错误提示、依赖管理、构建、调试、运行、发布
> 2. 具体开发环境搭建
>    - vscode、vim/nvim、sublime，or clion、vs

> [!message] 提示
>
> 本文会对我所认知范围内的，C++的环境做全流程的介绍。也会介绍具体的工具、环境该如何配置，但囿于篇幅和本人的水平以及耐心，可能不会特别详细，更无法兼顾到所有的conner case。
>
> 
>
> 比如我会说编译器是g++，构建工具是cmake，但是gcc和cmake如何安装到你的电脑上这种就没有介绍了。不过我想既然看官能够在茫茫互联网中找到我这篇博文，那么继续搜索搜索解决这些小问题自然不在话下。网上有相当多的且优质的关于某一个工具、软件如何下载安装配置的教程，如果你不清楚，直接STFW即可！
>
> 
>
> 至于本文，如果您能只凭本文顺着就把环境配好了，那实在是您天赋异禀，天生就是干C嘎嘎的料子。如果不能，那么直接搜索不清楚的内容就好。**我希望的是本文能给各位刚接触C++的朋友们一个稍微完整一点的，关于C++开发环境的认识，知道有哪些工具，分别是做什么用的。然后根据自己的需要去按图索骥！**

## CPP开发环境都包括哪些？

![image-20250326163516854](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_imgimage-20250326163516854.png)

下面对各个步骤的推荐工具配置进行注意介绍：

### 高亮、补全、跳转

> [!tldr] TLDR 
>
> 这三类可以统一由一个LSP提供，也是最推荐的——`clangd`，此外就是用IDE自带的，或者VSCODE-CPP插件包。（还有一个在更新中的项目 [clice-project/clice](https://github.com/clice-project/clice) **有望**超过clangd，不过目前还处于不可用状态。）

#### 介绍与使用

`clangd`是一个语言服务器，提供代码高亮、补全、跳转的功能，但是不能直接用，因为既然是服务器，那么就要配合客户端使用，使用不同的IDE或编辑器对应的客户端不同。

- 服务器：clangd.exe
  - clangd有很多版本，依赖llvm项目的库，根据你的系统自行选择版本安装，比如 clangd-14.exe、clangd-18.exe 等等。
  - clangd服务器直接理解单个文件没问题，但是要理解你的整个项目，需要依赖一个`compile_commands.json`文件。使用不同的构建工具时有不同的生成该文件的办法，比如CMake是使用`cmake .. -DCMAKE_EXPORT_COMPILE_COMMANDS=ON`，至于Make、Bazel等怎么生成，这里不再赘述。
- 客户端：
  - vscode：安装 [clangd - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)（本机没有安装clangd时，会提示你要不要帮你安装）
  - vim：安装`coc`插件后，用 cocInstall 安装`coc-clangd`（无需自己安装clangd）
  - nvim：mason 安装 clangd 插件（无需自己处理clangd.exe）
  - clion：默认就是，不用管了。(都用IDE了应该就没配环境的烦恼了吧？)

#### 配置

clangd也可以进行配置，参考[官方手册](https://clangd.llvm.org/config)，比如可以指定在后台索引、指定对待源文件的方式、指定语法检查的工具Diagnostics（就是后文中[clang-tidy](#错误告警lint)的配置）等等。

配置文件的路径，Linux在 `$HOME/.config/clangd/config.yaml`，windows在 `%APPDATALOCAL%/clangd/config.yaml`。（如果有不对的，可以直接打开vscode，安装clangd插件，然后 ctrl+shift+p 搜索 clangd open user config 即可找到）

这里给出一份我的配置

```yaml
Index:
  Background: Build

CompileFlags:
  Add: [-xc++, -Wall, -std=c++20]
  Compiler: clang++

Diagnostics:
  ClangTidy:
    Add: ["*"]
    Remove: [
        abseil*,
        fuchsia*,
        llvmlib*,
        zircon*,
        altera*,

        bugprone-easily-swappable-parameters, #相邻同类型参数容易混淆
        cppcoreguidelines-avoid-c-arrays, # 不要用 C 数组
        cppcoreguidelines-avoid-do-while,
        cppcoreguidelines-avoid-magic-numbers, # 不要用魔法数字
        cppcoreguidelines-macro-usage, # 宏定义用法，不要定义常数之类的
        cppcoreguidelines-non-private-member-variables-in-classes, # 所有成员变量都得是private的
        cppcoreguidelines-owning-memory, # 用gsl::owner<> 来表示指针拥有对象的所有权
        cppcoreguidelines-pro-bounds-array-to-pointer-decay, # 数组传参退化为指针
        cppcoreguidelines-pro-bounds-pointer-arithmetic, # 不要使用指针运算
        cppcoreguidelines-pro-bounds-constant-array-index, # 数组index当为常量
        google-build-using-namespace, # 不要用using namesapce xxx;
        google-readability-todo,
        hicpp-avoid-c-arrays, # 禁用c风格数组
        hicpp-braces-around-statements,
        hicpp-no-array-decay, # 防止数组传参退化为指针
        misc-no-recursion, #递归
        misc-non-private-member-variables-in-classes, # public成员变量，或许不该用，但是想用
        modernize-avoid-c-arrays, # 同上
        modernize-use-nodiscard, # 推荐使用 [[nodiscard]]
        modernize-use-trailing-return-type, # 不要每个都加上尾返回值类型
        readability-braces-around-statements,
        readability-convert-member-functions-to-static, # 转为静态成员函数
        readability-identifier-length, # 不检查变量名长度
        readability-implicit-bool-conversion, # 隐式布尔类型转换
        readability-magic-numbers, #同上
      ]
```

### 格式化

> [!tldr] 推荐 clangd-format

#### 简介与使用

可能看一些开源项目的时候应该就见过了，很多项目中都会有一个`.clang-format`文件，这个就是clang-format需要使用的配置文件，可以在里面指定样式。

你可以直接从认可的开源项目中clone一份来用，也可以找一个基础版本在上面修改，具体的选项参考[官方文档](https://clang.llvm.org/docs/ClangFormatStyleOptions.html)

使用时，在编辑器/IDE里面可以配合相应的格式化插件使用，编辑文件的时候实时格式化一下。

也可以直接使用命令行对文件格式化。比如使用如下命令 `fd -e cpp -e cc -e h -x clang-format -i` 可以做到对项目中所有的头文件源文件按照当前.clang-format文件指定的格式重新格式化一下。

#### 配置

这里给出一个我经常用的clang-format配置：

```yaml
DisableFormat: false # 关闭格式化
BasedOnStyle: Google
Language: Cpp
Standard: Latest
ColumnLimit: 120
# 在大括号前换行: Attach(始终将大括号附加到周围的上下文), Linux(除函数、命名空间和类定义，与Attach类似),
#   Mozilla(除枚举、函数、记录定义，与Attach类似), Stroustrup(除函数定义、catch、else，与Attach类似),
#   Allman(总是在大括号前换行), GNU(总是在大括号前换行，并对于控制语句的大括号增加额外的缩进), WebKit(在函数前换行), Custom
#   注：这里认为语句块也属于函数
BreakBeforeBraces: Custom
BraceWrapping:
  # case标签后面
  AfterCaseLabel: false
  # class定义后面
  AfterClass: false
  # 控制语句后面
  AfterControlStatement: Never
  # enum定义后面
  AfterEnum: false
  # 函数定义后面
  AfterFunction: false
  # 命名空间定义后面
  AfterNamespace: false
  # ObjC定义后面
  AfterObjCDeclaration: false
  # struct定义后面
  AfterStruct: false
  # union定义后面
  AfterUnion: false
  #ExternBlock定义后面
  AfterExternBlock: false
  # catch之前
  BeforeCatch: false
  # else之前
  BeforeElse: false
  # lambda块之前
  BeforeLambdaBody: false
  # while之前
  BeforeWhile: false
  # 缩进大括号
  IndentBraces: false
  # 分割空函数
  SplitEmptyFunction: true
  # 分割空记录
  SplitEmptyRecord: true
  # 分割空命名空间
  SplitEmptyNamespace: true

# 在 @property 后面添加空格, \@property (readonly) 而不是 \@property(readonly).
ObjCSpaceAfterProperty: true
# 访问说明符(public、private等)的偏移
AccessModifierOffset: -4

# 开括号(开圆括号、开尖括号、开方括号)后的对齐: Align, DontAlign, AlwaysBreak(总是在开括号后换行)
AlignAfterOpenBracket: Align
# 连续赋值时，对齐所有等号
AlignConsecutiveAssignments: Consecutive
# 连续声明时，对齐所有声明的变量名
AlignConsecutiveDeclarations: Consecutive
# 连续宏声明时，对齐空格
AlignConsecutiveMacros: Consecutive
# 对齐连接符: DontAlign(不对齐)， Left(左对齐), Right(右对齐)
AlignEscapedNewlines: Left
# 水平对齐二元和三元表达式的操作数
AlignOperands: Align
# 对齐连续的尾随的注释
AlignTrailingComments: true
# 允许函数调用的所有参数在放在下一行
AllowAllArgumentsOnNextLine: true
# 允许函数声明的所有参数在放在下一行
AllowAllParametersOfDeclarationOnNextLine: true
# 允许短的块放在同一行
AllowShortBlocksOnASingleLine: Empty
# 允许短的case标签放在同一行
AllowShortCaseLabelsOnASingleLine: true
# 允许短的枚举放在同一行
AllowShortEnumsOnASingleLine: true
# 允许短的函数放在同一行: None, InlineOnly(定义在类中), Empty(空函数), Inline(定义在类中，空函数), All
AllowShortFunctionsOnASingleLine: Inline
# 允许短的if语句保持在同一行
AllowShortIfStatementsOnASingleLine: Never
# 允许短的Lambdas语句保持在同一行
AllowShortLambdasOnASingleLine: All
# 允许短的循环保持在同一行
AllowShortLoopsOnASingleLine: true
# 总是在返回类型后换行: None, All, TopLevel(顶级函数，不包括在类中的函数),
#   AllDefinitions(所有的定义，不包括声明), TopLevelDefinitions(所有的顶级函数的定义)
# (clang-format-19: Renamed to BreakAfterReturnType)
AlwaysBreakAfterReturnType: None
# 总是在多行string字面量前换行
AlwaysBreakBeforeMultilineStrings: false
# 总是在template声明后换行(clang-format-19: Renamed to BreakTemplateDeclarations)
AlwaysBreakTemplateDeclarations: Yes
# false表示函数实参要么都在同一行，要么都各自一行
BinPackArguments: true
# false表示所有形参要么都在同一行，要么都各自一行
BinPackParameters: true
# 在二元运算符前换行: None(在操作符后换行), NonAssignment(在非赋值的操作符前换行), All(在操作符前换行)
BreakBeforeBinaryOperators: NonAssignment
# 在三元运算符前换行
BreakBeforeTernaryOperators: true
# 在构造函数的初始化列表的逗号前换行
BreakConstructorInitializers: BeforeColon
# 在类声明继承列表的逗号前换行
BreakInheritanceList: BeforeColon
# 允许中断长字符串
BreakStringLiterals: true
# 描述具有特殊意义的注释的正则表达式，它不应该被分割为多行或以其它方式改变
CommentPragmas: "^ ONE[ ]?LINE"
# 允许连续的名称空间声明将在同一行
CompactNamespaces: false
# 构造函数的初始化列表的缩进宽度
ConstructorInitializerIndentWidth: 4
# 延续的行的缩进宽度
ContinuationIndentWidth: 4
# 去除C++11的列表初始化的大括号{后和}前的空格
Cpp11BracedListStyle: true
# 继承最常用的指针和引用的对齐方式
DerivePointerAlignment: true
# 修饰符后放置空行
EmptyLineAfterAccessModifier: Never
# 修饰符前放置空行
EmptyLineBeforeAccessModifier: LogicalBlock
# 修正命名空间注释
FixNamespaceComments: true
# 需要被解读为foreach循环而不是函数调用的宏
ForEachMacros:
  - foreach
  - Q_FOREACH
  - BOOST_FOREACH
# 需要解读为if的函数
IfMacros:
  - KJ_IF_MAYBE
# 对#include进行排序，匹配了某正则表达式的#include拥有对应的优先级，匹配不到的则默认优先级为INT_MAX(优先级越小排序越靠前)，
#   可以定义负数优先级从而保证某些#include永远在最前面
IncludeBlocks: Regroup
IncludeCategories:
  - Regex: '^<ext/.*\.h>'
    Priority: 2
    SortPriority: 0
    CaseSensitive: false
  - Regex: '^<.*\.h>'
    Priority: 1
    SortPriority: 0
    CaseSensitive: false
  - Regex: "^<.*"
    Priority: 2
    SortPriority: 0
    CaseSensitive: false
  - Regex: ".*"
    Priority: 3
    SortPriority: 0
    CaseSensitive: false
# include块排序
IncludeIsMainRegex: "([-_](test|unittest))?$"
# 缩进修饰符
IndentAccessModifiers: false
# 缩进case块
IndentCaseBlocks: false
# 缩进case标签
IndentCaseLabels: true
# 缩进goto标签
IndentGotoLabels: false
# 预处理缩进
IndentPPDirectives: None
# 缩进extern块
IndentExternBlock: AfterExternBlock
# 缩进宽度
IndentWidth: 4
# 函数返回类型换行时，缩进函数声明或函数定义的函数名
IndentWrappedFunctionNames: false
# 添加尾部注释
InsertTrailingCommas: None
# Lambda块缩进
LambdaBodyIndentation: Signature
# 开始一个块的宏的正则表达式
MacroBlockBegin: ""
# 结束一个块的宏的正则表达式
MacroBlockEnd: ""
# 连续空行的最大数量
MaxEmptyLinesToKeep: 1
# 命名空间的缩进: None, Inner(缩进嵌套的命名空间中的内容), All
NamespaceIndentation: Inner
# 使用的包构造函数初始化式样式
PackConstructorInitializers: NextLine
# 在call(后对函数调用换行的penalty
PenaltyBreakBeforeFirstCallParameter: 19
# 在一个注释中引入换行的penalty
PenaltyBreakComment: 300
# 第一次在<<前换行的penalty
PenaltyBreakFirstLessLess: 120
# 在一个字符串字面量中引入换行的penalty
PenaltyBreakString: 1000
# 对于每个在行字符数限制之外的字符的penalty
PenaltyExcessCharacter: 1000000
# 将函数的返回类型放到它自己的行的penalty
PenaltyReturnTypeOnItsOwnLine: 200
# 指针和引用的对齐: Left, Right, Middle
PointerAlignment: Left
# 预处理的缩进
PPIndentWidth: -1
RawStringFormats:
  - Language: Cpp
    Delimiters:
      - cc
      - CC
      - cpp
      - Cpp
      - CPP
      - "c++"
      - "C++"
    CanonicalDelimiter: ""
    BasedOnStyle: google
  - Language: TextProto
    Delimiters:
      - pb
      - PB
      - proto
      - PROTO
    EnclosingFunctions:
      - EqualsProto
      - EquivToProto
      - PARSE_PARTIAL_TEXT_PROTO
      - PARSE_TEST_PROTO
      - PARSE_TEXT_PROTO
      - ParseTextOrDie
      - ParseTextProtoOrDie
      - ParseTestProto
      - ParsePartialTestProto
    CanonicalDelimiter: pb
    BasedOnStyle: google
# 引用对齐
ReferenceAlignment: Pointer
# 允许重新排版注释
ReflowComments: true
# 允许排序#include
SortIncludes: CaseSensitive
# 允许排序声明
SortUsingDeclarations: true
# 单独的定义块
SeparateDefinitionBlocks: Always
# 在C风格类型转换后添加空格
SpaceAfterCStyleCast: false
# 在赋值运算符之前添加空格
SpaceBeforeAssignmentOperators: true
# 在逻辑非操作符之后插入一个空格
SpaceAfterLogicalNot: false
# 在' template '关键字之后会插入一个空格
SpaceAfterTemplateKeyword: true
# 在用于初始化对象的c++ 11带括号的列表之前(在前面的标识符或类型之后)将插入一个空格
SpaceBeforeCpp11BracedList: false
# 构造函数初始化式冒号前的空格是否删除
SpaceBeforeCtorInitializerColon: true
# 在继承冒号前添加空格
SpaceBeforeInheritanceColon: true
# 控制括号前的单独空格。
SpaceBeforeParens: ControlStatements
SpaceBeforeParensOptions:
  AfterControlStatements: true
  AfterForeachMacros: true
  AfterFunctionDefinitionName: false
  AfterFunctionDeclarationName: false
  AfterIfMacros: true
  AfterOverloadedOperator: false
  BeforeNonEmptyParentheses: false
# 在基于冒号的范围循环之前 添加空格
SpaceBeforeRangeBasedForLoopColon: true
# 在尾随的评论前添加的空格数(只适用于//)
SpacesBeforeTrailingComments: 2
# 在尖括号的<后和>前添加空格
SpacesInAngles: Never
# 在容器(ObjC和JavaScript的数组和字典等)字面量中添加空格
SpacesInContainerLiterals: true
# 在C风格类型转换的括号中添加空格
SpacesInCStyleCastParentheses: false
# 在方括号的[后和]前添加空格，lambda表达式和未指明大小的数组的声明不受影响
SpacesInSquareBrackets: false
# tab宽度
TabWidth: 4
# 使用tab字符: Never, ForIndentation, ForContinuationAndIndentation, Always
UseTab: Never
WhitespaceSensitiveMacros:
  - STRINGIZE
  - PP_STRINGIZE
  - BOOST_PP_STRINGIZE
  - NS_SWIFT_NAME
  - CF_SWIFT_NAME
```

### 错误告警（Lint）

> [!tldr] 推荐 clang-tidy

#### 简介与使用

看这个又是clang开头的应该就知道了，clang-tidy也是llvm项目的一部分，使用方法大同小异，都是在当前项目下放一个配置文件，这个叫`.clang-tidy`，然后就可以在里面指定你想要的检查项目。使用clangd时会自动对相关项进行检查与告警。

不过在前面clangd的部分中提到过，在clangd的配置文件中也可以指定你的默认检查项，具体的可以返回参考相关部分

#### 配置

一开始我是恨不得开启所有的检查项，以求代码的干净。这样确实能快速学到很多更加规范的写法，所以也可以尝试一下。

但是如果指定的检查项太多了的话，打开一个项目全是波浪线，也有点难受。因此学一阵子之后，还是建议回归到开启最关键的和常用的即可。仍然是可以从认可的开源项目中抓一个下来用，也可以参考官方手册进行修改。

这里给出我的一个比较精简的配置：

```yaml
# REFERENCE https://blog.csdn.net/stallion5632/article/details/139545885
Checks: "-*,
  clang-analyzer-core.*,
  clang-analyzer-cplusplus.*,
  modernize-redundant-void-arg,
  modernize-use-bool-literals,
  modernize-use-equals-default,
  modernize-use-nullptr,
  modernize-use-override,
  google-explicit-constructor,
  ; google-readability-casting,
  readability-braces-around-statements,
  readability-identifier-naming.ClassCase,
  readability-identifier-naming.StructCase,
  readability-identifier-naming.TypedefCase,
  readability-identifier-naming.EnumCase,
  readability-non-const-parameter,
  cert-dcl21-cpp,
  bugprone-undelegated-constructor,
  bugprone-macro-parentheses,
  bugprone-macro-repeated-side-effects,
  bugprone-forward-declaration-namespace,
  bugprone-bool-pointer-implicit-conversion,
  bugprone-misplaced-widening-cast,
  cppcoreguidelines-narrowing-conversions,
  misc-unconventional-assign-operator,
  misc-unused-parameters"
WarningsAsErrors: ""
HeaderFilterRegex: ""
CheckOptions:
  # 现代化（Modernize）
  - key: modernize-redundant-void-arg
    value: "true" # 检查并移除函数声明中冗余的 void 参数。
  - key: modernize-use-bool-literals
    value: "true" # 建议使用布尔字面量 true 和 false 代替整数值 0 和 1。
  - key: modernize-use-equals-default
    value: "true" # 建议在默认构造函数、复制构造函数和赋值运算符中使用 = default，以简化代码。
  - key: modernize-use-nullptr
    value: "true" # 建议使用 nullptr 代替 NULL 或 0 来表示空指针。
  - key: modernize-use-override
    value: "true" # 建议在覆盖基类虚函数时使用 override 关键字，以增加代码的清晰性和安全性。

  # Google 代码风格（Google）
  - key: google-explicit-constructor
    value: "true" # 检查并建议在单参数构造函数中使用 explicit 关键字，以防止隐式转换。
  - key: google-readability-casting
    value: "true" # 检查并建议使用 C++ 风格的类型转换（如 static_cast、dynamic_cast、const_cast 和 reinterpret_cast）代替 C 风格的类型转换。

  # 可读性（Readability）
  - key: readability-braces-around-statements
    value: "true" # 建议在单行语句周围添加大括号，以提高代码的可读性和一致性。
  - key: readability-identifier-naming.ClassCase
    value: "CamelCase" # 类名应使用 CamelCase 风格，例如 MyClassName。
  - key: readability-identifier-naming.StructCase
    value: "CamelCase" # 结构体名应使用 CamelCase 风格，例如 MyStructName。
  - key: readability-identifier-naming.TypedefCase
    value: "CamelCase" # 类型定义应使用 CamelCase 风格，例如 MyTypeDef。
  - key: readability-identifier-naming.EnumCase
    value: "CamelCase" # 枚举名应使用 CamelCase 风格，例如 MyEnumName。
  - key: readability-non-const-parameter
    value: "true" # 检查并标识非 const 参数，以提高代码的可读性和安全性。

  # CERT 安全编码标准（CERT）
  - key: cert-dcl21-cpp
    value: "true" # 检查并标识在头文件中不应包含无命名空间的 using 声明和指令，以防止命名空间污染。

  # Bug 检测（Bugprone）
  - key: bugprone-undelegated-constructor
    value: "true" # 检查并标识未委托的构造函数，以确保构造函数的正确性。
  - key: bugprone-macro-parentheses
    value: "true" # 检查并建议在宏定义中使用括号，以防止潜在的错误。
  - key: bugprone-macro-repeated-side-effects
    value: "true" # 检查并标识宏中重复的副作用，以防止潜在的错误。
  - key: bugprone-forward-declaration-namespace
    value: "true" # 检查并标识命名空间前向声明的潜在问题。
  - key: bugprone-bool-pointer-implicit-conversion
    value: "true" # 检查并标识布尔指针的隐式转换，以防止潜在的错误。
  - key: bugprone-misplaced-widening-cast
    value: "true" # 检查并标识错误的宽化转换，以防止潜在的错误。

  # 杂项（Miscellaneous）
  - key: misc-unconventional-assign-operator
    value: "true" # 检查并标识不常见的赋值操作符重载，以确保代码的一致性和可维护性。
  - key: misc-unused-parameters
    value: "true" # 检测未使用的参数。

  # C++ 核心指南（CppCoreGuidelines）
#   - key: cppcoreguidelines-narrowing-conversions
#     value: "true" # 检查并标识可能导致数据丢失的窄化转换。
```

### 构建

#### 单文件（编译选项）

构建，对于单个文件来说其实就是编译嘛，直接用 gcc/g++ 或者 clang/clang++ 加上一堆编译选项就可以了。但是编译选项比较多，很多比较偏的我也不甚精通，所以就列出几个常用的，能把代码跑起来就行，后面的还需进一步学习。比如菜鸟上有一个很直观的介绍编译选项的教程[GCC 参数详解 | 菜鸟教程](https://www.runoob.com/w3cnote/gcc-parameter-detail.html)

最简单的命令就是 `g++ demo.cpp -o demo`，得到的demo就是可执行文件（-o， output，用于指定输出文件的名字）。这背后有很多过程，如果想了解，或者编译出错了，那么就再进一步去了解相关的编译选项。

##### 编译流程相关

编译的流程是: 源文件 -> 预处理 -> 汇编 -> 编译 -> 链接，这些流程都有对应的编译选项，也就是说你可以只编译到任意的中间步骤去查看整成什么样子了。

- `g++ -E demo.cpp -o demo.i`：**-E** 是说只进行预处理（把你include的头文件展开、宏展开等）
- `g++ -S demo.cpp -o demo.s`: **-S** 是说只进行汇编，不编译链接，得到的是汇编码
- `g++ -c demo.cpp -o demo.o`: **-c** 是说只编译得到目标文件，不进行链接

##### 头文件库文件相关

当然有时候需要处理一些跟头文件库文件相关的内容

- `g++ demo.cpp -o demo -I../include -lmylib -L/home/usr/mylib`：**-I**指定头文件查找位置，**-L**指定库文件查找位置，**-l**指定你想链接的库。`-lmylib`对应的库文件全名实际上是 `libmylib.so` 或者 `libmylib.a`，即-l跟的名字是掐头去尾得到的
  - `g++ -static demo.cpp -o demo -lmylib`: **-static** 指定了静态链接（简单来说就是把库文件打包进可执行文件里面，动态链接的库是在别的地方，程序运行的时候才加载），既然是静态链接，要注意你必须得有 `libmylib.a`这个文件，.so只没办法让你静态链接得。
  - `g++ -fPIC -shared mylib.cpp -o libmylib.so`: 这个用于生成动态库，**-fPIC**指定生成与位置无关的代码，**-shared** 说要生成动态库
  - `ar rcs libmylib.a demo1.o demo2.o`: 那么这个就是生成静态库的方法了，这里使用的不是g++，而是`ar`这个工具。静态库类似一种压缩包把，**ar**是个打包工具，你要先用g++生成目标文件，然后再将他们打包成静态库。rcs中，r表示添加文件到归档中，如果存在则替换；c表示归档不存在则创建；s表示创建索引
- 有时候不想每次都手动指定路径，可是头文件和库又不在默认位置，那么可以通过设置环境变量来解决。可以参考[详解Linux下环境变量C_INCLUDE_PATH、CPLUS_INCLUDE_PATH、CPATH以及常见错误_include path-CSDN博客](https://blog.csdn.net/weixin_44327262/article/details/105860213)
  - `C_INCLUDE_PATH/CPLUS_INCLUDE_PATH/CPATH`：它们分别是C、C++、C&C++程序在编译时，默认的头文件搜索位置
  - `LIBRARY_PATH`：**编译时**默认的库文件搜索位置
  - `LD_LIBRARY_PATH`：**运行时**默认的库文件寻找位置

##### 调试优化告警标准

然后是，调试、优化、告警、标准这些，还算常用，但不知道怎么归类了，就叫做风格化吧：
- `g++ demo.cpp -o demo -g`: **-g** 是说要生成一个可以调试的文件，也就是说这个会在可执行文件中保留一些符号信息，用途就是调试，文件体积和性能相对不带的自然会弱一些。
- `g++ demo.cpp -o demo -O3`：**-O3** 是一个优化选项，让编译器采用最激进的方式对你的源文件进行优化，以得到更好的性能（据说有可能有不稳定的情况，反正我没碰到过，相信编译器了），当然自然也有 **-O2 -O1 -O0** 优化越来越保守，-O0是不做任何优化，保留原汁原味的代码体验，一般调试的时候用
- `g++ demo.cpp -o demo -Wall -Werror`: W就是warn，所以 **-Wall** 就是把所有的警告都报告出来，**-Werror** 就是把告警看作是一种错误，这俩放一块要求代码中不能有一处告警，否则就是编译出错直接中止，适合对代码有追求的人和项目。
- `g++ demo.cpp -o demo -g -fno-inline`：**-fno-inline**不内联函数，能够使得调用链更清晰
- `g++ demo.cpp -o demo -std=c++20`: **-std** 指定了你使用的c++标准

##### 项目依赖查看

有时候需要看看项目的依赖，看看g++编译的时候到底都给你找了什么东西引用上了链接上了
- `g++ -MM demo.cpp > demo.d`: **-MM** 用于生成文件的所有依赖关系（除了标准库，**-M**则包括标准库头文件），一般用于Makefile中，可以做到头文件变动时也重新编译文件（否则只有源文件变动才重新编译，可能会出问题）。.d文件长这样demo.o: demo.cpp /usr/include/cstdio ...
- `g++ -H demo.cpp -o demo`: **-H** 用于打印层次化的头文件引用情况，比如你直接引用了ABC，A有引用了DEF，B引用了GH，等等等等，都给你列出来
- `g++ -v demo.cpp -o demo`: **-v**用于可视化整个编译过程，用了谁编译、编译选项如何、去哪里查找的头文件等等。如果编译过程出问题了，可以检查一下
- `g++ -v -E c++ -`: 这个用于打印编译c++时的依赖搜索路径，可能个人比上面的用的多些。常见的场景：我已经安装了某个库了，或者我已经修改了某个头文件了，但是编译器里不符合预期，可以看看是不是压根没查找到它，查找的是别的同名的（比如在wsl中编译，链接的却是windows上msys2中的库）
- `g++ -print-file-name=libmylib.a`: **-print-file-name** 直接打印出，如果让g++去找这个库的话，它的查找路径

##### 性能优化相关

性能优化的值得单开一部分
- `g++ -ftime-trace demo.cpp -o demo`: -ftime-trace 用于显示分析编译耗时
- `Sanitizer`: 是 LLVM/Clang 和 GCC 编译器提供的一套工具，用于在运行时检测程序中的各种错误。它的核心思想是通过在编译时插入额外的检查代码，来捕获内存错误、未定义行为、数据竞争等问题。编译完**直接运行程序**，然后会给你输出错误。后文[Sanitizer一节](#Sanitizer)还会再行介绍（列举一些参考文档罢了，用法就在这里）
  - `g++ -fsanitize=address -o demo demo.cpp`: address 启用 AddressSanitizer，这是一个内存错误检测工具，能够检测内存泄漏、缓冲区溢出、使用未初始化的内存等问题
  - `fsanitize=leak`：仅检测内存泄漏
  - `fsanitize=undefined`：检测未定义行为
  - `fsanitize=thread`：检测多线程问题

#### 项目构建

##### 构建工具概要介绍

项目构建就要使用到构建工具了，常见的有 Make，Ninja，CMake，XMake，QMake, Bazel，VSProject ...

- **Make**: make是一个，怎么说呢，原始而强大的东西，可以很简单，比如你嫌弃用几个g++命令构建出目标文件，再手动链接比较麻烦，就把他们写进makefile中，然后make一下就可以了。这个时候的makefile就像一个shell脚本一样，你直接写shell脚本构建也是一样的。（所以有时候拿makefile当一个脚本启动器也是很不错的）但是它也可以像邪恶的古神一样很复杂，有很多高级配置，依赖查找balabala，复杂到维护这个项目Makefile的人奔溃到谁改一下下就吼谁（只是耳闻）
- **Ninja**：ninja和make类似，它是为了快速构建而生的。我见过手写makefile的，但是见识浅薄，身边没有手写ninja.build的，ninja更多是只负责快速编译，至于如何编译还是使用CMake直接生成的多一些。
- **CMake**：c++的事实构建标准，这一句评价就够了。你可以会很多花里呼哨的构建方式构建器，你可以听很多人说它不好，xxx比它友好一万倍快十万倍，但是你最好还是要会使用它，因为它是事实标准。它的使用我知道一些，但是这里的空间太小了，写不下
- **XMake**：这就是一个CMake的替代品，不过人家作者说了，无意取代CMake，只是在构建什么个人项目、小项目的时候提供一种更友好更快速的选择。它使用lua来写构建脚本，会lua的有福了。同时自带包管理（加分项）。然后就是，可能更新快一些吧，比如比CMake更支持c++20的Modules。
- **QMake**：Qt的构建器，没用过，也没用过Qt。不过现在Qt已经拥抱CMake了，所以，没有必要也没有兴趣的话应该不用管。
- **Bazel**：谷歌做的构建器，使用一种类似python的语法写构建脚本。优势是使用了分布式缓存，构建更快；然后是考虑到了构建环境，可以做到相同环境必定能复现构建；然后还有就是分析目标更精准吧，并行化好、重复构建最少。等等吧，反正就是又快又对。百度的Apollo项目使用的是这个，当然还有很多别的项目也都用了。
- **VSProject**：使用Visual Studio开发的话默认这个，听说很方便，但是我用VS不多，对这个不甚了解

下面就简单介绍下Make、CMake、Bazel，是真的简单介绍，深入学习的话还是要进一步深入学习的。

###### Make

> [!reference]
> - [跟我一起写makefile](https://seisman.github.io/how-to-write-makefile/index.html)这个是比较出名的教程了，想写就跟他一起写吧
> - [之间随便搜罗的一个参考，没细看过](https://www.zhaixue.cc/makefile/makefile-intro.html)

简单来说makefie就是指定目标，指定目标的依赖，然后指定怎么从依赖得到目标的一个脚本，比如:
```makefile
rebuild:
    @rm -rf build && cd build && cmake .. -G"Ninja"
```
这里我指定了目标是rebuild，依赖是空，得到目标的办法是执行那一长串命令。这实际上不是编译，只是给那一长串命令起了个名字叫 `make rebuild`。makefile不只可以用来构建，也可以当作脚本启动器。

> [!warning]
> 不过需要注意的是，makefile中的命令是新启动一个shell来做的，你可以指定使用shell还是使用bash，但你没法指定它不启动一个新的。所以想在makefile中设置当前的环境变量是不可以的

当然它的主业还是构建，简单介绍一些特性，然后直接给几个例子揣摩一下吧

**特殊变量**

- `$@` Target
- `$^` 所有依赖，空格分隔
- `$<` 第一个依赖

**模式替换**

`$(patsubst <pattern>,<replacement>,<text> )`

查找中的单词（单词以“空格”、“Tab”或“回车”“换行”分隔）是否符合模式，如果匹配的话，则以替换。

这里，可以包括通配符“%”，表示任意长度的字串。如果中也包含“%”，那么，中的这个“%”将是中的那个“%”所代表的字串。（可以用“\”来转义，以“%”来表示真实含义的“%”字符）

```makefile
$(patsubst %.c,%.o, a.c b.c)
# 把字串 “a.c b.c” 符合模式[%.c]的单词替换成[%.o]，返回结果是 “a.o b.o”
```

**变量替换引用**

对于一个已经定义的变量，可以使用“替换引用”将其值中的后缀字符（串）使用指定的字符（字符串）替换。格式为`$(VAR:A=B)`或者`${VAR:A=B}`

意思是，替换变量“VAR”中所有“A”字符结尾的字为“B”结尾的字。“结尾”的含义是空格之前（变量值多个字之间使用空格分开）。而对于变量其它部分的“A”字符不进行替换。

```makefile
foo := a.o b.o c.o
bar := $(foo:.o=.c)
# 注意变量不要带 $
SRCS_NODIR := $(notdir $(wildcard $(SRC_DIR)/*$(SRC_SUFFIX)))
OBJS_NODIR := $(SRCS_NODIR:$(SRC_SUFFIX)=$(OBJ_SUFFIX))
```

**模板1**

```makefile
# 一个适合中小规模的makefile模版，基本上自己按照实际情况指定一下 源文件，目标文件，头文件目录，以及源文件后缀就行了。

# ---------------------------------------------------------------------------
# commands
# ---------------------------------------------------------------------------
CC := gcc
LINK := gcc
RM := rm -rf
MV := mv
TAR := tar
MKDIR := mkdir

# ---------------------------------------------------------------------------
# settings
# ---------------------------------------------------------------------------
SRC_SUFFIX := .c
OBJ_SUFFIX := .o
LIB_SUFFIX := .a
BIN_SUFFIX := .exe
DLL_SUFFIX := .so

INC_PREFIX := -I
LIB_PREFIX := -L

OPT_C := -c
OPT_OUT := -o
OPT_LINKOUT := -o

CFLAGS := $(OPT_C)
LIBFLAGS := -Debug

# ---------------------------------------------------------------------------
# directories
# ---------------------------------------------------------------------------
SRC_DIR := ./src
OBJ_DIR := ./obj
INC_DIR := ./inc
LIB_DIR := ./lib /usr/local/lib /lib /usr/lib

# ---------------------------------------------------------------------------
# common settings
# ---------------------------------------------------------------------------
SRCS := $(wildcard $(SRC_DIR)/*$(SRC_SUFFIX))
OBJS := $(patsubst $(SRC_DIR)/%$(SRC_SUFFIX),$(OBJ_DIR)/%$(OBJ_SUFFIX),$(SRCS))
INCS := $(addprefix $(INC_PREFIX), $(INC_DIR))
LIBS := $(addprefix $(LIB_PREFIX), $(LIB_DIR)) $(LIBFLAGS)
TEMPFILES := core core.* *$(OBJ_SUFFIX) temp.* *.out typescript*

# ---------------------------------------------------------------------------
# make rule
# ---------------------------------------------------------------------------
TARGET := loader

.PHONY: all clean

all: $(TARGET)

clean:
$(RM) $(TARGET)$(BIN_SUFFIX) $(OBJS)

$(TARGET):$(OBJS)
$(LINK) $(OPT_LINKOUT)$(TARGET)$(BIN_SUFFIX) $(LIBS) $(OBJS)

$(OBJS):$(OBJ_DIR)/%$(OBJ_SUFFIX):$(SRC_DIR)/%$(SRC_SUFFIX)
$(CC) $(CFLAGS) $(INCS) $(OPT_OUT)$@ $<

```

**模板2**

```makefile
CXX := g++

SRC_DIR := ./src
OBJ_DIR := ./build
BIN_DIR := ./bin
INC_DIR := ./include

VPATH = $(INC_DIR) $(OBJ_DIR) $(SRC_DIR)
vpath %.h $(INC_DIR)

# 一种搜索源文件的方式
# SRC_DIRS = $(shell find $(SRC_DIR) -maxdepth 3 -type d)
# SRCS = $(foreach dir, $(SRC_DIRS), $(wildcard $(dir)/*.cpp))
# TODO: 这样子出来的目标文件，在jing'tai时就找不到依赖了
# OBJS := $(OBJ_DIR)/$(notdir $(patsubst %.cpp, %.o, $(SRCS)))

SRCS := $(wildcard $(SRC_DIR)/*.cpp)
OBJS := $(patsubst $(SRC_DIR)/%.cpp, $(OBJ_DIR)/%.o, $(SRCS))
INCS := $(addprefix -I, $(INC_DIR))
BUILDING_DIRS := $(OBJ_DIR) $(BIN_DIR)

TARGET := adb_lab2.exe
RUN := run.sh

$(TARGET) : $(BUILDING_DIRS) $(OBJS)
	$(CXX) -o $(BIN_DIR)/$(TARGET) $(OBJS)
	@touch $(RUN)
	@echo "$(BIN_DIR)/$(TARGET)" > $(RUN)

# 这里的前缀不能少。makefile不会自动去VPATH里面找这几个目标，而是直接当成新的目标来对待
$(OBJ_DIR)/BufferPoolManager.o : BufferPoolManager.h LRUReplacer.h
$(OBJ_DIR)/DataStorageManager.o : DataStorageManager.h
$(OBJ_DIR)/LRUReplacer.o : LRUReplacer.h
$(OBJ_DIR)/main.o : BufferPoolManager.h

# 一个创建运行时依赖文件夹的方法
$(BUILDING_DIRS) :
	@mkdir $@

# 这叫 静态模式
$(OBJS) : $(OBJ_DIR)/%.o : $(SRC_DIR)/%.cpp
	$(CXX) -o $@ -c $< $(INCS)

.PHONY: all clean output
all : $(TARGET)
clean:
	-rm -rf $(BUILDING_DIRS) test.dbf $(RUN)
output:
	@echo $(SRCS)
	@echo --------------
	@echo $(OBJS)
```

**模板3**

```makefile
CC := gcc
CC_INCLUDE_FLAGS := -I ./include/
CC_FLAGS := $(CC_INCLUDE_FLAGS) -g

# 程序执行的参数
ARGS := ~/codes

DIR_SRC := ./src
DIR_OBJ := ./build
DIR_EXE := ./bin

SRCS := $(shell find $(DIR_SRC) -name "*.c")
OBJS := $(patsubst $(DIR_SRC)/%.c, $(DIR_OBJ)/%.o, $(SRCS))
DPTS := $(patsubst %.c, %.d, $(SRCS))
DIRS := $(DIR_OBJ) $(DIR_EXE)

target := $(DIR_EXE)/my_ls_pro

$(target): $(DIRS) $(OBJS)
	$(CC) $(OBJS) -o $@

$(DIRS):
	@mkdir $@

$(DIR_OBJ)/%.o: $(DIR_SRC)/%.c
	$(CC) $(CC_FLAGS) -c $< -o $@

%.d: %.c
	@set -e; \
	rm -f $@; \
	$(CC) -MM $(CC_FLAGS) $< $(CC_INCLUDE_FLAGS) > $@.$$$$.dtmp; \
	sed 's,\(.*\)\.o\:,$*\.o $*\.d\:,g' < $@.$$$$.dtmp > $@;\
	rm -f $@.$$$$.dtmp

-include $(DPTS)

clean:
	rm -f $(OBJS)
	rm -f $(DPTS)

run:
	make
	$(target) $(ARGS)
```

###### CMake

这里只说基本的，拷下来一个cmake项目怎么运行。具体的CMake项目怎么写怎么组织，可以参考项目 [quick-cmake GitHub](https://github.com/captainwc/quick-cmake)

一般来说分为三步：
1. 项目根目录创建一个build文件夹，然后cd进去。在build文件夹中进行构建，cmake生成的文件就会都在build文件夹内，不会污染源项目，所以十分推荐这种方式。（当然不cd进去直接用 -B build 指定也可以）
2. 运行cmake，获取到构建文件。是的，cmake只负责生成构建文件，具体的构建还是由make、ninja这些完成的。
  - 常用的构建命令就是 `cmake .. -G"Ninja" -DCMAKE_INSTALL_PREFIX=/usr/local -DCMAKE_BUILD_TYPE=Release`
  - -G 指定用谁来构建，有很多选项，比如 -G"Unix Makefiles"生成makefile， -G"MinGW Makefiles"在Windows上使用mingw的makefile，还可以指定使用你的Visual Studio 2017 2022啥的
  - -Dxxx=yyy，-D用于设置变量的值
3. 运行构建命令，得到目标
  - make -j8 生成的 makefile，就用make，-j8 指定 8 个线程
  - ninja -j8
  - cmake --build . -j8： 如果不知道生成的啥，或者想通用性，就用这个

如果需要安装，就再加一步 `make install` or `ninja install` or `cmake --build . --target=install`。是的，install本身也只是一个target而已

###### Bazel

bazel我还在学，这里只说环境怎么配置就好了。想学习第一手资料还是去看[官网](https://bazel.build/install?hl=zh-cn)

首先需要**安装**的有：

- [bazelisk](https://github.com/bazelbuild/bazelisk): 与 bazel 接口完全相同，区别在于这个能自动下载、切换到你需要的bazel版本，也是官方推荐安装的。详情看[使用 Bazelisk 安装 / 更新 Bazel](https://bazel.build/install/bazelisk?hl=zh-cn)
- [buildtools](https://github.com/bazelbuild/buildtools/releases): （`scoop install bazel-buildtools`）包括格式化工具 [buildifier](https://github.com/bazelbuild/buildtools/blob/main/buildifier/README.md)，以及另外两个我没咋用到的 buildozer 和 unused_deps，项目 readme 中有说明
- [sparkpls](https://github.com/withered-magic/starpls): lsp 服务。目前 bazel [官方插件推荐](https://marketplace.visualstudio.com/items?itemName=BazelBuild.vscode-bazel#Using%20a%20language%20server%20(experimental))的有两个（另一个是 [bazel-lsp](https://github.com/cameron-martin/bazel-lsp)，但是恰好它的 6.3 版本在我这有 bug 用不了）
- [bazel-vscode](https://marketplace.visualstudio.com/items?itemName=BazelBuild.vscode-bazel): vscode 插件，all in one。包括构建、高亮、补全。但是要依赖上述几个工具 

**vscode的配置**如下：

```json
{
    "bazel.executable": "bazel",
    "bazel.buildifierExecutable": "buildifier",
    "bazel.lsp.command": "starpls", // alternatively: "bazel-lsp"
    "bazel.enableCodeLens": true,
}
```

**代码补全**

各语言源码补全参考[将 Bazel 与 IDE 集成](https://bazel.build/install/ide?hl=zh-cn#autocomplete-for-source-code)

具体到 C/C++ 来说一般是生成 `compile_commands.json` 文件，官方推荐有两种方式：

1. [kiron1/bazel-compile-commands](https://github.com/kiron1/bazel-compile-commands) ：在 Bazel 工作区中运行 `bazel-compile-commands //...` 以生成 `compile_commands.json` 文件。`compile_commands.json` 文件可让 `clang-tidy`、`clangd` (LSP) 和其他 IDE 等工具提供自动补全、智能导航、快速修复等功能。该工具使用 C++ 编写，并使用 Bazel 的 Protobuf 输出来提取编译命令。
2. [hedronvision/bazel-compile-commands-extractor](https://github.com/hedronvision/bazel-compile-commands-extractor) ：可在各种可扩展的编辑器（包括 VSCode、Vim、Emacs、Atom 和 Sublime）中启用自动补全、智能导航、快速修复等功能。它可让 clangd 和 ccls 等语言服务器以及其他类型的工具利用 Bazel 对 `cc` 和 `objc` 代码编译方式的理解，包括它如何为其他平台配置交叉编译。

#### 依赖管理

有些规模的C++程序，除了标准库外，一般都会依赖一些别的三方库，或者是自己造的轮子库，比如什么日志库、网络库等等。这些依赖大体上可以分为三种，一种是，静态库、动态库，还有一种 header-only 的库，顾名思义就是只有头文件，不用额外让你的程序链接上库文件（它的优劣可以参考这个[c++ - Benefits of header-only libraries - Stack Overflow](https://stackoverflow.com/questions/12671383/benefits-of-header-only-libraries)）。

如何正确防止三方库的位置、处理编译选项，使得程序能够跑起来，似乎是[编译](#构建)部分的事。确实是这样，因为很多程序跑不起来的重要的原因之一，就是第三方依赖找不到、找不对、编译不过，而C++在这一问题上尤为严重。主要是相比较其他主流语言如python(pip)、jvav(maven)、rust(cargo)等，C++没有一个主流的、让各方都信服的包管理工具。可能一方面是C++话事~~人~~委员会不care这个，另一方面或许是，我称之为Cppers的傲慢。都用c++了，轮子不是自己造的，那算什么用c++？（或许这也是一种乐趣吧）。

所以自己写的包，或者peer写的包，就只能通过一种比较原始的方式，集成到项目中来——把他们下载下来、放到指定的位置，然后手动在编译选项中指定它们。但其实也没有那么地原始。从某种程度上来说cmake、bazel这些构建工具也可以算是一种包管理器，比如cmake的`find_package() find_library()`，也可以相当自动地帮你完成依赖寻找的任务。只不过前提是你用的库按照cmake的方式组织了，写好了`Findxxx.cmake`这种。不过一般也都会有，毕竟cmake是事实标准。所以实际上，没有包管理器这件事，是有些不方便，但是其实也并没有一些CPP小黑子说得那么地，无药可救。

但是，事实上C++也是有好用的包管理器的，虽然不是官方的，但也并非什么小作坊的作品。如果你就是习惯有个包管理，那还是相当值得一用的。

> [!warning] Attention
>
> 由于C++的编译产物跟平台是强相关的，windows还是linux，x86还是arm，之间是完全不兼容的。因此这些个包管理呢实际上并不是给你下载个二进制文件就直接用了，而是把源码下载下来，然后用你机器上的工具，自动的给你编译好，再放到一个可以方便找到的地方。所以使用它和不使用的区别就是，它**可能**比你更会编译这个库。当然，都用它来做，更方便管理。



##### vcpkg

> [!tldr] 
>
> ~~微软~~巨硬做的C++包管理，如果不知道用什么，就相信品牌的力量。支持自动下载、编译、管理三方库，与 CMake 深度集成。支持几千个C++库了，基本涵盖所有常用的。详细学习请参考 [vcpkg 文档 | Microsoft Learn](https://learn.microsoft.com/zh-cn/vcpkg/)

使用起来很简单，跟着下面做就行了。

```bash
# 安装
git clone https://github.com/microsoft/vcpkg
cd vcpkg

## 执行引导脚本（Windows 使用 .\bootstrap-vcpkg.bat）
./bootstrap-vcpkg.sh

# 添加环境变量（可选）
export VCPKG_ROOT="/path/to/vcpkg"
export DEFAULET_TRIPLET="x64-linux"
export PATH=$VCPKG_ROOT:${PATH}

# vcpkg还有一个一键和 visual studio集成的命令，但我不咋用vs，给搞忘了。有兴趣可以搜一下
```

然后你就可以使用vcpkg了。需要注意的是，vcpkg有两个比较重要的环境变量，`VCPKG_ROOT`和`DEFAULT_TRIPLET`，前者用于搜索vcpkg的位置，后者，`triplet`，三元组，就是描述你平台的三个关键词，比如`x64-linux-static`，就说明要安装x64版本linux上的静态库。具体的参考 [Triplet | Microsoft Learn](https://learn.microsoft.com/zh-cn/vcpkg/users/triplets)

```bash
# 搜索
vcpkg search spdlog

# 安装
vcpkg install spdlog

# 在cmake中使用
## 法 1，使用vcpkg的toolchain。 注意 toolchain的指定要在 project(xxx) 之前
set(CMAKE_TOOLCHAIN_FILE "$ENV{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")
find_package(spdlog REQUIRED)
target_link_libraries(your_target PRIVATE spdlog::spdlog)

## 法2：设置CMAKE_PREFIX_PATH，这样相当于只是告诉cmake了查找库的位置，侵入性更小
list(APPEND CMAKE_PREFIX_PATH "$ENV{VCPKG_ROOT}/installed/$ENV{VCPKG_DEFAULT_TRIPLET}")
find_package(spdlog REQUIRED)
target_link_libraries(your_target PRIVATE spdlog::spdlog)

## 更详细专业的用法参考 https://learn.microsoft.com/zh-cn/vcpkg/users/buildsystems/cmake-integration
```



##### conan

conan是一个去中心化的c++包管理，可以指定具体的库版本（这么说是因为vcpkg在哪个场景来着，只支持使用最新版的库），可以构建自己的库仓库。使用的人也很多，支持的库也有几千个。做这种包管理的，还做出名堂来的，你所了解的常用的库肯定都会支持，所以这方面不必担心。

不过我用的不多，详情还是搜一下。以下内容来自deepseek。

```bash
# 安装
pip install conan

# 创建默认 profile（生成 ~/.conan2/profiles/default）
conan profile detect

# 创建配置文件 conanfile.txt
[requires]
fmt/10.1.0

[generators]
CMakeDeps
CMakeToolchain

[layout]
cmake_layout

# 安装依赖并生成配置
mkdir build && cd build
conan install .. --build=missing

# 集成到 CMake
include(${CMAKE_BINARY_DIR}/generators/conan_toolchain.cmake)
find_package(fmt REQUIRED)
target_link_libraries(your_target PRIVATE fmt::fmt)
```



##### apt / pacman

严格来说呢，这些个并不是C++的包管理！它们是系统的包管理，但是很多时候你缺少依赖，直接一个`sudo apt install libxxx-dev`也就解决了（在arc linux，或者在msys2中，可以是`pacman -S libxxx`，还可能是`yum`等等等等）。那么，这怎么不算管理呢？（这个下载的是真的二进制文件，没有编译的步骤，跟前面说的vcpkg和connan那种包管理不同）

不过需要注意的是，通过这样安装的库，是全局的。有可能你这个项目安装了这个版本的库，下个项目想用的是另一个版本的，这就会导致冲突。不过对于很多基础的库，像什么boost啦、opencv啦，直接安装是没问题的，也是最最方便的（甚至都可以不用加编译选项）。



### 调试

程序跑起来有错误是相当正常滴，用各种方法，找到错误在哪并修改，再找再改，直到把程序跑起来的过程就是调试。

当然这里说得更广义一些。有时候程序只是跑起来了，但可能并不那么健康。能跑不一定就对，只是暂时没执行到有错误的逻辑而已。如何查找预防这种隐藏起来的错误，也算调试了。还有就是，程序写好了，性能如何呢？跑得对，但是跑得慢，怎么让它快起来，优化性能，也是一种调试。下面逐个进行简单介绍。

#### 程序调试

找错误一般来说有以下几种方法：

##### 瞪眼法

这应该是最直观也是最常用的。不管你用的什么构建工具，编译出错，它都会告诉你错误是什么。有的报错信息很直观，你直接就能看懂。有的报错信息很冗长，像乱码一样，刚接触你可能看不懂，但是看多了，一看到某种乱码的模式，根据经验，或者捕捉关键词，就能立马明白错误是什么，应该怎么改。**读报错信息，然后明白过来哪里错了，这就是瞪眼法**。

关于冗长的报错信息如何看，可以参考《Effective STL》的 `第49条：学会分析与STL相关的编译器诊断信`，简单来说就是，C++有很多模板，即使你没用，你用的标准库、三方库中也会用。报错信息看着很长，其实很多都是模板展开后的结果。肉眼排除掉冗余信息（或者写个过滤的小工具 [ErrorReducer.py](https://github.com/captainwc/.dotfiles/blob/main/scripts/py/ErrorReducer.py)）能够使得错误更直观一些。不过这些可能都是老巴式了，直接复制粘贴到AI中，让ai帮你分析，也是不错的。不过最好分析完了理解一些，不然每次都只会复制粘贴问AI，长进不大。

##### print 大法

当小脑袋瓜子栈溢出的时候，反应不过来到底是怎么个错误法了，一般就会选择在代码的某些位置上写上一串神秘字符：`printf("【x=%d, y=%s】\n", x, y);`或者`std::cout<<"========\n";` 或者 `LOG("XXXXXXX");`这是很直观的，也基本是无师自通的。

不管是printf还是直接读日志，都可以算是print大法了吧，即，**在程序的关键位置输出一些有特征的信息，从而判断程序运行情况**。有人嘲笑这种太土太Low，不会开个gdb打个断点就不能算是程序员；有人对这种推崇备至，说是真正高级的程序员谁tm打断点，都是看日志。我的看法是，管它高级不高级，有效的最快最对的就是最好的。

> [!warning] 
>
> 刚学的时候小脑袋瓜子不要装一堆饭圈的东西，这个高级那个老土。有用就行，装杯那是以后的事。程序调完了，丝滑运行了，喝杯茶冲冲浪，看看网友吹B，瘾上来了也下场小装一下，那会才是需要分辨谁High谁Low的时候。

##### gdb

gdb是一个命令行运行的黑窗口工具，作用是可以让你在程序运行的时候，让它在指定的位置停下，然后还能让你读取停下来的位置的各种变量值是多少，的一个工具。非常强大，但是背后的原理也不算太复杂，通过什么系统调用实现的感兴趣也可以一学，甚至可以一做。

要想使用gdb，在编译程序的时候要添加上一个[编译选项](#单文件)`-g`，保留程序的各种符号信息，作用是调试的时候能看到源代码，如果不加也能调试，但是看不到源码（可以硬看汇编）。

调试的工具有很多，但是基本的原理都一样，就是打断点，分析断点，分析变量取值，分析调用栈等等。这里简单罗列一下：

[<img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img1742197079944.png" style="max-width:40%;float:right">](#gdb)

- **gdb**：原汁原味，说开就开。缺点是命令行使用不够直观，程序是运行了是断点了，但是看不到对应的源代码是什么，很难受。不过gdb也有一个`tui`模式，可以呈现简单的界面。可以通过`layout src/split/asm`等切换布局，一定程度上解决了看不了源码的问题。
- **lldb**：llvm项目的，和gdb的关系，大概就像是clang和gcc的关系吧
- **[cgdb](https://cgdb.github.io/)**：值得推荐的一个工具，完美解决了gdb没有界面不好看的问题，能够将界面分为两块，左边显示源代码，可以直接打断点，右边显示gdb，直接操作gdb。支持VIM快捷键。（如右图所示，就是在Vim的floatterm直接运行cgdb进行调试的样子，很轻量，推荐）
- **IDE**：ide的图形界面做的最完善，功能很多，如果不想折腾，直接用也很舒服。至于什么不能用IDE的情况，以后碰上了再学。（当然还是那句话，都用IDE了，可能配环境的问题就没那么大了，也就不会看到这了）

> [!reference] links
>
> - [gdb快速上手 | SHUAIKAI's Blog](https://kaikaixixi.xyz/工具使用/gdb教程/)
> - [cgdb官网](https://cgdb.github.io/)
> - [cgdb手册](https://cgdb.github.io/docs/cgdb.htm)

#### 安全检查

c++程序的安全问题，最出名的当属内存泄，以及指针相关的空指针野指针悬挂指针，此外还有一些除零、越界、溢出等等吧。这一节究竟是按照工具分类，还是按照错误分类呢？纠结了一下，还是直接介绍工具吧。读者知道有这么些个工具，等环境配好了，真个碰到对应场景的时候，再搜相关的问题，见到这些名词有个印象即可。

##### Valgrind

详情请参考 [Valgrind快速上手 | SHUAIKAI's Blog](https://kaikaixixi.xyz/工具使用/valgrind快速上手/)

简单来说，valgrind提供了如下几个工具。使用方法就是 `valgrind --tool=<tool> ./<your_program>`。不同的工具可能还会输出一些文件，这些文件具体又怎么可视化，详情直接一搜即可。

- **memcheck**： （默认tool）探测程序中内存管理存在的问题。它检查所有对内存的读/写操作，并截取所有的malloc/new/free/delete调用。因此memcheck工具能够探测到以下问题：1）使用未初始化的内存 2）读/写已经被释放的内存 3）读/写内存越界 4）读/写不恰当的内存栈空间 5）内存泄漏 6）使用malloc/new/new[]和free/delete/delete[]不匹配。 7）src和dst的重叠
- **cachegrind**：模拟执行CPU中的L1, D1和L2 cache，因此它能很精确的指出代码中的cache未命中，可以打印出cache未命中的次数，内存引用和发生cache未命中的每一行代码，每一个函数，每一个模块和整个程序的摘要。
- **massif**：堆栈分析器，它能测量程序在堆栈中使用了多少内存，告诉我们堆块，堆管理块和栈的大小
- **helgrind**：主要用来检查多线程程序中出现的竞争问题。Helgrind 寻找内存中被多个线程访问，而又没有一贯加锁的区域，这些区域往往是线程之间失去同步的地方，而且会导致难以发掘的错误
- **callgrind**：收集程序运行时的一些数据，函数调用关系等信息。用`callgrind_annotate`可以对输出文件进行可视化 `callgrind_annotate --auto=yes callgrind.out.[pid] > log.log && vim log.log`

##### Sanitizer

Sanitizer最开始是google做的一个错误检查工具，通过在你的代码中插入一些东西，然后运行你的程序，这些东西就会把你的错误给你报出来。现在三大编译器都已经默认支持这个编译选项了。具体怎么用在上文[性能优化相关](#性能优化相关)的编译选项中已经介绍过了，直接加编译选项就好:

 `g++ -fsanitize=address/leak/undefined/thread -o demo demo.cpp`

> [!reference]
>
> - [Clang 21.0.0git documentation](https://clang.llvm.org/docs/) 这里面有许多关于clang用法的介绍，自然包括Address/Thread/Memory... Sanitizer，就不一一列举链接了
>   - [AddressSanitizer — Clang 21.0.0git documentation](https://clang.llvm.org/docs/AddressSanitizer.html)
> - [google/sanitizers 项目文档](https://github.com/google/sanitizers) google sanitizer项目原汁原味的文档
>   - [AddressSanitizer & LeakSanitizer · google/sanitizers Wiki](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer)
>   - [ThreadSanitizer · google/sanitizers Wiki](https://github.com/google/sanitizers/wiki/ThreadSanitizerCppManual)
>   - [MemorySanitizer · google/sanitizers Wiki](https://github.com/google/sanitizers/wiki/MemorySanitizer)
>
> - [AddressSanitizer 的一些错误示例代码 | Microsoft Learn](https://learn.microsoft.com/zh-cn/cpp/sanitizers/asan-error-examples?view=msvc-170)

##### 静态分析

静态分析有很多工具，像[Cppcheck](http://cppcheck.net/)，[ClangStaticAnalyzer(CSA)](https://clang.llvm.org/docs/ClangStaticAnalyzer.html)，[cpplint](https://github.com/cpplint/cpplint)，前面说的[clang-tidy](#错误告警lint)也算是吧。

个人浅显的总结：cppcheck检查逻辑错误，csa能更深入的检查运行时错误，cpplint检查风格是否符合google style，clang-tidy写代码的时候给lint。有很多吧，感兴趣随便搜一下，比如这一篇[ C++静态代码检查工具？ - 知乎](https://www.zhihu.com/question/22178103)，这一篇[开源C++静态代码检测工具clang-tidy、cppcheck和oclint的比较_clang-tidy cppcheck-CSDN博客](https://blog.csdn.net/stallion5632/article/details/139569439)......

###### CppCheck

[Cppcheck](http://cppcheck.net/) 是 C/C++ 代码的静态分析工具，它提供**独特的代码分析**来检测错误（大概就是说可以检查一些别的检查不出来的错误。只检查编译器检查不出来的bug，不检查语法错误），专注于检测**未定义的行为**和危险的编码结构。

**使用**

`cppcheck [OPTIONS] [files or paths]`

1. `cppcheck . 2> err.txt`: 递归检查当前文件夹，并在屏幕上打印进度，将错误写入文件
2. `cppcheck --quiet ../myproject/`: 递归检查 ../myproject/，并且不打印进度
3. `cppcheck --enable=all --inconclusive --library=posix test.cpp`: 检查test.cpp，启用所有检查
4. `cppcheck -I inc1/ -I inc2/ f.cpp`: 检查f.cpp并搜索inc1/和inc2/中的include文件
5. `–enable=all,warning,style,performance,portability,information,unusedFunction,missingInclude`启用更多检查。默认情况下只显示错误消息
6. `--platform=unix32,unix64 ,win32A,win32W,win64,avr8,elbrus-e1cp,pic8,pic8-enhanced,pic16,mips32,native,unspecified`: 指定平台，精确检查
7. `-i <dir or file>` 忽略源文件或源文件目录
8. `--suppress=syntaxError`屏蔽该类错误
10. `-j n` 启动多线程同时进行检查。

###### ClangStaticAnalyzer

[Clang Static Analyzer](https://clang-analyzer.llvm.org/) 是一个工业级的静态源码检测工具，可以用来发现 C、C++ 和 Objective-C 程序中的 Bug。它既可以作为一个独立工具（scan-build）使用，也可以集成在 Xcode 中使用。Clang Static Analyzer 建立在 [Clang](https://translate.googleusercontent.com/translate_c?depth=1&hl=en&ie=UTF8&prev=_t&rurl=translate.google.com&sl=en&sp=nmt4&tl=zh-CN&u=http://clang.llvm.org/&xid=25657,15700022,15700124,15700149,15700186,15700191,15700201,15700214,15700230&usg=ALkJrhj9knBnTdXjPrAgXaC9z2j7dV8gtw) 和 [LLVM](https://translate.googleusercontent.com/translate_c?depth=1&hl=en&ie=UTF8&prev=_t&rurl=translate.google.com&sl=en&sp=nmt4&tl=zh-CN&u=http://llvm.org/&xid=25657,15700022,15700124,15700149,15700186,15700191,15700201,15700214,15700230&usg=ALkJrhjIJQVcd1RzZDUK95Dk6dujPHquDQ) 之上。严格地讲，它是 Clang 的一部分，因此它是完全开源的。Clang Static Analyzer 使用的静态分析引擎被实现为一个 C++ 库，可以在不同的客户端中重用，因此拥有很高的可扩展性。

[scan-build](https://clang.llvm.org/docs/analyzer/user-docs/CommandLineUsage.html#scan-build)是它自带的命令行工具，可以**劫持**你的构建工具来用（直接在工具如clang++、cmake前面加上scan-build即可）。找到问题后会给你生成一个一个可视化的报告，非常易读，用scan-view查看。

```bash
#(1) 单文件用scan-build

scan-build clang++ demo.cc -o demo

#(2) cmake项目用 scan-build

mkdir build && cd build

## 在你的cmake前面添加上scan-build
scan-build cmake ..

## 然后构建
scan-build cmake --build . -j8

## 可能的输出
# scan-build: Analysis run complete.
# scan-build: 8 bugs found.
# scan-build: Run 'scan-view /tmp/scan-build-2025-04-08-130150-171264-1' to examine bug reports.

## 根据提示命令，用scan-view就可以查看报告
scan-view /tmp/scan-build-2025-04-08-130150-171264-1
```

##### 形式化验证

形式化验证能够从数学的角度对代码进行分析验证，查找问题。常见的工具有CBMC和ESBMC。可能更偏学术一些，可以了解下有这么种东西。

###### CBMC 

CBMC(C Bounded Model Checker)是一个有界模型检查器，专门用于C和C++程序。它通过将程序转换为逻辑公式，并使用SAT求解器来验证这些公式，从而检测程序中的错误。CBMC特别适用于验证嵌入式系统和安全关键软件。

**使用**：`cbmc [opt] file.cpp`，可添加选项如`--bounds-check`。支持生成验证报告（`--xml-ui`）。

###### ESBMC

ESBMC(Efficient SMT-Based Context-Bounded Model Checker)是一个基于SMT（可满足性模理论）的有界模型检查器，支持C、C++和Java程序。它使用SMT求解器来验证程序的属性，能够处理更复杂的逻辑和数据结构。ESBMC在验证并发程序和实时系统方面表现出色。

**使用**：`esbmc [opt] file.cpp`，输入C++代码并指定属性（如`--memory-leak-check`）。通过`esbmc file.cpp`执行验证，输出反例路径或确认安全性。

#### 性能分析

##### perf

暂时写不动了，等着后续吧。如果你看到的时候还没有后续，直接STFW得了。

### 运行

程序编译好了，怎么跑起来，一般不是问题。但偶尔确实有问题，出去系统格式不对这种低级错误之外，最常见的问题应该是动态库找不到。

找不到的原因有很多，可能程序是你自己编译的，但是输出到bin目录，动态库却在build目录、在lib目录；可能程序不是你编译的，你只有可执行文件，没有动态库文件；可能你有动态库文件，但是没放在默认能找到的位置。说来说去，总结一句话：**动态库放的位置不对**。（没动态库也算位置不对，相当于是放在了人家电脑上，没放自己电脑上）

那么放哪里才算对呢？=> 放系统默认位置，和当前目录下。最快的验证方法就是把动态库拷贝到当前文件夹再运行，一般就能跑起来了。

如何判断缺没缺动态库可以用 `ldd` 这个工具。`ldd [your_excutable]` 他会告诉你这个程序依赖哪些动态库，找到的在哪个位置，没找到的又是谁。

如果是安装的库，一般都会安装到默认位置，肯定能找到。如果是自己编译的库，那么不推荐放到系统默认位置，可以通过一个环境变量来指定：`LD_LIBRARY_PATH`，它是程序**运行**的时候默认的动态库搜索位置。

```bash
# 临时添加路径
export LD_LIBRARY_PATH=/path/to/libs:$LD_LIBRARY_PATH

# 永久配置（写入 ~/.bashrc 或 /etc/ld.so.conf）
sudo ldconfig  # 刷新缓存
```

## 具体编辑器配置

### vscode

### vim

### nvim

### sublime

## 学习资料推荐

### 手册类

[zh.cppreference.com](https://zh.cppreference.com/w/首页) and [cppreference.com](https://en.cppreference.com/w/)：最经典、最好用、最全面的c++在线手册，建议有问题直接去这上面查。怎么更方便的使用可以参考[手册速查方案（如cppreference） | SHUAIKAI's Blog](https://kaikaixixi.xyz/环境配置/zeal-dataset中文cppreference配置/)

[Learn Contemporary C++ | Concise&Visual Examples | hacking C++](https://hackingcpp.com/)：图形化展示各种c++标准库组件，非常非常直观理解、记忆、回忆各种api

[Google C++项目风格指南](https://zh-google-styleguide.readthedocs.io/en/latest/google-cpp-styleguide/contents.html)：谷歌的C++项目风格指导

### 工具类

[Compiler Explorer - Goldbolt](https://godbolt.org/)：一个非常有名的C++在线编辑器/IDE。它可以（1）用各种版本的编译器，编译运行你的c++代码或者cmake项目。（2）也能让你实时查看你写的c++代码每一段每一行对应的汇编，方便理解底层。（3）还可以作为一个代码分享工具，向别人原汁原味的展示你的代码。

[CppInsight](https://cppinsights.io/)：让你查看c++代码预处理后的样子。比如头文件展开、lambda表达式实现等等

### 其他

[ISO/IEC JTC1/SC22/WG21 - The C++ Standards Committee - ISOCPP](https://open-std.org/JTC1/SC22/WG21/)：C++话事人
