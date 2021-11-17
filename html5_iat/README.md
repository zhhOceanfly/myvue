# 科大讯飞AI应用实例

#### 项目介绍
{**此项目需要通过script加载应用**}
帮助你更好的阅读网页

#### 项目地址
[https://gitee.com/ko-orz/html5_iat]('https://gitee.com/ko-orz/html5_iat')

#### 引用项目
```JavaScript
function addScript(src, cb) {
    var script = document.createElement("script");  // 穿件一个script 标签
    script.src = src;  // 把script的src设置为我们请求数据的地址并传递参数 和回调函数
    document.head.appendChild(script); // 把script 插入到body里面
    setTimeout(function (ev) {
        if (cb) cb();
    }, 500)
}
addScript('https://www.maxmon.top/html5_iat/js/mmHelper.js') // 天奇精灵（我放在服务器上的可以直接使用的版本）
addScript('https://www.maxmon.top/visit?code=10086') // 访问记录助手（这个脚本与本项目无关，混个脸熟）
```

#### 项目示例
1. [https://www.maxmon.top/html5_iat/iat.html](https://www.maxmon.top/html5_iat/iat.html)
2. [和天奇精灵说“汇总”](https://images.gitee.com/uploads/images/2018/0719/012633_6afacf0a_1384496.png "屏幕截图.png")
3. [和天奇精灵说“你好”](https://images.gitee.com/uploads/images/2018/0719/012733_427fd05c_1384496.png "屏幕截图.png")
4. [和天奇精灵说“今天杭州的天气”](https://images.gitee.com/uploads/images/2018/0719/012939_842533db_1384496.png "屏幕截图.png")
5. 和天奇精灵说“向下向下向下”会往下滚动屏幕