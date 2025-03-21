---
title: Ubuntu22.04安装Hadoop完全分布式集群
date: 2022-11-21
categories: [环境配置]
tags: [hadoop]
---

# Ubuntu22.04 安装 Hadoop 完全分布式集群

## 1. 网络配置

需要修改四处，windows（宿主机），vmware，和虚拟机 ubuntu **（NAT模式）**

1. windows，设置 vmware8 的 ipv4 选项即可

2. vmware 的 ip 设置和 windows 是一样的，网关都是`192.168.5.2`，还有 NAT 网络设置

3. ubuntu 的主要任务就是

- 把 DHCP 换成`静态IP`（这部分要看具体集群配置，比如设置 master 和 slave1，slave2，则可以分别分配 ip 为`192.168.5.11`,`192.168.5.12`,`192.168.5.13`）
- 再改改网关 gateway 和 DNS（这部分和上面是一样的）
- 然后为 ip 地址起个别名，即修改`hosts`，添加映射

```bash
cd /etc/netplan/ && ll
vim 01-network-manager-all.yaml
```

```yaml
# 把以下内容粘贴上
# Let NetworkManager manage all devices on this system
network:
    ethernets:
        ens33:                    ## 网卡名，要改对
            dhcp4: false
            addresses:
              - 192.168.5.11/24   ## set static IP
            routes:
              - to: default
                via: 192.168.5.2  ## gateway
            nameservers:
              addresses: [8.8.8.8,8.8.4.4,192.168.3.1]
    version: 2
```

```bash
# 开启systemd-networkd服务
sudo systemctl start systemd-networkd
# 查看状态
sudo systemctl status systemd-networkd

# 重启网络服务
sudo netplan apply
#查看设定的ip是否生效
ifconfig | head -n 3

# 测试网络
ping -c 3 www.baidu.com
```

```bash
# 修改hostname
sudo vim /etc/hostname
# 设置ip映射
sudo vim /etc/hosts
# 把对应的ip添加到文件中
192.168.5.11 master
192.168.5.12 slave1
```

# 在 windows 中也添加 ip 映射

/C:\windows\system32\drivers\etc\hosts

````

## 2. 安装JDK与Hadoop

### 2.1 安装

```bash
# 将下载的安装包解压到 /opt下新建的文件夹module中
tar -zxvf jdk-XXXX-x64.tar.gz -C /opt/module
tar -zxvf hadoop-XXXX-x64.tar.gz -C /opt/module
````

### 2.2 配置环境变量

```bash
# 新建.sh文件；因为\etc\profile会遍历\etc\profile.d文件夹下的所有.sh文件
sudo vim /etc/profile.d/my_env.sh
# 在文中添加如下内容：
# set JAVA_HOME
export JAVA_HOME=/opt/module/jdk1.8.0_212
export PATH=$PATH:$JAVA_HOME/bin
# set HADOOP_HOME
export HADOOP_HOME=/opt/module/hadoop-3.1.3
export PATH=$PATH:$HADOOP_HOME/bin
export PATH=$PATH:$HADOOP_HOME/sbin
```

```bash
# source一下profie即可，因为他会自动遍历profile.d文件夹
source /etc/profile
# 测试一下是否配置成功
java -version
hadoop version
# 不行就reboot
```

### 2.3 克隆虚拟机

注意选则完全克隆，然后修改`静态ip地址`和`hostname`

## 3. 配置完全分布式

### 3.1 配置 SSH 无密登录

```bash
# ssh-server是缺省的，注意安装一下
sudo apt install openssh-server
```

```bash
# 生成公钥和私钥，以rsa算法
ssh-keygen -t rsa
# 将公钥拷贝给别的机器
ssh-copyid [maser][slave1][slave2]
```

### 3.2 常用命令

#### 3.2.1 scp（secure copy)

`scp    -r     $pdir/$filename   $user@$host:$pdir/$filename`

拷贝 递归 要拷贝的文件 目标服务器:目的路径/名称

#### 3.2.2 rsync（远程同步工具）

`rsync     -av     $pdir/$filename   $user@$host:$pdir/$filename`

远程同步 参数 要拷贝的文件 目标服务器:目的路径/名称

-a 表示归档拷贝，-v 表示显示过程

**`rsync`可以避免复制重复内容，所以比`scp`效率要高；同时支持符号链接**

#### 3.2.3 xsync（自己编写的脚本）

**`xsync`:将当前文件自动分发到集群中所有机器的相同位置**

```shell
# 在~/bin目录下创建脚本文件，因为这个目录已经被添加到环境变量中，可以全局使用。当然也可以自己添加环境变量
sudo vim /home/usr/bin/xsync

# 编写以下内容：
#!/bin/bash
#1. 判断参数个数
if [ $# -lt 1 ]
then
    echo Not Enough Arguement!
    exit;
fi
#2. 遍历集群所有机器
for host in master slave1 slave2
do
    echo ====================  $host  ====================
    #3. 遍历所有目录，挨个发送
    for file in $@
    do
        #4. 判断文件是否存在
        if [ -e $file ]
            then
                #5. 获取父目录
                pdir=$(cd -P $(dirname $file); pwd)
                #6. 获取当前文件的名称
                fname=$(basename $file)
                ssh $host "mkdir -p $pdir"
                rsync -av $pdir/$fname $host:$pdir
            else
                echo $file does not exists!
        fi
    done
done

```

```bash
# 设置可执行权限
sudo chmod 777 xsync
source /etc/profile
```

### 3.3 集群配置

#### 3.3.1 集群规划

|            | master                              | slave1                               | slave2                             |
| ---------- | ----------------------------------- | ------------------------------------ | ---------------------------------- |
| HDFS       | **NameNode**<br />DataNode          | <br />DataNode                       | **SecondaryNamenode**<br/>DataNode |
| YARN       | <br />NodeManager                   | **ResourceManager**<br />Nodemanager | <br />NodeManager                  |
| 历史服务器 | **HistoryServer**<br />**日志聚集** |                                      |                                    |

#### 3.3.2 配置集群

共有四个用户自定义配置文件`core-site.xml`,`hdfs-site.xml`,`yarn-site.xml`,`mapred-site.xml`，都在路径`$HADOOP_HOME/etc/hadoop`下

##### 3.3.2.1 core-site.xml

```xml
<configuration>
    <!-- 指定NameNode的地址 -->
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://master:8020</value>
    </property>
    <!-- 指定hadoop数据的存储目录 -->
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/opt/module/hadoop-3.1.3/data</value>
    </property>
    <!-- 配置HDFS网页登录使用的静态用户为shuaikai -->
    <property>
        <name>hadoop.http.staticuser.user</name>
        <value>shuaikai</value>
    </property>
</configuration>
```

##### 3.3.2.2 hdfs-site.xml

```xml
<configuration>
	<!-- nn web端访问地址-->
	<property>
        <name>dfs.namenode.http-address</name>
        <value>master:9870</value>
    </property>
	<!-- 2nn web端访问地址-->
    <property>
        <name>dfs.namenode.secondary.http-address</name>
        <value>slave2:9868</value>
    </property>
</configuration>
```

##### 3.3.2.3 yarn-site.xml

```xml
<configuration>
    <!-- 指定MR走shuffle -->
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <!-- 指定ResourceManager的地址-->
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>slave1</value>
    </property>
    <!-- 环境变量的继承 -->
    <property>
        <name>yarn.nodemanager.env-whitelist</name>
                     <value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PREPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_MAPRED_HOME</value>
    </property>

    <!-- 开启日志聚集功能 -->
    <property>
        <name>yarn.log-aggregation-enable</name>
        <value>true</value>
    </property>
    <!-- 设置日志聚集服务器地址 -->
    <property>
        <name>yarn.log.server.url</name>
        <value>http://master:19888/jobhistory/logs</value>
    </property>
    <!-- 设置日志保留时间为7天 -->
    <property>
        <name>yarn.log-aggregation.retain-seconds</name>
        <value>604800</value>
    </property>
</configuration>
```

##### 3.3.2.4 mapred-site.xml

```xml
<configuration>
	<!-- 指定MapReduce程序运行在Yarn上 -->
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>

    <!-- 历史服务器端地址 -->
    <property>
        <name>mapreduce.jobhistory.address</name>
        <value>master:10020</value>
    </property>
    <!-- 历史服务器web端地址 -->
    <property>
        <name>mapreduce.jobhistory.webapp.address</name>
        <value>master:19888</value>
    </property>
</configuration>
```

##### 3.3.2.5 在集群上分发配置文件

```bash
xsync $HADOOP_HOME/etc/hadoop/
```

## 4. 群起集群

### 4.1 配置 worker

```bash
vim $HADOOP_NOME/etc/hadoop/workers
# 把所有主机名添加进去，不要有多余的空格、换行
master
slave1
slave2
# 分发
xsync $HADOOP_NOME/etc/hadoop/workers
```

### 4.2 启动集群

如果集群是**第一次启动**，需要**在 master 节点格式化 NameNode**

:japanese_goblin:注意：格式化 NameNode 后，会产生新的集群 id，导致 NameNode 和原来 DataNode 对应的集群 id 不一致，这样集群就找不到已往数据。如果集群在运行过程中报错，需要重新格式化 NameNode 的话，一定要先停止 namenode 和 datanode 进程，并且要删除所有机器的 data 和 logs 目录，然后再进行格式化。

:japanese_ogre:要严格按照集群规划，启动对应的部分，hdfs，yarn，历史服务器等

```bash
# (1) 格式化NameNode
hdfs namenode -format

# (2) 启动Hdsf 【在master上】
$HADOOP_HOME/sbin/start-dfs.sh

# (3) 启动该Yarn 【在slave1上】
$HADOOP_HOME/sbin/start-yarn.sh

# (4) 启动历史服务器	【在master上】
mapred --daemon start historyserver

# (5) 查看启动情况	【在各个机器上】
jps

# (6) 在web端口查看
# HDFS       http://master:9870
# YARN       http://slave1:8088
# HistoryJob http://hadoop102:19888/jobhistory

# (7) 关闭集群
```

### 4.3 集群启动和关闭方法

#### 4.3.1 各个模块分别启动/停止

HDFS:`start-dfs.sh`,`stop-dfs.sh`
YARN:`start-yarn.sh`,`stop-yarn.sh`

#### 4.3.2 各个服务器组件逐一停止

HDFS:`hdfs --daemon start/stop namenode/datanode/secondnamenode`

YARN:`yarn --daemon start/stop resourcemanager/nodemanager`

#### 4.3.3 编写脚本 集群整体启动/停止

```bash
vim ~/bin/myhadoop.sh
```

```bash
#!/bin/bash

if [ $# -lt 1 ]
then
    echo "No Args Input..."
    exit ;
fi

case $1 in
"start")
        echo " =================== 启动 hadoop集群 ==================="

        echo " --------------- 启动 hdfs ---------------"
        ssh master "/opt/module/hadoop-3.1.3/sbin/start-dfs.sh"
        echo " --------------- 启动 yarn ---------------"
        ssh slave1 "/opt/module/hadoop-3.1.3/sbin/start-yarn.sh"
        echo " --------------- 启动 historyserver ---------------"
        ssh master "/opt/module/hadoop-3.1.3/bin/mapred --daemon start historyserver"
;;
"stop")
        echo " =================== 关闭 hadoop集群 ==================="

        echo " --------------- 关闭 historyserver ---------------"
        ssh master "/opt/module/hadoop-3.1.3/bin/mapred --daemon stop historyserver"
        echo " --------------- 关闭 yarn ---------------"
        ssh slave1 "/opt/module/hadoop-3.1.3/sbin/stop-yarn.sh"
        echo " --------------- 关闭 hdfs ---------------"
        ssh master "/opt/module/hadoop-3.1.3/sbin/stop-dfs.sh"
;;
*)
    echo "Input Args Error..."
;;
esac
```

```bash
chmod 777 myhadoop.sh
```

#### 4.3.4 编写脚本 查看所有服务器运行的服务

```bash
vim ~/bin/jpsall
```

```bash
#!/bin/bash

for host in master slave1 slave2
do
        echo =============== $host ===============
        ssh $host jps
done
```

```bash
chmod 777 jpsall
```

### 4.4 常用端口号

| 端口名称          | Hadoop3.x      |
| ----------------- | -------------- |
| NameNode 内部通信 | 8020/9000/9820 |
| NameNode HTTP UI  | 9870           |
| MapReduce         | 8088           |
| HistoryServer     | 19888          |

## 5. 集群基本测试

官方案例 wordcount（本地模式运行）

上传下载，web 浏览

......
