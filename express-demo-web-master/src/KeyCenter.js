
let appID = 1702812850; // 请从官网控制台获取对应的appID Please obtain the corresponding appid from the official website console
let server = 'wss://webliveroom1702812850-api.imzego.com/ws'; // 请从官网控制台获取对应的server地址，否则可能登录失败 Please obtain the corresponding server address from the console on the official website, otherwise the login may fail
var baseURL = window.location.href.match(/.*\/Examples/)[0]
// get local appID and server
let appInfo = {}
if (!appID || !server) {
  try {
    const appInfoStr = localStorage.getItem("app_info")
    const parseAppInfo = JSON.parse(appInfoStr)
    appInfo = parseAppInfo || appInfo
  } catch (error) {
    localStorage.removeItem("app_info")
  }
  if (!appInfo.appID || !appInfo.server) {
    alert("Need to set appID and server url!")
    window.location.href = `${baseURL}/DebugAndConfig/InitSettings/index.html`
  }
} else {
  localStorage.setItem("app_info", JSON.stringify({
    appID,
    server
  }))
}
appID = appInfo.appID;
server = appInfo.server;
appID = 1702812850;
server = 'wss://webliveroom1702812850-api.imzego.com/ws';
console.log('appid:' + appID);
console.log('server:' + server);
$(".goToDoc").html(
  `
  <li>
    <b>AppID: ${appID} ; Server: "${server}" ; </b>
    <a data-lang="HelpSettingsPage" href="${baseURL}/DebugAndConfig/InitSettings/index.html">this</a>.
  </li>
` + $(".goToDoc").html()
)