---
title: PlantUML快速上手
categories: [工具使用]
date: 2023-10-11
series: [快速上手]
tags: [uml, plantuml]
---

# PlantUML 快速上手

## 通用

### 命令

- title header footer：标题、页首、页脚
- skin rose ： rational rose 的皮肤
- skinparam monochrome true ： 黑白皮肤
- scale 2 ： 生成图片放大两倍，嫌图片分辨率不够的时候可以用
- participant 可以预定义参与者
- actor 小人儿

### 注释

![image-20231126235808615](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126235808615.png)

<img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126235448816.png" alt="image-20231126235448816" style="zoom:80%;" />

## 时序图

boundary 边界

![image-20231126233949689](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126233949689.png)

![image-20231126234608471](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126234608471.png)

- 箭头 ->， -->， ->>， -\， -/, o->， -x， [->， ?->
  - 实线同步消息，虚线返回消息（直接用 return），细箭头异步消息
  - [ 方括号表示虚空来历（不关心从哪来、往哪去）
- 标记
  - \=\=xx\=\=分割线
  - ||| 增大间隔
  - ... 延迟
  - (30) 圆括号指定角度
  - {start}<->{end} 纵向连接线，要开启一个命令，
  - ++ 激活 activate
  - -- 取消 deactivate
  - !! 删除对象
  - \*\* 创建对象
- 块 xxx ... end xxx。标签颜色井号紧跟名字，空格跟背景颜色
  - box-end 括住整个参与者
  - mainframe-end 一般包，可定义别名
  - opt （switch）
  - alt-else-end （if-else）
  - loop-end
  - par-end （并行）

## 活动图

`start`开始，`stop/end`结束

`:xxx;`表示一个实体

[活动图语法和功能 (plantuml.com)](https://plantuml.com/zh/activity-diagram-beta)

## 用例图

`usecase`或`(xxx)`定义用例

`actor`或`:xxx:`定义参与者

`as`定义别名。如 `usecase U1 ad (U1\alias)`

`package xxx{}`或`rectangle xxx {}`定义包

箭头：`-->  ->  --  .>  ..`

<img src="https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126234916395.png" alt="image-20231126234916395" style="zoom:67%;" />

> [!tip]
>
> 有时候你可能只需要一个“框图”，而非严格的带有什么 start 和 stop 的活动图。那么“用例图”实际上可以完成一二。用例图自带小人和椭圆，以及一些箭头，通过`rectangle "xxx" as A`可以创建一个方框。

```plantuml
@startuml

rectangle "AAA" as A
rectangle T1
rectangle T2
rectangle T3
rectangle "..." as B

A -> T1 : sth
T1 -> T2
T2 -> T3
T3 -> B

note left of A #fff: Comment

@enduml
```

## 类图

![image-20231126235934810](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231126235934810.png)

![image-20231127000410137](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231127000410137.png)

## EBNF

开始 `@startebnf @endebnf`

![image-20231129232521864](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231129232521864.png)

例子：LISP 语法

![image-20231129233022640](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231129233022640.png)

![image-20231129233027292](https://shuaikai-bucket0001.oss-cn-shanghai.aliyuncs.com/blog_img/image-20231129233027292.png)
