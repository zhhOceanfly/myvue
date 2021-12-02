## 跑通示例源码

### 1 概览

本文介绍如何快速跑通示例源码，体验即时通讯服务。

### 2 准备环境

在运行示例源码前，请确保开发环境满足以下要求：

- 电脑或手机等设备安装了浏览器。
- 设备已连接到网络。
- 浏览器版本及兼容性，请参考 [平台兼容](https://doc-zh.zego.im/article/12807#5)。

### 3 前提条件

- 请联系 ZEGO 技术支持，申请需要接入 SDK 服务所需的 AppID 和 ServerSecret。
- 请先获取登录 SDK 所需的 Token，详情请参考 [使用 Token 鉴权](https://doc-zh.zego.im/article/12683)。

### 4 示例源码目录结构

下列结构为 IM 源码文件的子目录结构，下文所涉及的文件路径均为相对于此目录的路径。

```bash
├── README.md
├── assets
│   ├── css
│   │   └── index.css
│   ├── image
│   │   ├── chat_1.svg
│   │   ├── chat_2.svg
│   └── js
│       ├── biz.js
│       ├── config.js
│       ├── crypto-js.min.js
│       └── zim.js
├── index.html
```

### 5 运行示例源码

1. 打开 “assets/js” 文件夹下的 “config.js” 文件，并使用本文 `3 前提条件` 已获取的 AppID 和 ServerSecret 正确填写，并保存。

    ```javascript
    var appConfig = {
        appID: 0, // 填写申请的 AppID
        serverSecret: '', // 填写申请的 ServerSecret
    };
    ```

2. 在浏览器中打开 “index.html” 文件。
