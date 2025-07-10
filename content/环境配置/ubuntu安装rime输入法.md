---
title: ubuntu安装中文输入法（fcitx5-rime）
date: 2025-07-10
categories: ["环境配置"]
series: ["环境配置专栏"]
---

## 安装

```bash
sudo apt install fcitx5 fcitx5-chinese-addons fcitx5-rime

export GTK_IM_MODULE=fcitx5
export QT_IM_MODULE=fcitx5
export XMODIFIERS=@im=fcitx5 
```
然后重启，完了打开fcitx5的configure，添加输入源rime即可

## 配置

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
    - schema: luna_pinyin_simp
  menu:
    page_size: 10
  ascii_punct: true
  ascii_composer/switch_key:
    Shift_L: commit_code
    Shift_R: commit_code
```

### 主题
```bash
git clone https://github.com/thep0y/fcitx5-themes-candlelight.git
# 拷贝子文件夹到 ~/.local/share/fcitx5/themes
# 然后在fcitx5配置文件中指定主题（子文件夹名称）
```

