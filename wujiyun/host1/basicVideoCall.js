
/*
 *  These procedures use Wuji Video Call SDK for Web to enable local and remote
 *  users to join and leave a Video Call channel managed by Wuji Platform.
 */

/*
 *  Create an  instance.
 *
 * @param {string} mode - The  used by Wuji SDK.
 * @param  {string} codec - The  used by the browser.
 */
window.client = WujiRTC.createClient({ mode: "live", codec: "vp8" , role:"host"});
window.client2 = WujiRTM.createInstance("00000000000000000000000000810958", {
  //"00000000000000000000000000283220", {
  enableLogUpload: false,
 }); // Pass your App ID here.
 window.channel2 = client2.createChannel("test");
 
/*
 * Clear the video and audio tracks used by `client` on initiation.
 */
window.localTracks = {
  videoTrack: null,
  audioTrack: null,
  audioMixingTrack: null,
  audioEffectTrack: null
};
var audioMixing = {
  state: "IDLE", // "IDLE" | "LOADING | "PLAYING" | "PAUSE"
  duration: 0
}

const playButton = $(".play");
let audioMixingProgressAnimation;

/*
 * On initiation no users are connected.
 */
window.remoteUsers = {};
window.joinUsers = {};
/*
 * On initiation. `client` is not attached to any project or channel for any specific user.
 */
window.options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};

/*
 * When this page is called with parameters in the URL, this procedure
 * attempts to join a Video Call channel using those parameters.
 */
$(() => {
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.token = urlParams.get("token");
  options.uid = urlParams.get("uid");
  if (options.appid && options.channel) {
    $("#uid").val(options.uid);
    $("#appid").val(options.appid);
    $("#token").val(options.token);
    $("#channel").val(options.channel);
    $("#join-form").submit();
  }
})

/*
 * When a user clicks Join or Leave in the HTML form, this procedure gathers the information
 * entered in the form and calls join asynchronously. The UI is updated to match the options entered
 * by the user.
 */
$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  try {
    options.appid = $("#appid").val();
    options.token = $("#token").val();
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    client2.login('11');
    client2.on('ConnectionStateChanged', function (newState, reason) {
      // Your code.
      console.log(newState, reason);
      //conn();
    });
    client2.on('MessageFromPeer', function (message, peerId) {
      // Your code.
      console.log('get message');
      conn();
    });
    channel2.on('MemberJoined', memberId => {
      console.log('join in');
      })

    await join();
    if(options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
    $("#audio-mixing").attr("disabled", false);
    $("#audio-effect").attr("disabled", false);
    $("#stop-audio-mixing").attr("disabled", false);
    $("#local-audio-mixing").attr("disabled", false);
  }
})

/*
 * Called when a user clicks Leave in order to exit a channel.
 */
$("#leave").click(function (e) {
  leave();
})
$("#audio-mixing").click(function (e) {
  startAudioMixing();
})
$("#audio-effect").click(async function (e) {
  // play the audio effect
  await playEffect(1, { source: "audio.mp3" });
  console.log("play audio effect success");
})

$("#stop-audio-mixing").click(function (e) {
  stopAudioMixing();
  return false;
})

$(".progress").click(function (e) {
  setAudioMixingPosition(e.offsetX);
  return false;
})
$("#local-audio-mixing").click(function (e) {
  // get selected file
  const file = $("#local-file").prop("files")[0];
  if (!file) {
    console.warn("please choose a audio file");
    return;
  }
  startAudioMixing(file);
  return false;
})
playButton.click(function() {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
    toggleAudioMixing();
    return false;
});

function setAudioMixingPosition(clickPosX) {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
  const newPosition = clickPosX / $(".progress").width();

  // set the audio mixing playing position
  localTracks.audioMixingTrack.seekAudioBuffer(newPosition * audioMixing.duration);
}

async function startAudioMixing(file) {
  if(audioMixing.state === "PLAYING" || audioMixing.state === "LOADING") return;
  const options = {};
  if (file) {
    options.source = file;
  } else {
    options.source = "HeroicAdventure.mp3";
  }
  try {
    audioMixing.state = "LOADING";
    // if the published track will not be used, you had better unpublish it
    if(localTracks.audioMixingTrack) {
      await client.unpublish(localTracks.audioMixingTrack);
    }
    // start audio mixing with local file or the preset file
    localTracks.audioMixingTrack = await WujiRTC.createBufferSourceAudioTrack(options);
    await client.publish(localTracks.audioMixingTrack);
    localTracks.audioMixingTrack.play();
    localTracks.audioMixingTrack.startProcessAudioBuffer({ loop: true });

    audioMixing.duration = localTracks.audioMixingTrack.duration;
    $(".audio-duration").text(toMMSS(audioMixing.duration));
    playButton.toggleClass('active', true);
    setAudioMixingProgress();
    audioMixing.state = "PLAYING";
    console.log("start audio mixing");
  } catch (e) {
    audioMixing.state = "IDLE";
    console.error(e);
  }
}

function stopAudioMixing() {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
  audioMixing.state = "IDLE";

  // stop audio mixing track
  localTracks.audioMixingTrack.stopProcessAudioBuffer();
  localTracks.audioMixingTrack.stop();

  $(".progress-bar").css("width", "0%");
  $(".audio-current-time").text(toMMSS(0));
  $(".audio-duration").text(toMMSS(0));
  playButton.toggleClass('active', false);
  cancelAnimationFrame(audioMixingProgressAnimation);
  console.log("stop audio mixing");
}

function toggleAudioMixing() {
  if (audioMixing.state === "PAUSE") {
    playButton.toggleClass('active', true);
    
    // resume audio mixing
    localTracks.audioMixingTrack.resumeProcessAudioBuffer();

    audioMixing.state = "PLAYING";
  } else {
    playButton.toggleClass('active', false);

    // pause audio mixing
    localTracks.audioMixingTrack.pauseProcessAudioBuffer();

    audioMixing.state = "PAUSE";
  }
}

function setAudioMixingProgress() {
  audioMixingProgressAnimation = requestAnimationFrame(setAudioMixingProgress);
  const currentTime = localTracks.audioMixingTrack.getCurrentTime();
  $(".progress-bar").css("width", `${currentTime / audioMixing.duration * 100}%`);
  $(".audio-current-time").text(toMMSS(currentTime));
}

// use buffer source audio track to play effect.
async function playEffect(cycle, options) {
  // if the published track will not be used, you had better unpublish it
  if(localTracks.audioEffectTrack) {
    await client.unpublish(localTracks.audioEffectTrack);
  }
  localTracks.audioEffectTrack = await WujiRTC.createBufferSourceAudioTrack(options);
  await client.publish(localTracks.audioEffectTrack);
  localTracks.audioEffectTrack.play();
  localTracks.audioEffectTrack.startProcessAudioBuffer({ cycle });
}

$('#conn').click(async function(e) {
  // await client.setClientRole('host');
  // [localTracks.audioTrack,localTracks.videoTrack] = await Promise.all([
  //   WujiRTC.createMicrophoneAudioTrack(),
  //   WujiRTC.createCameraVideoTrack()
  // ]);
  // localTracks.videoTrack.play("local-player");

  // await client.publish(Object.values(localTracks));
  // console.log("publish success");
})
$('#canv').click(async function(e){
  for (var user in remoteUsers) {
    await client.unsubscribe(user, 'video');
  }
});
$('#sendMsg').click(async function(e){
  client2.sendMessageToPeer(
    { text: 'host' }, // 一个 RtmMessage 实例。
    '1234', // 对端用户的 uid。
  ).then(sendResult => {
    if (sendResult.hasPeerReceived) {
      // 你的代码：远端用户收到消息事件。
    } else {
      // 你的代码：服务器已收到消息，对端未收到消息。
    }
  }).catch(error => {
    // 你的代码：点对点消息发送失败。
  });
});
/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {

  // Add an event listener to play remote tracks when remote user publishes.
  client.on("user-joined", handleUserJoined);
  client.on("user-left", handleUserUnJoined);
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // Join a channel and create local tracks. Best practice is to use Promise.all and run them concurrently.
  [ options.uid, localTracks.audioTrack, localTracks.videoTrack ] = await Promise.all([
    // Join the channel.
    client.join(options.appid, options.channel, options.token || null, options.uid || null),
    // Create tracks to the local microphone and camera.
    WujiRTC.createMicrophoneAudioTrack(),
    WujiRTC.createCameraVideoTrack()
  ]);

  // Play the local video track to the local browser and update the UI with the user ID.
  localTracks.videoTrack.play("local-player");
  //localTracks.audioTrack.play();
  $("#local-player-name").text(`localVideo(${options.uid})`);

  // Publish the local video and audio tracks to the channel.
  await client.publish(Object.values(localTracks).filter(track => track !== null));
  console.log("publish success");
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
  stopAudioMixing();
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if(track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // Remove remote users and player views.
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();

  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#audio-mixing").attr("disabled", true);
  $("#audio-effect").attr("disabled", true);
  $("#stop-audio-mixing").attr("disabled", true);
  $("#local-audio-mixing").attr("disabled", true);
  console.log("client leaves channel success");
}


/*
 * Add the local use to a remote channel.
 *
 * @param  {IWujiRTCRemoteUser} user - The  to add.
 * @param {trackMediaType - The  to add.
 */
async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === 'video') {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
}

function handleUserJoined(user) {
  console.log('join xxx');
  const id = user.uid;
  joinUsers[id] = user;
}
function handleUserUnJoined(user) {
  const id = user.uid;
  delete joinUsers[id];
}
/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IWujiRTCRemoteUser} user - The  to add.
 * @param {trackMediaType - The  to add.
 */
function handleUserPublished(user, mediaType) {
  console.log('publish xxx');
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The  to remove.
 */
function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}

// calculate the MM:SS format from millisecond
function toMMSS(second) {
  // const second = millisecond / 1000;
  let MM = parseInt(second / 60);
  let SS = parseInt(second % 60);
  MM = MM < 10 ? "0" + MM : MM;
  SS = SS < 10 ? "0" + SS : SS;
  return `${MM}:${SS}`;
}
