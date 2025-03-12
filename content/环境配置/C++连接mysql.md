---
date: 2022-11-20 15:38:00
title: C++连接mysql
tags: []
categories: [环境配置]
---

# C++连接 mysql

> [!info]
> MySQL 是[社区版](https://dev.mysql.com/downloads/mysql/)，8.0.31；clion 2022.2.3；ubuntu22.04

## 1）Windows 下，clion 连接

mysql 是用的直接解压版，主要图一个方便。假定已经成功[配置好 mysql](https://www.cnblogs.com/shuaikai/p/16899955.html)

把`%MySQL_HOME%/lib`下的`libmysql.dll`和`libmysqllib`两个文件拷贝到 clion 工程的`cmake-build-debug`文件夹下

然后在 Cmakelist.txt 中添加：

```cmake
# 自动生成
cmake_minimum_required(VERSION 3.23)
project(connect_mysql)

set(CMAKE_CXX_STANDARD 11)

# 声明mysql头文件路径
set(INC_DIR D:\\mysql\\include)
# 声明mysql链接库路径
set(LINK_DIR D:\\mysql\\lib)

# 引入头文件
include_directories(${INC_DIR})     # 注意这里如果直接用路径的话，不要加引号
# 引入库文件
link_directories(${LINK_DIR})
link_libraries(libmysql)

add_executable(connect_mysql main.cpp)
target_link_libraries(connect_mysql libmysql)
```

然后直接`#include<mysql.h>`就好了

## 2）ubuntu 下

```bash
# 三步走
sudo apt install mysql-server
sudo apt install mysql-client
sudo apt install libmysqlclient-dev
```

默认链接库安装在`/usr/lib/x86_64-linux-gnu/`下

补充知识点：

### gcc 编译选项

**`-I`:** (大写的 I）指定引用头文件路径，如`-I/usr/include/mysql`

**`-l`:**（小写的 l） 手动添加链接库，这里 gcc 是到默认链接库下搜索的，如`/usr/lib`。

- 库文件标准文件名为`libxxx.a`，在使用时前缀`lib`和后缀`.a`是省略的，即直接`-lxxx`，l 是自己添加的

- 举个例子，数学库<math.h>默认是不链接的，因此即使你包含了这个头文件，编译时仍然会报错 undefined reference。正确的编译命令是`gcc test.c -o test.out -lm`【数学库的名称为 libm.a】

**`-L`:**（大写的 L） 指定一个搜索链接库的目录，如`-L/usr/lib/x86_64-linux-gnu -lmysqlclient`，后面再跟你指定的库文件

### mysql_config

```bash
whatis mysql_config
#OUT: mysql_config (1)     - display options for compiling clients
whereis mysql_config
#OUT: /usr/bin/mysql_config

mysql_config --cflags # 同 --cxxflags --include
#OUT: -I/usr/include/mysql

mysql_conig --libs
#OUT: -L/usr/lib/x86_64-linux-gnu -lmysqlclient -lzstd -lssl -lcrypto -lresolv -lm
```

可以看出，这是一个专门为编译 mysql 文件提供编译选项的脚本。因此，可以通过这个脚本方便的对写的文件进行编译

```bash
gcc connect_mysql -o demo.out `mysql_config --include --libs` -Wall
```

这样头文件和链接库都指定好了，只需要`#include<mysql.h>`就好了

## mysql 接口

- `mysql_init()` 获取或初始化 MYSQL 结构
- `mysql_real_connect()` 连接到 MySQL 服务器。
- `mysql_query()` 执行指定为“以 Null 终结的字符串”的 SQL 查询。
- `mysql_use_result()` 初始化逐行的结果集检索。
- `mysql_field_count()` 返回上次执行语句的结果集的列数。
- `mysql_fetch_row()` 从结果集中获取下一行
- `mysql_num_fields()` 返回结果集中的字段数

## 测试用例

下面列两个验证的例子

```c++
#include <iostream>
#include <mysql.h> //mysql提供的函数接口头文件

using namespace std;

int main() {
    const char* host = "localhost"; //主机名
    const char* user = "your_name"; //用户名
    const char* pwd = "your_passwd"; //密码
    const char* dbName = "demo"; //数据库名称
    int port = 3306; //端口号

    // 创建mysql对象
    MYSQL *sql = nullptr;
    sql = mysql_init(sql);
    if (!sql) {
        cout << "MySql init error!" << endl;
    }

    // 连接mysql
    sql = mysql_real_connect(sql, host, user, pwd, dbName, port, nullptr, 0);
    if (!sql) {
        cout << "MySql Connect error!" << endl;
    }

    // 执行命令
    int ret = mysql_query(sql, "select * from student");
    if (ret) {
        cout << "error!" << endl;
    } else {
        cout << "success!" << endl;
    }
    cout << ret << endl;
    // 关闭mysql
    mysql_close(sql);
    return 0;
}
```

```c++
#include<iostream>
#include<mysql/mysql.h>
/*
   mysql_init()         获取或初始化MYSQL结构
   mysql_real_connect() 连接到MySQL服务器。
   mysql_query()        执行指定为“以Null终结的字符串”的SQL查询。
   mysql_use_result()   初始化逐行的结果集检索。
   mysql_field_count()  返回上次执行语句的结果集的列数。
   mysql_fetch_row()    从结果集中获取下一行
   mysql_num_fields()   返回结果集中的字段数
*/

class MyDB
{
public:
        MyDB();
        ~MyDB();
        bool initDB(std::string host,std::string user,std::string pwd,std::string db_name);
        bool exeSQL(std::string sql);

private:
        MYSQL     *connection;//连接mysql句柄指针
        MYSQL_RES *result;    //指向查询结果的指针
        MYSQL_ROW row;        //按行返回的查询信息
};

MyDB::MyDB()
{
        connection = mysql_init(nullptr);   //初始化数据库连接变量
        if(connection == nullptr)
        {
                std::cout<<"mysql_init error!"<<std::endl;
                exit(1);
        }
}

MyDB::~MyDB()
{
        if(connection != nullptr)
        {
                mysql_close(connection);
        }
}

bool MyDB::initDB(std::string host,std::string user,std::string pwd,std::string db_name)
{
        // 函数mysql_real_connect建立一个数据库连接
        // 成功返回MYSQL*连接句柄，失败返回NULL
        connection = mysql_real_connect(connection,host.c_str(),user.c_str(),pwd.c_str(),db_name.c_str(),0,nullptr,0);
        if(connection == nullptr)
        {
                std::cout<<"mysql_real_connect error!"<<std::endl;
                return false;
        }
        return true;
}

bool MyDB::exeSQL(std::string sql)
{
        // mysql_query()执行成功返回0，失败返回非0值.
        if(mysql_query(connection,sql.c_str()) != 0)
        {
                std::cout<<"mysql_query error!"<<std::endl;
                return false;
        }
        else
        {
                result = mysql_store_result(connection);  //获取结果集
                // mysql_field_count()返回connection查询的列数
                while ((row = mysql_fetch_row(result)) != nullptr)
                {
                        // mysql_num_fields()返回结果集中的字段数
                        for(int j = 0;j < mysql_num_fields(result);++j)
                        {
                                std::cout<<row[j]<<" ";
                        }
                        std::cout<<std::endl;
                }
                // 释放结果集的内存
                mysql_free_result(result);
        }
        return true;
}

int main()
{
        MyDB db;
        db.initDB("localhost","your_name","your_passwd","demo");
        db.exeSQL("show databases;");
        return 0;
}
```
