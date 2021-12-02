var appConfig = {
    appID: 1702812850, // 填写申请的 AppID
    serverSecret: 'a1a5c50a025093316491e33683906ff5', // 填写申请的 ServerSecret
};

/**
 * 生成 token
 *
 * Token = “04” + Base64.encode(expire_time + IV.length + IV + 二进制密文.length + 二进制密文)
 * 算法：AES<ServerSecret, IV>(token_json_str)，使用模式: CBC/PKCS5Padding
 *
 * 这里仅提供生成 token 的客户端示例代码。请务必在您的业务后台生成 token，避免泄漏您的 ServerSecret
 */
function generateToken(userID, seconds) {
    if (!userID) return '';

    // 构造 加密数据
    var time = (Date.now() / 1000) | 0;
    var body = {
        app_id: appConfig.appID,
        user_id: userID,
        nonce: (Math.random() * 2147483647) | 0,
        ctime: time,
        expire: time + (seconds || 7200),
    };
    // 加密 body
    var key = CryptoJS.enc.Utf8.parse(appConfig.serverSecret);
    var iv = Math.random().toString().substr(2, 16);
    if (iv.length < 16) iv += iv.substr(0, 16 - iv.length);

    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(body), key, { iv: CryptoJS.enc.Utf8.parse(iv) }).toString();
    var ciphert = Uint8Array.from(Array.from(atob(ciphertext)).map((val) => val.charCodeAt(0)));
    var len_ciphert = ciphert.length;

    // 组装 token 数据
    var uint8 = new Uint8Array(8 + 2 + 16 + 2 + len_ciphert);
    // expire: 8
    uint8.set([0, 0, 0, 0]);
    uint8.set(new Uint8Array(Int32Array.from([body.expire]).buffer).reverse(), 4);
    // iv length: 2
    uint8[8] = 16 >> 8;
    uint8[9] = 16 - (uint8[8] << 8);
    // iv: 16
    uint8.set(Uint8Array.from(Array.from(iv).map((val) => val.charCodeAt(0))), 10);
    // 密文 length: 2
    uint8[26] = len_ciphert >> 8;
    uint8[27] = len_ciphert - (uint8[26] << 8);
    // 密文
    uint8.set(ciphert, 28);

    var token = `04${btoa(String.fromCharCode(...Array.from(uint8)))}`;
    console.log('generateToken', iv.length, body, token);

    return token;
}
