
function addScript(src, cb) {
    var script = document.createElement("script");  // 穿件一个script 标签
    script.src = src;  // 把script的src设置为我们请求数据的地址并传递参数 和回调函数 
    document.getElementsByTagName('head')[0].appendChild(script); // 把script 插入到body里面 
    setTimeout(function (ev) {
        if (cb) cb();
    }, 500)
}
// addScript('//www.maxmon.top/html5_iat/js/fingerprint2.min.js', function () {
    addScript('html5_iat/js/iat.all.js', function () {
        var box = document.createElement('div');
        box.innerHTML = '<div class="clear"></div><h2 id="iat_result">语音听写</h2><div style="position:relative"><div id="mmA">点击开始录音</div><div id="canvas_wrapper" style="display:none"><div style="display: inline">&spades;</div><canvas id="volume" height="4"></canvas></div></div>';
        box.id = 'tfly-box';
        document.body.appendChild(box);
        var tq = document.createElement('div');
        tq.setAttribute('onselectstart', 'return false;');
        tq.className = 'mm-tq';
        document.body.appendChild(tq);
        tq.innerHTML = '<div class="mm-chat-box mm-bubble-hide"><p class="mm-msg" id="mm-msg">你好呀</p><div class="bubble-bottom"></div></div><img class="mm-self" src="html5_iat/images/tq.png"><style>#tfly-box {display: none;}.mm-tq img {pointer-events: none;}.mm-tq {position: fixed;top: 81px;left: 81px;display: inline-block;-webkit-user-select: none;user-select: none;-webkit-tap-highlight-color: rgba(0, 0, 0, 0);}.mm-chat-box {position: absolute;bottom: 81px;width: 81px;vertical-align: top;box-sizing: border-box;overflow: hidden;}.mm-chat-box p{border: 5px solid black;border-bottom: 0;}.bubble-bottom {width: 100%;height: 9px;background-size: auto;background-repeat: no-repeat;background-position: bottom;}.mm-bubble-run .bubble-bottom{background-image: url("html5_iat/images/chat-bubble2.gif");}.mm-bubble-stop .bubble-bottom{background-image: url("//maxmon.top/html5_iat/images/chat-bubble2-stop.png");}.mm-bubble-hide{visibility: hidden !important;}.mm-chat-box .mm-msg {margin: 0;padding: 0;text-align: left;font-size: 12px;color: #2d2d2d;line-height: 1.5em;}</style>'

        addScript('html5_iat/js/mmText2Word.js', function () {
            addScript('html5_iat/js/demo.js', function () {
                onerror = function (a, b, c) {
                    alert(a + b + c);
                }
                var mmA = document.getElementById('mmA');
                window.addEventListener('keydown', function (ev) {
                    if (ev.ctrlKey && ev.key === 'm') {
                        mmA.click();
                    }
                })
                mmA.addEventListener('click', function() {
                    document.body.style.backgroundColor = '#fff';
                })
                var tqBox = document.getElementsByClassName('mm-tq')[0];
                if (tqBox) {
                    tqBox.addEventListener('mousedown', function (event) {
                        mousedown(event, mmA)
                    })
                    tqBox.addEventListener('touchstart', function (event) {
                        mousedown(event, mmA)
                    })
                    window.addEventListener('mouseup', function (event) {
                        mouseup(event, tqBox);
                    })
                    window.addEventListener('mousemove', function (event) {
                        mouseup(event, tqBox, window.isCatchTq);
                    })
                    window.addEventListener('touchend', function (event) {
                        mouseup(event, tqBox);
                    })
                    window.addEventListener('touchmove', function (event) {
                        mouseup(event, tqBox, window.isCatchTq);
                    })
                }
            });
        });
    });
    function mousedown(event, mmA) {
        window.isCatchTq = true;
        window.tqX = event.x || (event.changedTouches ? event.changedTouches[0].clientX : '');
        window.tqY = event.y || (event.changedTouches ? event.changedTouches[0].clientY : '');
        mmA.click();
    }
    function mouseup(event, tqBox, isCatchTq) {
        if (window.isCatchTq) {
            if (!tqBox.style.top) tqBox.style.top = '81px';
            if (!tqBox.style.left) tqBox.style.left = '81px';
            x = event.x || (event.changedTouches ? event.changedTouches[0].clientX : '');
            y = event.y || (event.changedTouches ? event.changedTouches[0].clientY : '');
            tqBox.style.top = parseInt(tqBox.style.top || 0) + (y - window.tqY) + 'px';
            tqBox.style.left = parseInt(tqBox.style.left || 0) + (x - window.tqX) + 'px';
            window.isCatchTq = !!isCatchTq;
            window.tqX = event.x || (event.changedTouches ? event.changedTouches[0].clientX : '');
            window.tqY = event.y || (event.changedTouches ? event.changedTouches[0].clientY : '');
        }
    }
// });
