---
title: linux命令行大记忆恢复术
date: 2023-11-25
series: [快速上手]
tags: [linux, cmdline]
categories: [工具使用]
---



# 常用 Linux 命令

## find & fd

fd 默认是正则表达式状态，以及会忽略一些文件

- `-g` 使用 glob 通配符
- `-e` 查找拓展名
- `-x` 为每一条结果分别执行命令
- `-X` 为所有结果执行同一个命令
- `-h` 不跳过隐藏文件
- `-uu` 不忽略任何东西,包括.gitnore 中的
- `-i` 忽略大小写(fd 默认是只能匹配,即输入小写是大小写不敏感,输入大写时敏感)
- 权限
  `find . -perm /111 -type f -delete`：linux 下删除可执行文件（加个 type 可以略掉文件夹）（[find 命令参考](http://c.biancheng.net/view/779.html)）
  `-perm mode`：必须与 mode 指示的一样
  `-perm /mode`：mode 中表示的，满足一个就好了，比如`111`，则只要有一个`1`满足就好了
  `-perm -mode`：mode 中表示的，必须全部具有，`111`就是 ugo 都得可执行，缺一不可。别的属性不管
  `find -iname readme -o -name *.c -not -size +100k -exec ls -i {} + -fprintf0 file.txt  `：
  find 查找是**完全匹配**；逻辑与或非；size 的单位注意默认不是 byte；exec 结尾是`{} +`大括号表示结果

## diff

1. `diff file1 file2`：比较文件的异同：**怎么样改变第一个文件，可以把它变成第二个文件**
   - `<` 表示左边 file1 独有的文件/行，`>`表示右边 file2 独有的文件/行，`|` 表示两边都有，但不一样
   - `2,4a2,4`：数字是**闭区间**，`[2-4]`行，需要`a`dd 才能跟 file2 一样，【`a`dd、 `c`hange、 `d`elete】
2. `diff file1 file2 -y -W 100 | grep ">"`：并排显示不同之处，每排宽度 100
3. `-y`并排显示： `--suppress-common-lines`仅显示不同的；`--left-column`相同的仅在左边显示
4. `-w`忽略所有空格，`-i`忽略大小写，`-I <str>`忽略字符串，`-b` 忽略行尾空格，字符串中若干空格视为相等
5. `-C <num>` 不同之处上下显示 num 行上下文
6. `-q`仅显示是否相同
7. `-p`可用于比较 C 程序
8. `-r`递归比较子目录，`-N`独有的文件会显示"only in xxx"
9. `diff {dir1} {dir2} -Nrqy`只显示文件夹中哪些文件不一样，不输出具体的文件

## grep

- `-i`：忽略大小写进行匹配
- `-v`：反向查找，只打印不匹配的行
- `-E`: 使用正经的正则表达式
- `-n`：显示匹配行的行号
- `-r`：递归查找子目录中的文件
- `-l`：只打印匹配的文件名（小写 L）
- `-c`只打印匹配的行数

## sed

sed 命令的基本格式是`sed [-ni][-e<script>][-f<script文件>][文本文件]`

- `-n`：安静模式，只显示被 sed 处理过的行（否则会输出所有来自 stdin 的输入）
- `-e`：允许后面直接跟命令，换句话说，不使用 -e 的话命令需要用单引号括起来。可以使用多个 -e
- `-f`：允许使用指定 sed 脚本文件
- `-i`：直接处理文件本身（会生成 temp 文件）

sed 命令中有一些动作：（sed 从 1 开始计算行）

- `i \`：插入， 后面接字串，插入在当前行的**上**一行*（注意 i a c 这三个动作后面要加上反斜杠）*

- `a\`：新增， 后面接字串，插入在当前行的**下**一行

- `c\` ：取代， 后面接字串，取代 n1, n2 之间的行

- `d` ：删除，因为是删除，所以 d 后面通常不接任何东西

- `p` ：打印，亦即将某个选择的数据印出。通常 p 会与参数 sed -n 一起运行

- `s` ：取代，通常搭配正则表达式，例如 1,20s/old/new/g

  > sed 以行为单位处理，加`g`是替换全部 pattern，不加是只替换每一行的第一个

```bash
# 在第二行上面插入一行 rowxxxyyyy
sed -i -e 2i\ rowxxxyyyy test.txt
sed '2,5c\ shuaikai'
# 在满足 pattern 模式的行下面插入一行
sed -i '/.*123.*/a 456' test.txt
# 可以用圆括号来进行正则表达式捕获，并用\+数字来进行引用。圆括号要进行转义
echo "Hello, World" | sed -n 's#.*,\s\(\w*\)#\1#p'
```

## awk

awk 命令的基本格式是`awk -F " "   ' pattern { action } '  filename`，即指定分隔符，然后单引号括起来的所有内容作为参数传递给 awk，其中前半部分是一个**正则表达式/条件**，后面具体执行的**操作**用大括号括起来

awk 处理文件是以`行`为单位，对每一行执行操作；每一行通过分隔符划分为`NF`个部分

- `NR`：当前处理的行号；`NF`：当前行的块数。`NF==0`即表示空行
- `$0`：整行内容；`$1...`：第 1、2...NR 部分
- 使用变量不需要声明，第一次用到的时候自动赋空值
- 循环、分支等与 C 语言相同
- action 部分可执行内置函数：`print`、`length`、`sqrt`、`match`等，也可以通过`system()`来执行任意函数
- `BEGIN`块，指定在执行动作之前做什么；`EDN`块，指定在执行完动作之后做什么

```bash
# 输出csv文件每行中长度超过5的字符串，不超过的用xxx代替
awk -F ',' 'NF%3==0 {for(i=1;i<=NF;i++) if(length($i)>5) print$i; else if print"xxx"}'
# 删除文件中行号是4的倍数的行
awk 'NR%4==0 {print NR}' file | xargs -I{} sed -i "{}d" file
# BAEGIN 和 END 的示意，中间的action才是真正要执行的命令
## 比如如果需要什么累加的东西，则可以在 END 块中输出出来
awk '[pattern] BAEGIN{print"我要开始了"} {action...} END{print"我结束了"}'
```

## 例子

**例 1** ==用 awk 和 sed 迁移阿里云上的图片：==

1. 找到阿里云 oss 仓库，选择批量导出 url，导出后是一个.csv 文件，格式为 obj，url

2. 找一个文件夹下载所有 url

   ```bash
   cat export_urls.csv | awk -F, '{print $2}' | xargs wget
   ```

3. 把下载的这些**文件上传**到新的 oss 上，得到新的链接。这会导致原来的笔记里面的图片链接全部失效，因此要更改链接。链接的区别只在前面的 bucket 地址，后面的图片名是完全一样的。因此只需要找到所有的笔记文件，把其中图片 url 中前面的 bucket 链接改成新的连接前缀即可

4. 此处用到的 fd 命令要先下载，即 fd-find。可以对文件夹进行递归正则查询。至此，就完成了对所有图片的迁移、更改链接操作。

   ```bash
   fd ".*\.md$" | xargs sed -i 's#https:\/\/xxx.xxx#https:\/\/yyy.yyy#g'
   ```