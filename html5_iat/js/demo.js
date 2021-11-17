/**
 * Created by zhangqi on 16/10/12.
 */
var iflytek = (function (document) {
    var iat_result = document.getElementById('iat_result');
    var tip = document.getElementById('mmA');
    var volumeTip = document.getElementById('volume');
    volumeTip.width = parseFloat(window.getComputedStyle(tip, null).width) - 100;
    var volumeWrapper = document.getElementById('canvas_wrapper');
    var oldText = tip.innerHTML;
    /* 标识麦克风按钮状态，按下状态值为true，否则为false */
    var mic_pressed = false;
    var volumeEvent = (function () {
        var lastVolume = 0;
        var eventId = 0;
        var canvas = volumeTip,
            cwidth = canvas.width,
            cheight = canvas.height;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createLinearGradient(0, 0, cwidth, 0);
        var animationId;
        gradient.addColorStop(1, 'red');
        gradient.addColorStop(0.8, 'yellow');
        gradient.addColorStop(0.5, '#9ec5f5');
        gradient.addColorStop(0, '#c1f1c5');

        volumeWrapper.style.display = "none";

        var listen = function (volume) {
            lastVolume = volume;
        };
        var draw = function () {
            if (volumeWrapper.style.display == "none") {
                cancelAnimationFrame(animationId);
            }
            ctx.clearRect(0, 0, cwidth, cheight);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1 + lastVolume * cwidth / 30, cheight);
            animationId = requestAnimationFrame(draw);
        };
        var start = function () {
            mic_pressed = true;
            // console.log('session start');
            animationId = requestAnimationFrame(draw);
            volumeWrapper.style.display = "block";
            bubbleRun();
        };
        var stop = function () {
            mic_pressed = false;
            // console.log('session stop');
            clearInterval(eventId);
            volumeWrapper.style.display = "none";
            bubbleStop();
        };
        return {
            "listen": listen,
            "start": start,
            "stop": stop
        };
    })();
    /***********************************************local Variables**********************************************************/

    /**
     * 初始化Session会话
     */
    var session = new IFlyIatSession({
        "callback": {
            "onResult": function (err, result) {
                // console.log('err', err);
                // console.log('result', result);
                /* 若回调的err为空或错误码为0，则会话成功，可提取识别结果进行显示*/
                if (err == null || err == undefined || err == 0) {
                    if (result == '' || result == null)
                        iat_result.innerHTML = "没有获取到识别结果";
                    else
                        doSuccessThing(result);
                    /* 若回调的err不为空且错误码不为0，则会话失败，可提取错误码 */
                } else {
                    iat_result.innerHTML = 'error code : ' + err + ", error description : " + result;
                }
                mic_pressed = false;
                volumeEvent.stop();
            },
            "onVolume": function (volume) {
                // console.log('volume', volume);
                volumeEvent.listen(volume);
            },
            "onError": function (err) {
                mic_pressed = false;
                // console.log('onError', err);
                volumeEvent.stop();
            },
            "onProcess": function (status) {
                // console.log('status', status);
                switch (status) {
                    case 'onStart':
                        tip.innerHTML = "服务初始化...";
                        break;
                    case 'normalVolume':
                    case 'started':
                        tip.innerHTML = "倾听中...";
                        break;
                    case 'onStop':
                        tip.innerHTML = "等待结果...";
                        break;
                    case 'onEnd':
                        tip.innerHTML = oldText;
                        break;
                    case 'lowVolume':
                        tip.innerHTML = "倾听中...(声音过小)";
                        break;
                    default:
                        tip.innerHTML = status;
                }
            }
        }
    });

    if (!session.isSupport()) {
        tip.innerHTML = "当前浏览器不支持！";
        doSuccessThing("当前浏览器不支持！");
        bubbleRun();
        return;
    }

    var play = function () {
        // console.log('mic_pressed', mic_pressed);
        if (!mic_pressed) {
            bubbleRun();
            var ssb_param = {
                "grammar_list": null,
                "params": "appid=577678df,appidkey=091585e4ed07356c, lang = sms, acous = anhui, aue=speex-wb;-1, usr = mkchen, ssm = 1, sub = iat, net_type = wifi, rse = utf8, ent =sms16k, rst = plain, auf  = audio/L16;rate=16000, vad_enable = 1, vad_timeout = 5000, vad_speech_tail = 500, compress = igzip"
            };
            iat_result.innerHTML = '   ';
            /* 调用开始录音接口，通过function(volume)和function(err, obj)回调音量和识别结果 */
            session.start(ssb_param);
            volumeEvent.start();
        }
        else {
            //停止麦克风录音，仍会返回已传录音的识别结果.
            session.stop();
            volumeEvent.stop();
        }
    }

    /**
     * 取消本次会话识别
     */
    var cancel = function () {
        session.cancel();
    }

    tip.addEventListener("click", function () {
        play();
        // console.log('play')
    });
    //页面不可见，断开麦克风调用
    document.addEventListener("visibilitychange", function () {
        if (document.hidden == true) {
            session.kill();
        }
    });

    function doSuccessThing(result) {
        bubbleStop();
        iat_result.innerHTML = result;

        var mmMsg = document.getElementById('mm-msg');
        if (mmMsg) {
            mmMsg.innerText = result;
            mmMsg.style.color = '#CCC';
        }

        // console.log('>', result);
        // window.open('http://www.baidu.com/s?wd=' + result);
        if (result.match(/(分词|拆分|汇总|细分)/)) {
            getMmText2Word(window.document.body.innerText, mmMsg)
        } else if (result.match(/(左|右|下|上)/)) {
            var x = window.scrollX + getMatch(result, /右/g) * 200 - getMatch(result, /左/g) * 200;
            var y = window.scrollY + getMatch(result, /下/g) * 500 - getMatch(result, /上/g) * 500;
            window.scrollTo(x, y)
        } else if (result == '当前浏览器不支持！') {
            mmSay('换Chrome浏览器试试吧', mmMsg);
        } else {
            getTLRes(result, mmMsg);
        }
    }
    window.doSuccessThing = doSuccessThing; 
    function mmSay(res, mmMsg) {
        mmMsg = mmMsg || document.getElementById('mm-msg');
        mmMsg.innerText = res;
        mmMsg.style.color = '#000'
    }
    function getMatch(src, reg) {
        var arr = src.match(reg);
        if (arr) return arr.length;
        else return 0;
    }

    function getMmText2Word(result, mmMsg) {
        var res = mmText2Word(result, {
            THRESHOLD_VALUE: 6,
            TOP_SHOW_NUM: 8,
            GET_HOW_LONG_WORD: "001111"
        }).join('\n');
        // console.log('t2w<', res);
        if (mmMsg) {
            mmSay(res, mmMsg);
        }
    }

    function getTLRes(result, mmMsg) {
        mmMsg = mmMsg || document.getElementById('mm-msg');
        ajax_method('//www.maxmon.top/talk?q=' + result, '', 'get', function (res) {
            bubbleStop();
            // console.log('tl<', res);
            if (mmMsg) {
                mmSay(res, mmMsg);
            }
        })
    }
    window.mmSay = mmSay;
    window.getTLRes = getTLRes;

})(document)


function ajax_method(url, data, method, success) {
    // 异步对象
    var ajax = new XMLHttpRequest();

    // get 跟post  需要分别写不同的代码
    if (method == 'get') {
        // get请求
        if (data) {
            // 如果有值
            url += '?';
            url += data;
        } else {

        }
        // 设置 方法 以及 url
        ajax.open(method, url);

        // send即可
        ajax.send();
    } else {
        // post请求
        // post请求 url 是不需要改变
        ajax.open(method, url);

        // 需要设置请求报文
        ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        // 判断data send发送数据
        if (data) {
            // 如果有值 从send发送
            ajax.send(data);
        } else {
            // 木有值 直接发送即可
            ajax.send();
        }
    }

    // 注册事件
    ajax.onreadystatechange = function () {
        // 在事件中 获取数据 并修改界面显示
        if (ajax.readyState == 4 && ajax.status == 200) {
            // // console.log(ajax.responseText);

            // 将 数据 让 外面可以使用
            // return ajax.responseText;

            // 当 onreadystatechange 调用时 说明 数据回来了
            // ajax.responseText;

            // 如果说 外面可以传入一个 function 作为参数 success
            success(ajax.responseText);
        }
    }

}

function bubbleRun() {
    // console.log('开启弹框')
    var mmChatBoxs = document.getElementsByClassName('mm-chat-box');
    if (mmChatBoxs.length) {
        mmChatBoxs[0].className = 'mm-chat-box mm-bubble-run';
        bubble2Hide();
    }
}

function bubbleStop() {
    var mmChatBoxs = document.getElementsByClassName('mm-chat-box');
    if (mmChatBoxs.length) {
        mmChatBoxs[0].className = 'mm-chat-box mm-bubble-stop';
        bubble2Hide();
    }
}

function bubble2Hide() {
    mic_pressed = false;
    if (window.tqBubbleHideTimer) clearTimeout(window.tqBubbleHideTimer);
    window.tqBubbleHideTimer = setTimeout(function () {
        var mmChatBoxs = document.getElementsByClassName('mm-chat-box');
        if (mmChatBoxs.length) {
            mmChatBoxs[0].className = 'mm-chat-box mm-bubble-hide';
        }
    }, 5000);
}