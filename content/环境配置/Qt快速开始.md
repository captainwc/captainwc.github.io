---
title: "Qt从零开始（0）——环境配置"
date: 2025-08-30T00:38:31+08:00
categories: ["环境配置"]
tags: []
series: ["Qt专栏"]
---

# Qt快速开始

## 安装

不管是windows还是linux，都是通过在线安装器安装了。不想去网站走注册流程（虽然最终难逃一注），可以使用installer的镜像：

[qt | 镜像站使用帮助 | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/help/qt/)

上面的custom安装自己看着勾选吧。我喜欢all in cmake，什么creator studio之类的都不安装

（或许也可以用sudo apt intall libqt6xxx，但是我没成功，直接用installer了。虽然要注册，但是可以指定安装位置，更干净，还可以管理模块增减更新）

### 依赖安装

> [!warning]
>
> 这里我的环境不干净，所以具体安装了什么也不可控。比如linux上我安装了x11和xcb这些，没有的话可能你也要装。windows上装了那什么只有天知道了

主要是ubuntu上会缺东西，比如opengl

**opengl**: `sudo apt install libgl1-mesa-dev libglu1-mesa-dev mesa-common-dev`

**libpulse**: `sudo apt install libpulse-dev`

**vulkan**：（部分项目用）这个可以去手动下载SDK下来 [LunarXchange](https://vulkan.lunarg.com/sdk/home)，[1.4.321.1](https://sdk.lunarg.com/sdk/download/1.4.321.1/linux/vulkansdk-linux-x86_64-1.4.321.1.tar.xz) 然后配置环境变量：

```bash
# VULKAN
export VULKAN_SDK=/opt/vulkansdk/1.4.321.1/x86_64
export PATH=$VULKAN_SDK/bin:$PATH
export LD_LIBRARY_PATH=$VULKAN_SDK/lib:$LD_LIBRARY_PATH
export VK_LAYER_PATH=$VULKAN_SDK/etc/vulkan/explicit_layer.d
```

## 快速开始

使用CMake几个点：

1. 设置`CMAKE_PREFIX_PATH`让它能找到你的qt安装位置。比如`export QT_PATH="/opt/Qt/6.9.2/gcc_64"`
2. set(CMAKE_AUTOMOC ON)  # 自动处理 `Q_OBJECT` 宏，用于实现信号槽机制，推荐开启
   set(CMAKE_AUTORCC ON)  # 自动处理资源文件，处理资源文件`.qrc`，推荐开启
   set(CMAKE_AUTOUIC ON)  # 自动处理 UI 文件`.ui`，自己看着搞。不开可以手动 `qt6_wrap_ui(UI_HEADERS ${UI_FILES})`
3. windows上不生成控制台窗口`set_target_properties(${TARGET} PROPERTIES WIN32_EXECUTABLE TRUE)`
4. windows上可以自定义命令调用`windeployqt.exe`自动拷贝动态库，也可以直接命令行 `windeployqt.exe YOUR_APP.exe`

```cmake
cmake_minimum_required(VERSION 3.16)
project(qt_demo VERSION 1.0 LANGUAGES CXX)

set(TARGET qt6_demo)
set(SOURCES main.cpp)
set(UI_FILE main.ui)
set(QT_INSTALL_PATH $ENV{QT_PATH})

set(CMAKE_AUTOMOC ON)  # 自动处理 Q_OBJECT 宏
set(CMAKE_AUTORCC ON)  # 自动处理资源文件
set(CMAKE_AUTOUIC ON)  # 自动处理 UI 文件

# C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_BINARY_DIR ${PROJECT_SOURCE_DIR}/build)
set(EXECUTABLE_OUTPUT_PATH ${CMAKE_BINARY_DIR}/bin)

# 查找 Qt 包
list(APPEND CMAKE_PREFIX_PATH ${QT_INSTALL_PATH})
find_package(Qt6 COMPONENTS Core Gui Widgets REQUIRED)

# 添加可执行文件
add_executable(${TARGET} ${SOURCES})

# 链接 Qt 库
target_link_libraries(${TARGET} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
)

# 在 Windows 上创建 Windows 应用程序（不显示控制台窗口）
if(WIN32)
    set_target_properties(${TARGET} PROPERTIES WIN32_EXECUTABLE TRUE)
endif()

# 自动化
if(WIN32)
    find_program(UIC NAMES uic.exe HINTS ${QT_PATH}/bin REQUIRED)
    find_program(DEPLOYQT NAMES windeployqt.exe HINTS ${QT_PATH}/bin REQUIRED)

    string(REPLACE ".ui" "_ui.h" UI_HEADER ${UI_FILE})

    # 生成 xxx_ui.h
    add_custom_command(
        OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/${UI_HEADER}
        COMMAND ${UIC} ${CMAKE_CURRENT_SOURCE_DIR}/${UI_FILE} -o ${CMAKE_CURRENT_SOURCE_DIR}/${UI_HEADER}
        DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/${UI_FILE}
        COMMENT "Generating ${UI_HEADER}"
    )
    add_custom_target(GenerateUiHeader ALL DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/${UI_HEADER})
    add_dependencies(${TARGET} GenerateUiHeader)

    # 自动拷贝依赖
    add_custom_command(
        TARGET ${TARGET} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E echo "Copying DLLs..."
        COMMAND ${DEPLOYQT} --release --dir ${EXECUTABLE_OUTPUT_PATH} ${EXECUTABLE_OUTPUT_PATH}/${TARGET}.exe
        COMMENT "Deploying Qt dependencies"
    )
endif()

```

