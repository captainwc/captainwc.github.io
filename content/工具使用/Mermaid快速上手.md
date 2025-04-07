---
title: Mermaid快速上手
categories: [工具使用]
date: 2025-04-07
series: [快速上手]
tags: [mermaid]
---

# Mermaid 快速上手

> [!reference]
> - [在线mermaid编辑器](https://mermaid-live.nodejs.cn/edit)
> - [Mermaid中文手册](https://mermaid.nodejs.cn/intro/)


> [!note]
> - 接受 front yaml 进行配置，可以在其中指定主题（`theme: neutral, default, forest`）、字体（`fontFamily: "Maple Mono NF"`）、`title` 等等
> - 图表方向：`LR RL TB/TD BT`

## 流程图 (graph/flowchart)

> [!tip]
> - 支持连对，以及一对多/多对多 `A -> B & C -> D & E -> F`
> - 常见线条：`-.->, ==>, == xx ==>, --->, --.xx.-->` (一个短横是不行的；线上评论要空格)
> - [更多箭头类型](https://mermaid.nodejs.cn/syntax/flowchart.html#new-arrow-types): `--o <--> --x`
> - [箭头动画](https://mermaid.nodejs.cn/syntax/flowchart.html#turning-an-animation-on)：给边打上标记 `A edge001@==> B`，然后配置边的属性 `edge001@{ animate: true }`
> - 常见形状：`() [] (()) [[]] [()] [/\] [\/] [\\] {} {{}} >]`
> - [更多形状](https://mermaid.nodejs.cn/syntax/flowchart.html#complete-list-of-new-shapes) `A@{ shape: processes, label: "Multiple processes" }`

```mermaid
---
title: 流程图示例
---
graph TB
    subgraph subgraph1
        direction LR
        A[A] e1@-->|comment| B(B) & C((C)) -.-> D{{D}} & E[(E)] ==> F{F}
    end
    subgraph subgraph2
        direction LR
        O[/O\] -- comment2 --o G[\G/] -. comment3 .-x H[\H\]
        G <---> I>I]
    end

    subgraph1 edge002@==> subgraph2

    e1@{ animate: true }
    edge002@{ animate: true }
```

## 时序图 (sequenceDiagram)

> [!note]
> - 箭头有特殊取法，单横线表示实线，双横线表示虚线，单箭头表示没有箭头，双箭头表示有箭头
> - 即 `->> -->>`表示有箭头的实线/虚线，`-> -->` 表示没箭头的实线/虚线
> - 此外还有 双箭头、X、异步调用：`<->, -x, -)`，其实线虚线表示方法不变
> - 跟上加号减号可以描述启动/停止`->>+, -->>-`
> - `participant, actor`
> - `create participant xxx`, `destroy xxx`
> - 此外还有 `loop`, `alt`, `opt` 等类似plantuml的地方，参考[sequenceDiagram](https://mermaid.nodejs.cn/syntax/sequenceDiagram.html#loops)

```mermaid
sequenceDiagram
    Alice->>+Bob: Hello Bob, how are you ?
    Bob-->>-Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl-)D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bob
    Bob--)Alice: I agree

```

## 状态图 (stateDiagram-v2)

语法兼容 plantUML。

> [!note]
> - `[*]` 表示 start 和 end，中间节点用线连就行了
> - 节点信息不同于plantUML，但是差别不大。都是 `A: msg1`, `A: another msg` 这样往后加，区别是指定信息后，mermaid会删去A的名字，但是plantUML不会

```mermaid
---
config:
    theme: forest
---
stateDiagram
    direction LR
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]

    Moving: Moving
    Moving: Move to A
    Moving: Move to B
```

## 框图 (block-beta)

描述软件架构、组成的图。[Ref](https://mermaid.nodejs.cn/syntax/block.html)

```mermaid
---
config:
    theme: default
---
block-beta
    %% 总列数
    columns 3

    %% 指定某一元素占据多少列
    a b("b"):2

    %% 可以将多个元素组合成一个块，指定块占据的列数，块内再次细分列数
    block:group1:2
        columns 3
        h i j down<[" "]>(down) space:2 k
    end

    %% 框图里面的lable必须加上双引号
    g((("This is a circle")))

    block:group2:3
        %% columns auto (default)
        l left<[" "]>(left) m n space o p blockArrowId6<[" "]>(right) q r
    end

    m --> o
```

## 思维导图 (mindmap)

只用缩进来描述层级关系

```mermaid
---
config:
    theme: default
---
mindmap
    A((root))
        B{{B}}
            C
            D
        E
        F
        G
```

## 雷达图 (radar-beta)

```mermaid
---
title: "Grades"
config:
    theme: default
---
radar-beta
  axis m["C++"], s["Python"], e["Java"]
  axis h["C#"], g["Shell"], a["JavaScript"]
  curve a["Alice"]{99, 90, 50, 10, 80, 30}
  curve b["Bob"]{20, 70, 20, 60, 20, 99}
  curve b["Mike"]{0, 90, 10, 30, 70, 90}

  max 100
  min 0

```

## 饼图 (pie)
```mermaid
---
config:
    theme: default
---
pie title 示例饼图
    "类别A" : 40
    "类别B" : 30
    "类别C" : 20
    "类别D" : 10
```

## 看板图 (kanban)

> [!note]
> 看板条目格式：`A[description]@{ticket: xx-xx-xx, priority: 'xx', assigned: 'xx'}`
>
> `ticket` 表示时间
>
> `priority` 的取值有 `Very Low, Low, , High, Very High`

```mermaid
---
config:
    theme: default
---
kanban
    todo
        A[task A]@{ticket: 2025-04-11, priority: 'Very Low', assigned: 'zhangsan'}
        B[task B is a task named B, which is a quiet normal name]@{ticket: 2025-04-12, priority: 'Very High', assigned: 'lisi'}
    progress
        C[task C]@{ticket: 2025-04-07, assigned: 'wangermazi'}
    done
        D[task D]@{ticket: 2025-04-01, priority: 'Low', assigned: 'wangermazi'}
        D[task D]@{ticket: 2025-04-03, priority: 'High'}


```

## 甘特图 (gantt)

```mermaid
---
config:
    theme: forest
---
gantt
    dateFormat  YYYY-MM-DD
    title       Adding GANTT diagram functionality to mermaid
    excludes    weekends

    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2              :         des4, after des3, 5d

    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :until isadded
    Functionality added                 :milestone, isadded, 2014-01-25, 0d

    section Documentation
    Describe gantt syntax               :active, a1, after des1, 3d
    Add gantt diagram to demo page      :after a1  , 20h
    Add another diagram to demo page    :doc1, after a1  , 48h

    section Last section
    Describe gantt syntax               :after doc1, 3d
    Add gantt diagram to demo page      :20h
    Add another diagram to demo page    :48h

```
