---
title: libclang-py使用介绍
date: 2025-06-10
series: ["快速上手"]
tags: ["C++","编译原理"]
---

# libclang python binding API介绍

> [!info]
>
> `libclang` 是一Clang提供的C接口库，具体介绍参见 [clang: libclang: C Interface to Clang](https://clang.llvm.org/doxygen/group__CINDEX.html)
>
> 它同时还提供了 python bindings，对有关的C接口进行了封装，方便用python代码来快速操作C/C++源码
>
> 本文正是对 libclang 的这一 python bindings 的使用做出简要介绍
>
>
> 同时值得一提的是，python 的这个 `clang` 包，也可以作为一个python封装C接口库的例子作为参考学习用

## 安装

安装最重要的点是要注意跟你系统上的`clang/llvm`版本要一致。可以通过`clang -v`来查看你真正需要的版本，然后：

```shell
# 版本号替换为你的clang的版本
pip install clang==20.1.3
```

## 基本概念介绍

- `translation_unit`：翻译单元，我个人理解为就是一个c++编译单元对应的一棵语法树。通过 tu 可以获取一些全局信息比如头文件、诊断、补全信息等等
- `Cursor`：语法树上的节点，通过 cursor 可以对语法树进行操作。（个人感觉叫做 `node` 更直观）
- `Token`：Cursor 是有结构的树上节点，对应的是树，Token 则是一个个的“单词”，可以用流的概念去类比
- `CursorKind`：NodeType，节点类型。就是描述了什么函数节点、变量声明节点、分支节点等等

## 使用步骤

```python
#（1）导包
from clang.cindex import Config, Cursor, CursorKind, Index, Rewriter

#（2）导入动态库（什么libclang.dll、libclang.so、libclang.so.1之类的，特别注意版本）
Config.set_library_file("/path/to/your/libclang.dll")

#（3）解析源文件获取语法树
source_file = "example.cpp"
compile_args = ["-std=c++20", "-Wall"]
tu = Index.create().parse(source_file, args=compile_args)

#（4）对语法树进行各种你想要的读写变换操作
## tu 就是 translation_unit
## tu.cursor 获取到的是语法树的根节点
## tu.cursor.get_children() 可以获取节点的孩子，开始你对语法树的遍历
```

## API说明

这家伙库基本没啥手册（反正我没找到），但是库本身不复杂，所以最好的api手册其实就是代码本身。

> [!tip]
>
> 推荐直接找到`[python install path]/Lib/site-packages/clang/cindex.py` 这个文件（跳转过去就好了），然后查看该文件的代码大纲，什么类有什么API就一目了然了。过一遍做到心中有数，用的时候再说

这里介绍简单介绍一些常用的类具有的API，供参考

### TranslationUnit 翻译单元

```python
# tu 是一个 TranslationUnit类型的对象

tu.cursor # 获取语法树根节点
tu.diagnostic # 获取诊断信息
tu.get_includes() # 获取引用的头文件
tu.get_tokens() # 获取 token 流
```

### Cursor 语法树节点

```python
# node 是一个 Cursor 类型的对象，这个基本上就是最常用的了，接口也非常非常多

node.walk_preorder() # 深度优先遍历序列
node.get_children() # 获取子节点
...
node.location # 节点位置
node.extent # 节点的代码块范围（start loc -> end loc）
node.kind # 节点的类型（描述这是个什么节点）
node.type # 节点对应的元素的类型（如果有类型的话）
node.spelling # token的名字（不一定有）
node.displayname # 完整的名字（比如函数会把参数也带上）
node.mangled_name # mangle之后的名字
...
node.semantic_parent # 节点的 semantic parent（语义上的父节点，比如成员函数类外声明父节点还是类）
node.lexical_parent # 节点的 lexical parent（词法父节点，类外声明了词法父就是全局，类内声明就是类）
...
node.get_arugments() # 获取参数（如果是FUNCTION_DECL的话）
node.result_type # 当前节点的结果的类型（如果有的话，比如函数返回值）
node.get_definition() # 获取定义节点（如果是reference的话）
...
node.is_const_method() # 顾名思义
...
```

### CursorKind 节点类型

```python
# 有一些enum值，比如
FUNCTION_DECL
CXX_METHOD
VAR_DECL
PARM_DECL
NAMESPACE
IF_STMT
...

# 自身也是有一些函数的，方便做判断
node.kind.is_declaration()
node.kind.is_reference()
node.kind.is_expression()
node.kind.is_statement()
...
```

### Type 节点元素类型

```python
# 首先你得是这些类型才行
node.type.get_align() # 获取结构体元素的对齐方式
node.type.get_fields() # 遍历成员
node.type.get_array_size() # 常数组的size
node.type.get_pointee() # 获取指针指向对象的类型
node.type.get_result() # 函数的返回值类型
node.type.is_pod() # 是POD
...
node.type.spelling # 名字
node.type.kind # 返回 TypeKind
```

### TypeKind 描述类型的类型

```python
# 一堆枚举，比如
BOOL
INT
LONGLONG
WCHAR
FUNCTIONNOPROTO
AUTO
ATOMIC
...
node.type.kind.spelling # 字符串
```

### SourceLocation 描述源码位置

```python
node.location.file # 文件名
node.location.line # 行
node.location.column # 列
```

### SourceRange 描述源码范围

```python
node.extent.start # 开始的location
node.extent.end # 结束的location
```

### Rewriter 保存语法树修改

```python
writer = Rewriter.create(tu) # 从编译单元创建一个rewriter对象
writer.insert_text_before(loc, code) # 在指定location插入内容
writer.remove_text(extent) # 删除一个范围内的代码
writer.replace_text(extent, replacement) # 替换一个范围内的代码
writer.overwrite_changed_files() # 保存所有修改
writer.write_main_file_to_stdout() # 输出当前状态的语法树对应的文件
```

...

等等吧，直接看代码就是了

## 使用示例

### 类型判断

```python
class NodeTypeJudger:
    @staticmethod
    def is_function(node: clang.cindex.Cursor) -> bool:
        return node.kind in {
            clang.cindex.CursorKind.FUNCTION_DECL,
            clang.cindex.CursorKind.CXX_METHOD,
            clang.cindex.CursorKind.FUNCTION_TEMPLATE,
            clang.cindex.CursorKind.CONVERSION_FUNCTION
        }
```

### 打印节点

```python
class NodeFormater:
    @staticmethod
    def format_as_detail_info(node: clang.cindex.Cursor) -> str:
        return f"""NAME:     {node.displayname}
KIND:     {node.kind.name}
TYPE:     {node.type.spelling}
LINKAGE:  {node.linkage.name}
LOCATION: {NodeFormater.format_location(node.location)}
RANGE:    {NodeFormater.format_extent_shortly(node.extent)}"""

    @staticmethod
    def format_as_ast(node: clang.cindex.Cursor) -> str:
        ast_list: list[str] = []

        def _helper(n: clang.cindex.Cursor, intend: int) -> None:
            ast_list.append(
                f"{' '*intend}[{n.kind.name}][{n.displayname}]   [{NodeFormater.format_extent(n.extent)}]"
            )
            for child in n.get_children():
                _helper(child, intend + 2)

        _helper(node, 0)
        return "\n".join(ast_list)

    @staticmethod
    def format_function(node: clang.cindex.Cursor) -> str:
        if NodeTypeJudger.is_function(node):
            func_name = node.spelling
            return_type = node.result_type.spelling
            args = ", ".join(
                [f"{n.type.spelling} {n.spelling}" for n in node.get_arguments()]  # type: ignore
            )
            return f"{return_type} {func_name}({args})"
        return ""

    @staticmethod
    def format_var(node: clang.cindex.Cursor) -> str:
        if node.kind == clang.cindex.CursorKind.VAR_DECL:
            type = node.type.spelling
            name = node.displayname
            return f"{name} ({type})"
        return ""

    @staticmethod
    def format_location(loc: clang.cindex.SourceLocation) -> str:
        return f"{loc.file}:{loc.line}:{loc.column}"

    @staticmethod
    def format_extent(range: clang.cindex.SourceRange) -> str:
        return f"({NodeFormater.format_location(range.start)} => {NodeFormater.format_location(range.end)})"

    @staticmethod
    def format_extent_shortly(range: clang.cindex.SourceRange) -> str:
        return f"({range.start.line},{range.start.column}) -> ({range.end.line},{range.end.column})"

```

### 树上游走

```python
class TreeVisitor:
    @staticmethod
    def collect_nodes(
        root_cursor: Cursor, node_filter: Callable[[Cursor], bool]
    ) -> list[Cursor]:
        ret = []
        for node in root_cursor.get_children():
            if node_filter(node):
                ret.append(node)
            ret.extend(TreeVisitor.collect_nodes(node, node_filter))
        return ret

    @staticmethod
    def travel_tree(root_cursor: Cursor, node_oper: Callable[[Cursor]]):
        for node in root_cursor.get_children():
            node_oper(node)
            TreeVisitor.travel_tree(node, node_oper)
       
# 可能的filter
def filter_branch_node(node) -> bool:
    return node.kind in [
        CursorKind.IF_STMT,
        CursorKind.SWITCH_STMT,
    ] and "modern" in str(node.location.file)

def filter_var_decl_node(node) -> bool:
    return node.kind in [
        CursorKind.VAR_DECL,
        CursorKind.FUNCTION_DECL,
    ] and "modern" in str(node.location.file)
```

### 结构变换

在所有`if-elif-else`结构的分支第一行插入语句（TODO: 写这个的时候还没发现 `Rewirter` 这个接口，因此采用的是直接读写文件行的方式。当然可以使用`Rewriter`来重构此函数）

```python
class NodeComposer:
    @staticmethod
    def __insert_in_if_stmt_helper(
        file_contents: list[str],
        insert_pos: int,
        node: Cursor,
        if_branch: str,
        else_branch: str,
    ):
        children = list(node.get_children())
        csz = len(children)
        if csz < 2:
            print("Strange If Node with less than 2 children!!!")
        elif csz == 2:
            if_pos = children[1].location.line
            real_if_branch = f'{" "*insert_pos}{if_branch}\n'
            file_contents.insert(if_pos, real_if_branch)
        elif csz == 3:
            if_pos: int = children[1].location.line
            real_if_branch = f'{" "*insert_pos}{if_branch}\n'
            if children[2].kind == CursorKind.IF_STMT:
                NodeComposer.__insert_in_if_stmt_helper(
                    file_contents, insert_pos, children[2], if_branch, else_branch
                )
            else:
                else_pos = children[2].location.line
                real_else_branch = f'{" "*insert_pos}{else_branch}\n'
                file_contents.insert(else_pos, real_else_branch)
            file_contents.insert(if_pos, real_if_branch)
        else:
            print("Strange If Node with more than 3 children!!!")

    @staticmethod
    def insert_in_if_stmt(node: Cursor, if_branch: str, else_branch: str):
        """在if-else_if-else节点中，插入想要的语句"""
        if node.kind != CursorKind.IF_STMT:
            return
        file_contents = []
        with open(str(node.location.file), encoding="utf-8", mode="r") as f:
            file_contents = f.readlines()
            insert_pos = node.location.column + 3
            NodeComposer.__insert_in_if_stmt_helper(
                file_contents, insert_pos, node, if_branch, else_branch
            )
        with open(str(node.location.file), encoding="utf-8", mode="w") as f:
            f.writelines(file_contents)

    @staticmethod
    def insert_in_all_if_stmt(
        if_stmt_list: list[Cursor], if_branch: str, else_branch: str
    ):
        """在所有的if-else节点插入。关键在于，要注意倒序插入"""
        for node in sorted(if_stmt_list, key=lambda n: n.location.line, reverse=True):
            NodeComposer.insert_in_if_stmt(node, if_branch, else_branch)
```



