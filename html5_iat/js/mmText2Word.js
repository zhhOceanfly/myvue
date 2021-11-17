function mmText2Word(srcText, opt) {

    opt = opt || {};
    var THRESHOLD_VALUE = opt.THRESHOLD_VALUE || 5;
    var TOP_SHOW_NUM = opt.TOP_SHOW_NUM || 10;
    var GET_HOW_LONG_WORD = opt.GET_HOW_LONG_WORD || "000100";// 获取2字的词
    function $(byWhat) {
        switch (byWhat[0]) {
            case "#":
                return document.getElementById(byWhat.substr(1));
                break;
            case ".":
                return document.getElementsByClassName(byWhat.substr(1));
                break;
            default:
                return document.getElementsByTagName(byWhat);
        }
    }

    // 放入字典
    function innerSetCharKey(outerDic, i, inputText, innerLoft) {
        innerLoft--;
        var key = inputText[i];
        if (outerDic[key]) {
            outerDic[key]['num'] += 1;
        } else {
            outerDic[key] = {};
            outerDic[key]['num'] = 1;
        }
        if (innerLoft > 0) {
            innerSetCharKey(outerDic[key], ++i, inputText, innerLoft);
        } else {
            // if (outerDic[key]) {
            //     outerDic[key] += 1;
            // } else {
            //     outerDic[key] = 1;
            // }
        }
    }

    function getNextWordDic(inputText) {
        inputText = inputText.replace(/[\=\#\;\`\<\>\s\/.,?!'":~\(\)\[\]\*\&，。？！【】、\n\r·▪\-—“”‘’：�\d|a-z|0-9]/g, "");
        var len = inputText.length;
        var nextWordDic = { num: 0 };
        for (var i = 0; i < (len - THRESHOLD_VALUE); i++) {
            innerSetCharKey(nextWordDic, i, inputText, THRESHOLD_VALUE);
        }
        return nextWordDic;

    }

    // 解析
    function innerGetCharKey(outerDic, wordBeforeArr, sumWordArr, innerLoft) {
        innerLoft--;
        if (innerLoft >= 0) {
            for (var key in outerDic) {
                if (key == 'num') continue;
                var newBeforeArr = wordBeforeArr;
                newBeforeArr += key;
                if (outerDic[key]['num'] >= TOP_SHOW_NUM && GET_HOW_LONG_WORD[THRESHOLD_VALUE - innerLoft] == 1) {
                    sumWordArr.push(newBeforeArr);
                    // TODO: 优化个数，返回使用到次数最多的5个
                }
                innerGetCharKey(outerDic[key], newBeforeArr, sumWordArr, innerLoft);
            }
        }
    }
    /**
     * 将wordArr瘦身
     * @param {Array} wordArr 待缩小的数组
     */
    function dropSmaller(wordArr) {
        var sampleArr = [];
        var smallerIndex = {};
        var srcLen = wordArr.length;
        for (var i = 0; i < srcLen; i++) {
            for (var j = 0; j < srcLen; j++) {
                if ((wordArr[i].indexOf(wordArr[j]) > -1) && (wordArr[i].length > wordArr[j].length)) {
                    smallerIndex[j] = true; // 给小的那个打上标记
                }
            }
        }
        for (var i = 0; i < srcLen; i++) {
            if (!smallerIndex[i]) {
                // 取出 不是小的那些
                sampleArr.push(wordArr[i])
            }
        }
        // wordArr = sampleArr; 错误示例，内部的wordArr由于指针改变，之后就与外面的无关了，需要用return
        return sampleArr;
    }
    function getWordArr(nextWordDic) {
        var wordArr = []
        innerGetCharKey(nextWordDic, "", wordArr, THRESHOLD_VALUE);
        // 去掉 3个词中的2个词
        wordArr = dropSmaller(wordArr);
        return wordArr;
    }
    return getWordArr(getNextWordDic(srcText));
}