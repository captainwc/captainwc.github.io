---
title: ubuntu安装中文输入法（fcitx5-rime）
date: 2025-07-10
categories: ["环境配置"]
---

## 安装

```bash
sudo apt install fcitx5 fcitx5-chinese-addons fcitx5-rime librime-lua

export GTK_IM_MODULE=fcitx5
export QT_IM_MODULE=fcitx5
export XMODIFIERS=@im=fcitx5 
```
然后重启，完了打开fcitx5的configure，添加输入源rime即可

## 雾凇拼音安装

> [!reference]
> 
> https://dvel.me/posts/rime-ice/
>
> https://sspai.com/post/89281
>
> https://sspai.com/post/84373

```bash
git clone https://github.com/rime/plum ~/plum

# 切换到东风破的目录
cd ~/plum

# 如果你使用Fcitx5，你需要加入参数，让东风破把配置文件写到正确的位置
rime_frontend=fcitx5-rime bash rime-install iDvel/rime-ice:others/recipes/full

# 如果你是用IBus，则不需加参数，因为东风破默认是为IBus版的RIME打造。
bash rime-install iDvel/rime-ice:others/recipes/full

# 重启
fcitx5-remote -r
```

## 配置

> [!reference]
>
> https://www.lvbibir.cn/posts/tech/windowns-rime-input-method/
> 

### 主题
```bash
git clone https://github.com/thep0y/fcitx5-themes-candlelight.git
# 拷贝子文件夹到 ~/.local/share/fcitx5/themes
# 然后在fcitx5配置文件中指定主题（子文件夹名称）
```

### fcitx5 配置文件
`vim ~/.config/fcitx5/conf/classicui.conf`

```ini
# 垂直候选列表
Vertical Candidate List=False

# 按屏幕 DPI 使用
PerScreenDPI=True

# Font (设置成你喜欢的字体)
Font="Smartisan Compact CNS 13"

# 主题(这里要改成你想要使用的主题名，主题名就在下面)
Theme=macOS-light
```

### rime 配置文件
`vim ~/.local/share/fcitx5/rime/default.custom.yaml`

```yaml
patch:
  schema_list:
    - schema: rime_ice
    # - schema: luna_pinyin_simp
  menu:
    page_size: 6
  ascii_punct: true
  ascii_composer/switch_key:
    Shift_L: commit_code
    Shift_R: commit_code
```

