var zim = ZIM.create(appConfig.appID);

var mixEvent = {
    methods: {
        on_error(error) {
            if (error && typeof error.code == 'number') {
                this._toast && this._toast.close();
                this._toast = this.$message.error(`${error.code}: ${error.message}`);
            }
            console.warn('===error===', error);
        },
        on_connectionStateChanged(state, event, extendedData) {
            console.log('===connectionStateChanged===', state, event, extendedData);
            var stateTips = ['已断开连接', '正在连接', '连接成功'];
            this._toast && this._toast.close();
            this._toast = this.$message(stateTips[state]);
            if (state == 0) {
                this.setRouter(0);
            }
        },
        on_roomStateChanged(state, event, extendedData, roomID) {
            console.log('===roomStateChanged===', roomID, state, event, extendedData);
            var stateTips = ['房间已断开连接', '房间正在连接', '房间连接成功'];
            this._toast && this._toast.close();
            this._toast = this.$message(stateTips[state]);
            // 被踢出房间、房间销毁
            if (roomID == this.chatPickForm.roomID && state == 0) {
                this.setRouter(1);
                this.title = this.loginForm.userID;
            }
        },
        on_tokenWillExpire(second) {
            console.log('===tokenWillExpire===', second);
            this.$message.warning(`token will expire ${second}`);
            zim.renewToken(generateToken(this.loginForm.userID)).catch(this.on_error);
        },
        on_roomMemberJoined(memberList, roomID) {
            console.log('===roomMemberJoined===', memberList, roomID);
            if (roomID !== this.chatPickForm.roomID) return;
            memberList.forEach((user) => {
                var userID = user.userID;
                var index = this.users.findIndex((item) => userID === item.userID);
                if (index == -1) {
                    this.users.push(user);
                }
            });
            this.refreshUserCount();
        },
        on_roomMemberLeft(memberList, roomID) {
            console.log('===roomMemberLeft===', memberList, roomID);
            if (roomID !== this.chatPickForm.roomID) return;
            memberList.forEach((user) => {
                var userID = user.userID;
                var index = this.users.findIndex((item) => userID === item.userID);
                if (index != -1) {
                    this.users.splice(index, 1);
                }
            });
            this.refreshUserCount();
        },
        on_receivePeerMessage(messageList, fromUserID) {
            console.log('===receivePeerMessage===', messageList, fromUserID);
            if (fromUserID == this.chatPickForm.toUserID && this.router == 2 && !this.isRoomChat) {
                this.msgs.push(...messageList);
                this.scroll2bottom();
            }
        },
        on_receiveRoomMessage(messageList, fromRoomID) {
            console.log('===receiveRoomMessage===', messageList, fromRoomID);
            if (fromRoomID == this.chatPickForm.roomID && this.router == 2 && this.isRoomChat) {
                this.msgs.push(...messageList);
                this.scroll2bottom();
            }
        },
    },
};

var mixUitl = {
    methods: {
        saveViewData() {
            var config = {
                router: this.router,
                loginForm: this.loginForm,
                chatPickForm: this.chatPickForm,
                isRoomChat: this.isRoomChat,
                isShowUsers: this.isShowUsers,
                textMsg: this.textMsg,
                byteMsg: this.byteMsg,
            };
            sessionStorage.setItem('zimviewdata', JSON.stringify(config));
        },
        restoreViewData() {
            var config = sessionStorage.getItem('zimviewdata');
            if (config) {
                config = JSON.parse(config);
                this.router = config.router;
                this.loginForm = config.loginForm;
                this.chatPickForm = config.chatPickForm;
                this.isRoomChat = config.isRoomChat;
                this.isShowUsers = config.isShowUsers;
                this.textMsg = config.textMsg;
                this.byteMsg = config.byteMsg;

                setTimeout(() => {
                    if (this.router == 0) return;
                    this.loading = true;
                    zim.login(this.loginForm, generateToken(this.loginForm.userID))
                        .then(() => {
                            this.loading = false;
                            if (this.router == 2) {
                                if (this.isRoomChat) {
                                    this.joinRoom();
                                } else {
                                    this.joinPeerChat();
                                }
                            }
                        })
                        .catch((err) => {
                            this.loading = false;
                            this.on_error(err);
                        });
                }, 500);
            }
        },
        setRouter(page) {
            if (this.router == 0 && page == 1) {
                this.chatPickForm.toUserID = '';
                this.chatPickForm.roomID = '';
                this.chatPickForm.roomName = '';
            } else if (this.router == 1 && page == 2) {
                this.textMsg = '';
                this.byteMsg = false;
            }
            this.router = page;
        },
        initLog() {
            zim.setLogConfig({
                logLevel: 'info',
            });
        },
        initEvent() {
            var events = [
                'error',
                'connectionStateChanged',
                'roomStateChanged',
                'tokenWillExpire',
                'roomMemberJoined',
                'roomMemberLeft',
                'receivePeerMessage',
                'receiveRoomMessage',
            ];
            events.forEach((key) => {
                zim.on(key, (...args) => {
                    this['on_' + key](...args.slice(1));
                });
            });
        },
        joinRoom() {
            zim.joinRoom(this.chatPickForm.roomID).then(this.joinRoomChat).catch(this.on_error);
        },
        joinRoomChat(res) {
            this.setRouter(2);
            this.msgs = [];
            this.users = [];
            this.chatPickForm.roomName = res.baseInfo.roomName;
            this.refreshUserList('');
            this.refreshUserCount();
        },
        joinPeerChat() {
            this.setRouter(2);
            this.title = this.chatPickForm.toUserID;
            this.msgs = [];
        },
        refreshUserCount() {
            zim.queryRoomOnlineMemberCount(this.chatPickForm.roomID)
                .then((res) => {
                    this.title = `${this.chatPickForm.roomName}(${res.count})`;
                })
                .catch(this.on_error);
        },
        leaveRoom() {
            zim.leaveRoom(this.chatPickForm.roomID).catch(this.on_error);
            this.setRouter(1);
            this.title = this.loginForm.userID;
        },
        createMessage() {
            var text = unescape(encodeURIComponent(this.textMsg));
            var message = this.byteMsg ? Uint8Array.from(Array.from(text).map((c) => c.charCodeAt(0))) : this.textMsg;
            return {
                priority: 2,
                type: this.byteMsg ? 2 : 1,
                message,
            };
        },
        sendPeerMessage() {
            zim.sendPeerMessage(this.createMessage(), this.chatPickForm.toUserID)
                .then((res) => {
                    this.msgs.push(res.message);
                    this.textMsg = '';
                    this.scroll2bottom();
                })
                .catch(this.on_error);
        },
        sendRoomMessage() {
            zim.sendRoomMessage(this.createMessage(), this.chatPickForm.roomID)
                .then((res) => {
                    this.msgs.push(res.message);
                    this.textMsg = '';
                    this.scroll2bottom();
                })
                .catch(this.on_error);
        },
        scroll2bottom() {
            this.$nextTick().then(() => (this.$refs.msgs.scrollTop = 100000));
        },
    },
};

new Vue({
    el: '#app',
    mixins: [mixEvent, mixUitl],
    data() {
        return {
            loading: false,
            title: '',
            router: 0,
            loginForm: {
                userID: '',
                userName: '',
            },
            chatPickForm: {
                toUserID: '',
                roomID: '',
                roomName: '',
            },
            isRoomChat: false,
            textMsg: '',
            byteMsg: false,
            msgs: [],
            users: [],
            isShowUsers: false,
        };
    },
    mounted() {
        document.title = 'ZIM-Vue-' + ZIM.getVersion();
        window.addEventListener('beforeunload', this.saveViewData);

        this.initLog();
        this.initEvent(this.eventCallback);
        this.restoreViewData();
    },
    beforeDestroy() {
        window.removeEventListener('beforeunload', this.saveViewData);
    },
    methods: {
        login() {
            this.loading = true;
            zim.login(this.loginForm, generateToken(this.loginForm.userID))
                .then(() => {
                    this.loading = false;
                    this.setRouter(1);
                    this.title = this.loginForm.userID;
                })
                .catch((err) => {
                    this.loading = false;
                    this.on_error(err);
                });
        },
        logout() {
            this.setRouter(0);
            zim.logout();
        },
        createRoom() {
            if (!this.chatPickForm.roomName) return this.$message.warning('请输入 roomName');
            zim.createRoom(this.chatPickForm).then(this.joinRoomChat).catch(this.on_error);
        },
        joinChat() {
            if (this.isRoomChat) {
                this.joinRoom();
            } else {
                this.joinPeerChat();
            }
        },
        goback() {
            if (this.router == 1) {
                this.logout();
                return;
            }
            if (this.router != 2) return;

            if (this.isRoomChat) {
                this.leaveRoom();
            } else {
                this.setRouter(1);
                this.title = this.loginForm.userID;
            }
        },
        sendMsg() {
            if (this.isRoomChat) {
                this.sendRoomMessage();
            } else {
                this.sendPeerMessage();
            }
        },
        toggleUserList() {
            this.isShowUsers = !this.isShowUsers;
            var str = this.isShowUsers ? 'block' : 'none';
            this.$refs.domMask.style.display = str;
            this.$refs.domUsers.style.display = str;
        },
        refreshUserList(nextFlag) {
            this.loading = true;
            zim.queryRoomMember(this.chatPickForm.roomID, { count: 100, nextFlag })
                .then((res) => {
                    if (nextFlag) {
                        var users = [];
                        res.memberList.forEach((user) => {
                            var userID = user.userID;
                            var index = this.users.findIndex((item) => userID === item.userID);
                            if (index == -1) users.push(user);
                        });
                        if (users.length != 0) this.users = this.users.concat(users);
                    } else {
                        this.users = res.memberList;
                    }
                    this.loading = false;
                    res.nextFlag && this.refreshUserList(res.nextFlag);
                })
                .catch((err) => {
                    this.loading = false;
                    this.on_error(err);
                });
        },
    },
});
