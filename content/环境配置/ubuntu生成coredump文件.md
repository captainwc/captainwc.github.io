---
title: ubuntu配置coredump文件生成位置
date: 2025-08-01
categories: ["环境配置"]
series: ["环境配置专栏"]
---

## ubuntu配置coredump文件生成位置

### (1) 修改 ulimit
```bash
# 查看当前ulimit值。如果是0说明需要修改
ulimit -c
```

修改方式是：

```bash
echo "ulimit -c unlimited 2>/dev/null || true" >> ~/.bashrc
```

或者修改 `/etc/security/limits.conf` 文件，在文件末尾追加

(注意：如果你是**WSL2**用户的话，尝试下面方法无果后，建议还是使用第一种)

```plaintext
*        soft    core    unlimited
*        hard    core    unlimited
```

- *：对所有用户生效（可替换为具体用户名或用户组，如 @developers）。
- soft：软限制（用户可自行修改，但不能超过硬限制）。
- hard：硬限制（root 用户设置的上限）。

### (2) 禁用 apport

如果使用的是ubuntu桌面版，很有可能coredump是被apport（就是会弹窗告诉你你的程序崩溃了那个）接管的。

```bash
cat /proc/sys/kernel/core_pattern
# 如果是下面的结果，则说明当前是被approt接管状态
|/usr/share/apport/apport %p %s %c %d %P %E
```

如果想得到coredump文件，则需要禁用它

```bash
sudo systemctl disable apport.service
```

### (3) 修改core-pattern

修改`/etc/sysctl.conf`文件，比如将core文件统一生成到`/tmp/coredumps`目录，则添加如下内容

(WSL2用户不要放在/tmp目录下，它好像会自动删除这个目录。建议是要么就放在/tmp，要么就换个目录，不要在/tmp创建子目录）

```plaintext
kernel.core_pattern=/tmp/coredumps/core-%e-%t-%p-%E
kernel.core_uses_pid=1
```

确保目录存在且可写入

```bash
sudo mkdir -p /tmp/coredumps && sudo chmod 777 /tmp/coredumps
```

说明符​​	​​含义​​
`%%`	转义字符，表示一个 % 符号本身（如 %% → %）

`%p`	​​进程 ID（PID）​​（例如 1234）

`%P`	​​全局 PID​​（包括线程组 ID，通常与 %p 相同）

`%i`	​​线程 ID（TID）​​（多线程程序的子线程 ID）

`%I`	​​全局线程 ID​​（内核调度器分配的 ID）

`%n`	​​进程的友好名称（comm）​​（通常是程序名，最多 16 字符）

`%e`	​​可执行文件名​​（不含路径，例如 nginx）

`%E`	​​可执行文件的完整路径​​（例如 /usr/bin/nginx）

`%t`	​​时间戳​​（Unix 时间戳，秒级，例如 1625097600）

`%h`	​​主机名​​（uname -n 的输出）

`%s`	​​触发 coredump 的信号编号​​（例如 11 表示 SIGSEGV）

`%c`	​​coredump 文件的大小限制​​（受 RLIMIT_CORE 限制，单位：字节）

`%u`	​​进程的实际用户 ID（UID）​​（例如 1000）

`%g`	​​进程的实际组 ID（GID）​​（例如 1000）

`%d`	​​进程的退出码​​（通常为信号编号）

`%f`	​​进程的页错误地址​​（十六进制，仅对某些信号有效，如 SIGSEGV）

`%H`	​​容器/命名空间的 ID​​（如果进程在容器中运行）


### (4) 测试

```bash
kill -11 $$
ll /tmp/coredumps
```
