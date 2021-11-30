
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
  //videoTrack: null,
  audioTrack: null
};

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
    //await join();
    client2.login('1234');
    client2.on('MessageFromPeer', function (message, peerId) {
      // Your code.
      console.log('get message');
      conn();
    });
    client2.on('ConnectionStateChanged', function (newState, reason) {
      // Your code.
      console.log(newState, reason);
      //conn();
    });
    channel2.on('MemberJoined', memberId => {
      console.log('join in');
      })

    await subs();
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
  }
})

/*
 * Called when a user clicks Leave in order to exit a channel.
 */
$("#leave").click(function (e) {
  leave();
})
$("#subs").click(async function (e) {
  e.preventDefault();
  $("#subs").attr("disabled", true);
  try {
    options.appid = $("#appid").val();
    options.token = $("#token").val();
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    await subs();
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
  }
})
async function conn(e) {
  await client.setClientRole('host');
  [localTracks.audioTrack] = await Promise.all([
    WujiRTC.createMicrophoneAudioTrack(),
    //WujiRTC.createCameraVideoTrack()
  ]);
  //localTracks.videoTrack.play("local-player");
  localTracks.audioTrack.play();

  await client.publish(Object.values(localTracks));
  console.log("conn success");
}
$('#conn').click(conn);

$('#disconn').click(async function(e) {
  await client.unpublish();
  await client.setClientRole('audience');
  remoteUsers = {};
  $("#remote-playerlist").html("");
})

async function subs() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // Join a channel and create local tracks. Best practice is to use Promise.all and run them concurrently.
  [ options.uid] = await Promise.all([
    // Join the channel.
    client.join(options.appid, options.channel, options.token || null, options.uid || null),
    // Create tracks to the local microphone and camera.
    //WujiRTC.createMicrophoneAudioTrack(),
    //WujiRTC.createCameraVideoTrack()
  ]);

  // Play the local video track to the local browser and update the UI with the user ID.
  //localTracks.videoTrack.play("local-player");
  //localTracks.audioTrack.play();
  $("#local-player-name").text(`localVideo(${options.uid})`);

  // Publish the local video and audio tracks to the channel.
  //await client.publish(Object.values(localTracks));
  console.log("subs success");
}
async function notsubs() {
  await client.unpublish();
}
/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {

  // Add an event listener to play remote tracks when remote user publishes.
  //client.on("user-joined", handleUserJoined);
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
  await client.publish(Object.values(localTracks));
  console.log("publish success");
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
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
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.audioTrack.play();
  }
}

function handleUserJoined(user) {
  console.log('join xxx');
  const id = user.uid;
  joinUsers[id] = user;
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
