var rtc = {
  // 用来放置本地客户端。
  client: null,
  // 用来放置本地音视频频轨道对象。
  localAudioTrack: null,
  localVideoTrack: null,
};

var options = {
  // TODO 替换成你自己项目的 App ID。
  appId: 'App ID',
  // 传入目标频道名。
  channel: 'test',
  // 如果你的项目开启了 App 证书进行 Token 鉴权，这里填写生成的 Token 值。
  token: null,
};

async function startBasicCall() {
  /**
   * 接下来的代码写在这里。
   */

  // WujiRTC.CUSTOMER = '';

  // 1. 创建本地客户端
  rtc.client = WujiRTC.createClient({mode: 'rtc', codec: 'vp8'});

  // 4. 订阅远端用户
  rtc.client.on('user-published', async (user, mediaType) => {
    // 开始订阅远端用户。
    await rtc.client.subscribe(user, mediaType);
    console.log('subscribe success');

    // 表示本次订阅的是视频。
    if (mediaType === 'video') {
      // 订阅完成后，从 `user` 中获取远端视频轨道对象。
      const remoteVideoTrack = user.videoTrack;
      // 动态插入一个 DIV 节点作为播放远端视频轨道的容器。
      const playerContainer = document.createElement('div');
      // 给这个 DIV 节点指定一个 ID，这里指定的是远端用户的 UID。
      playerContainer.id = user.uid.toString();
      playerContainer.style.width = '640px';
      playerContainer.style.height = '480px';
      document.body.append(playerContainer);

      // 订阅完成，播放远端音视频。
      // 传入 DIV 节点，让 SDK 在这个节点下创建相应的播放器播放远端视频。
      remoteVideoTrack.play(playerContainer);

      // 也可以只传入该 DIV 节点的 ID。
      // remoteVideoTrack.play(playerContainer.id);
    }

    // 表示本次订阅的是音频。
    if (mediaType === 'audio') {
      // 订阅完成后，从 `user` 中获取远端音频轨道对象。
      const remoteAudioTrack = user.audioTrack;
      // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
      remoteAudioTrack.play();
    }
  });

  rtc.client.on('user-unpublished', (user, mediaType) => {
    if (mediaType === 'video') {
      // 获取刚刚动态创建的 DIV 节点。
      const playerContainer = document.getElementById(user.uid.toString());
      // 销毁这个节点。
      playerContainer.remove();
    }
  });

  // 2. 加入目标频道
  const uid = await rtc.client.join(options.appId, options.channel, options.token, null);

  // 3. 创建并发布本地音视频轨道
  // 通过麦克风采集的音频创建本地音频轨道对象。
  rtc.localAudioTrack = await WujiRTC.createMicrophoneAudioTrack();
  // 通过摄像头采集的视频创建本地视频轨道对象。
  rtc.localVideoTrack = await WujiRTC.createCameraVideoTrack();
  // 将这些音视频轨道对象发布到频道中。
  await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);
  // 动态插入一个 DIV 节点作为播放远端视频轨道的容器。
  const playerContainer = document.createElement('div');

  // 给这个 DIV 节点指定一个 ID，用于播放本地摄像头采集视频。
  playerContainer.id = 'localPlayer';
  playerContainer.style.width = '640px';
  playerContainer.style.height = '480px';
  document.body.append(playerContainer);
  // 传入 DIV 节点ID，让 SDK 在这个节点下创建相应的播放器播放本地视频。
  rtc.localVideoTrack.play('localPlayer');

  console.log('publish success!');
}

// 5. 离开频道
async function leaveCall() {
  // 销毁本地音视频轨道。
  rtc.localAudioTrack.close();
  rtc.localVideoTrack.close();

  // 遍历远端用户。
  rtc.client.remoteUsers.forEach(user => {
    // 销毁动态创建的 DIV 节点。
    document.getElementById(user.uid)?.remove();
  });

  document.getElementById('localPlayer')?.remove();

  // 离开频道。
  await rtc.client.leave();
}

document.getElementById('join').addEventListener('click', startBasicCall);
document.getElementById('leave').addEventListener('click', leaveCall);
