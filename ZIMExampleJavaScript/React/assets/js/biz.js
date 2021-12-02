const zim = ZIM.create(appConfig.appID);

document.title = 'ZIM-React-' + ZIM.getVersion();

ReactDOM.render(<ZIMApp />, document.getElementById('app'));

function ZIMApp() {
    // 常量
    const formLayout = {
        labelCol: { span: 8 },
        wrapperCol: { span: 8 },
    };
    const tailLayout = {
        wrapperCol: { offset: 8, span: 8 },
    };

    /**
     * State Hook
     */
    const [init] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [isShowUsers, setIsShowUsers] = React.useState(false);
    const [textMsg, setTextMsg] = React.useState('');
    const [byteMsg, setByteMsg] = React.useState(false);

    // need get state
    const [router, setRouter] = React.useState(0);
    const [msgs, setMsgs] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [isRoomChat, setIsRoomChat] = React.useState(false);

    const [loginForm] = antd.Form.useForm();
    const [chatPickForm] = antd.Form.useForm();

    /**
     * Ref Hook
     */
    const routerRef = React.useRef(router);
    const msgsRef = React.useRef(msgs);
    const usersRef = React.useRef(users);
    const isRoomChatRef = React.useRef(isRoomChat);
    const domMask = React.useRef(null);
    const domUsers = React.useRef(null);

    /**
     * Effect Hook
     */
    React.useEffect(() => {
        initEvent();
        restoreViewData();
        window.addEventListener('beforeunload', saveViewData);
        return () => {
            window.removeEventListener('beforeunload', saveViewData);
        };
    }, [init]);
    // get state value
    React.useEffect(() => {
        routerRef.current = router;
    }, [router]);
    React.useEffect(() => {
        msgsRef.current = msgs;
    }, [msgs]);
    React.useEffect(() => {
        usersRef.current = users;
    }, [users]);
    React.useEffect(() => {
        isRoomChatRef.current = isRoomChat;
    }, [isRoomChat]);

    // utils
    const initEvent = () => {
        zim.on('error', (...args) => on_error(...args.slice(1)));
        zim.on('connectionStateChanged', on_connectionStateChanged);
        zim.on('roomStateChanged', on_roomStateChanged);
        zim.on('tokenWillExpire', on_tokenWillExpire);
        zim.on('roomMemberJoined', on_roomMemberJoined);
        zim.on('roomMemberLeft', on_roomMemberLeft);
        zim.on('receivePeerMessage', on_receivePeerMessage);
        zim.on('receiveRoomMessage', on_receiveRoomMessage);
    };
    const saveViewData = () => {
        const config = {
            router: routerRef.current,
            loginForm: loginForm.getFieldValue(),
            chatPickForm: chatPickForm.getFieldValue(),
            isRoomChat: isRoomChatRef.current,
        };
        sessionStorage.setItem('zimviewdata', JSON.stringify(config));
    };
    const restoreViewData = () => {
        let config = sessionStorage.getItem('zimviewdata');
        if (config) {
            config = JSON.parse(config);

            setRouter(config.router);
            loginForm.setFieldsValue(config.loginForm);
            chatPickForm.setFieldsValue(config.chatPickForm);
            setIsRoomChat(config.isRoomChat);

            setTimeout(() => {
                if (routerRef.current == 0) return;

                setLoading(true);
                const userInfo = loginForm.getFieldValue();
                zim.login(userInfo, generateToken(userInfo.userID))
                    .then(() => {
                        setLoading(false);
                        if (routerRef.current == 2) {
                            if (isRoomChatRef.current) {
                                joinRoom();
                            } else {
                                joinPeerChat();
                            }
                        }
                    })
                    .catch((err) => {
                        setLoading(false);
                        on_error(err);
                    });
            }, 500);
        }
    };
    const logout = () => {
        setRouter(0);
        zim.logout();
    };
    const joinRoom = () => {
        zim.joinRoom(chatPickForm.getFieldValue().roomID).then(joinRoomChat).catch(on_error);
    };
    const leaveRoom = () => {
        zim.leaveRoom(chatPickForm.getFieldValue().roomID).catch(on_error);
        setRouter(1);
        setTitle(loginForm.getFieldValue().userID);
    };
    const joinPeerChat = () => {
        setRouter(2);
        setTitle(chatPickForm.getFieldValue().toUserID);
        setMsgs([]);
    };
    const joinRoomChat = (res) => {
        setRouter(2);
        setMsgs([]);
        setUsers([]);
        chatPickForm.setFieldsValue({ roomName: res.baseInfo.roomName });
        refreshUserList('');
        refreshUserCount();
    };
    const refreshUserCount = () => {
        const formFields = chatPickForm.getFieldValue();
        zim.queryRoomOnlineMemberCount(formFields.roomID)
            .then((res) => {
                setTitle(`${formFields.roomName}(${res.count})`);
            })
            .catch(on_error);
    };

    // zim event
    const on_error = (error) => {
        if (error && typeof error.code == 'number') {
            antd.message.destroy();
            antd.message.error(`${error.code}: ${error.message}`);
        }
        console.warn('===error===', error);
    };
    const on_connectionStateChanged = (zim, state, event, extendedData) => {
        console.log('===connectionStateChanged===', state, event, extendedData);
        const stateTips = ['已断开连接', '正在连接', '连接成功'];
        antd.message.destroy();
        antd.message.info(stateTips[state]);
        if (state == 0) {
            setRouter(0);
        }
    };
    const on_roomStateChanged = (zim, state, event, extendedData, roomID) => {
        console.log('===roomStateChanged===', roomID, state, event, extendedData);
        const stateTips = ['房间已断开连接', '房间正在连接', '房间连接成功'];
        antd.message.destroy();
        antd.message.info(stateTips[state]);
        // 被踢出房间、房间销毁
        if (roomID == chatPickForm.getFieldValue().roomID && state == 0) {
            setRouter(1);
            setTitle(loginForm.getFieldValue().userID);
        }
    };
    const on_tokenWillExpire = (zim, second) => {
        console.log('===tokenWillExpire===', second);
        antd.message.destroy();
        antd.message.warning(`token will expire ${second}`);
        zim.renewToken(generateToken(loginForm.getFieldValue().userID)).catch(on_error);
    };
    const on_roomMemberJoined = (zim, memberList, roomID) => {
        console.log('===roomMemberJoined===', memberList, roomID);
        if (roomID !== chatPickForm.getFieldValue().roomID) return;
        memberList.forEach((user) => {
            const userID = user.userID;
            const index = usersRef.current.findIndex((item) => userID === item.userID);
            if (index == -1) {
                setUsers(usersRef.current.concat([user]));
            }
        });
        refreshUserCount();
    };
    const on_roomMemberLeft = (zim, memberList, roomID) => {
        console.log('===roomMemberLeft===', memberList, roomID);
        if (roomID !== chatPickForm.getFieldValue().roomID) return;
        memberList.forEach((user) => {
            const userID = user.userID;
            const index = usersRef.current.findIndex((item) => userID === item.userID);
            if (index != -1) {
                usersRef.current.splice(index, 1);
                setUsers([...usersRef.current]);
            }
        });
        refreshUserCount();
    };
    const on_receivePeerMessage = (zim, messageList, fromUserID) => {
        console.log('===receivePeerMessage===', messageList, fromUserID);
        if (fromUserID == chatPickForm.getFieldValue().toUserID && routerRef.current == 2 && !isRoomChatRef.current) {
            setMsgs(msgsRef.current.concat(messageList));
        }
    };
    const on_receiveRoomMessage = (zim, messageList, fromRoomID) => {
        console.log('===receiveRoomMessage===', messageList, fromRoomID);
        if (fromRoomID == chatPickForm.getFieldValue().roomID && routerRef.current == 2 && isRoomChatRef.current) {
            setMsgs(msgsRef.current.concat(messageList));
        }
    };

    // UI event
    const goback = () => {
        if (router == 1) {
            logout();
            return;
        }
        if (router != 2) return;

        if (isRoomChat) {
            leaveRoom();
        } else {
            setRouter(1);
            setTitle(loginForm.getFieldValue().userID);
        }
    };
    const refreshUserList = (nextFlag) => {
        setLoading(true);
        nextFlag = typeof nextFlag == 'string' ? nextFlag : '';
        zim.queryRoomMember(chatPickForm.getFieldValue().roomID, { count: 100, nextFlag })
            .then((res) => {
                if (nextFlag) {
                    const _users = [];
                    res.memberList.forEach((user) => {
                        const userID = user.userID;
                        const index = users.findIndex((item) => userID === item.userID);
                        if (index == -1) _users.push(user);
                    });
                    if (_users.length != 0) setUsers(users.concat(_users));
                } else {
                    setUsers(res.memberList);
                }
                setLoading(false);
                res.nextFlag && refreshUserList(res.nextFlag);
            })
            .catch((err) => {
                setLoading(false);
                on_error(err);
            });
    };

    // UI
    const createLoginForm = () => {
        const login = () => {
            setLoading(true);
            const userInfo = loginForm.getFieldValue();
            zim.login(userInfo, generateToken(userInfo.userID))
                .then(() => {
                    setLoading(false);
                    setRouter(1);
                    setTitle(userInfo.userID);
                })
                .catch((err) => {
                    setLoading(false);
                    on_error(err);
                });
        };

        return (
            <React.Fragment>
                <div className="toolbar">
                    <span className="title"> ZIM Example </span>
                </div>
                <div className="vcenter">
                    <antd.Form {...formLayout} form={loginForm}>
                        <antd.Form.Item label="userID" name="userID">
                            <antd.Input />
                        </antd.Form.Item>
                        <antd.Form.Item label="userName" name="userName">
                            <antd.Input />
                        </antd.Form.Item>
                        <antd.Form.Item {...tailLayout} onClick={login}>
                            <antd.Button type="primary">login</antd.Button>
                        </antd.Form.Item>
                    </antd.Form>
                </div>
            </React.Fragment>
        );
    };
    const createChatPickForm = () => {
        const options = [
            { label: '1v1单聊', value: false },
            { label: '房间Room', value: true },
        ];

        const onChangeChanType = (e) => {
            setIsRoomChat(!!e.target.value);
        };

        const createRoom = () => {
            const room = chatPickForm.getFieldValue();
            if (!room.roomName) {
                antd.message.destroy();
                antd.message.warning('请输入 roomName');
                return;
            }
            zim.createRoom(room).then(joinRoomChat).catch(on_error);
        };
        const joinChat = () => {
            if (isRoomChat) {
                joinRoom();
            } else {
                joinPeerChat();
            }
        };

        return (
            <React.Fragment>
                <div className="toolbar">
                    <antd.Avatar src="assets/image/back.svg" onClick={goback}></antd.Avatar>
                    <span className="title"> {title} </span>
                    <antd.Avatar src="assets/image/back.svg" style={{ visibility: 'hidden' }}></antd.Avatar>
                </div>
                <div className="vcenter">
                    <antd.Form {...formLayout} form={chatPickForm}>
                        <antd.Form.Item {...tailLayout}>
                            <antd.Radio.Group
                                options={options}
                                onChange={onChangeChanType}
                                value={isRoomChat}
                                optionType="button"
                                buttonStyle="solid"
                            />
                        </antd.Form.Item>
                        {isRoomChat ? (
                            <React.Fragment>
                                <antd.Form.Item label="roomID" name="roomID">
                                    <antd.Input />
                                </antd.Form.Item>
                                <antd.Form.Item label="roomName" name="roomName">
                                    <antd.Input placeholder="加入房间不需要输入 roomName" />
                                </antd.Form.Item>
                            </React.Fragment>
                        ) : (
                            <antd.Form.Item label="userID" name="toUserID">
                                <antd.Input placeholder="请输入单聊目标 userID" />
                            </antd.Form.Item>
                        )}
                        <antd.Form.Item {...tailLayout}>
                            {isRoomChat && (
                                <antd.Button type="primary" onClick={createRoom}>
                                    创建房间
                                </antd.Button>
                            )}
                            <antd.Button type="primary" onClick={joinChat}>
                                {isRoomChat ? '加入房间' : '开始聊天'}
                            </antd.Button>
                        </antd.Form.Item>
                    </antd.Form>
                </div>
            </React.Fragment>
        );
    };
    const createChatWindow = () => {
        const self = loginForm.getFieldValue().userID;
        const formFields = chatPickForm.getFieldValue();

        const onChangeTextMsg = (e) => {
            setTextMsg(e.target.value);
        };
        const onChangeByteMsg = (e) => {
            setByteMsg(e.target.checked);
        };

        const createMessage = () => {
            const text = unescape(encodeURIComponent(textMsg));
            const message = byteMsg ? Uint8Array.from(Array.from(text).map((c) => c.charCodeAt(0))) : textMsg;
            return {
                priority: 2,
                type: byteMsg ? 2 : 1,
                message,
            };
        };
        const sendPeerMessage = () => {
            zim.sendPeerMessage(createMessage(), formFields.toUserID)
                .then((res) => {
                    setMsgs(msgs.concat([res.message]));
                    setTextMsg('');
                })
                .catch(on_error);
        };
        const sendRoomMessage = () => {
            zim.sendRoomMessage(createMessage(), formFields.roomID)
                .then((res) => {
                    setMsgs(msgs.concat([res.message]));
                    setTextMsg('');
                })
                .catch(on_error);
        };

        const sendMsg = () => {
            if (isRoomChat) {
                sendRoomMessage();
            } else {
                sendPeerMessage();
            }
        };

        const toggleUserList = () => {
            setIsShowUsers(!isShowUsers);
            const str = isShowUsers ? 'block' : 'none';
            domMask.current.style.display = str;
            domUsers.current.style.display = str;
        };

        const createMsgList = () => {
            return (
                <ul className="chat_msgs">
                    {msgs.map((item) => (
                        <li key={item.messageID} className={self === item.userID ? 'r' : 'l'}>
                            <img src={self === item.userID ? 'assets/image/chat_2.svg' : 'assets/image/chat_1.svg'} />
                            <div className="msg_wrap">
                                <span className="name">{item.userID}</span>
                                <span className="msg">{item.message}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            );
        };

        const createUserList = () => {
            return isRoomChat ? (
                <React.Fragment>
                    <div ref={domMask} className="chat_mask" onClick={toggleUserList}></div>
                    <div ref={domUsers} className="chat_users">
                        <div className="chat_title">
                            <span className="title"> user list </span>
                            <antd.Avatar src="assets/image/refresh.svg" onClick={refreshUserList}></antd.Avatar>
                        </div>
                        <ul className="scroll">
                            {users.map((item) => (
                                <li key={item.userID} className={self === item.userID ? 'item self' : 'item'}>
                                    {item.userID || item.userName}
                                </li>
                            ))}
                        </ul>
                    </div>
                </React.Fragment>
            ) : null;
        };

        return (
            <React.Fragment>
                <div className={isRoomChat ? 'toolbar roomchat_mobile' : 'toolbar'}>
                    <antd.Avatar src="assets/image/back.svg" onClick={goback}></antd.Avatar>
                    <span className="title"> {title} </span>
                    <antd.Avatar
                        src="assets/image/user.svg"
                        className={isRoomChat ? 'icon-user roomchaticon_mobile' : 'icon-user'}
                        onClick={toggleUserList}
                    ></antd.Avatar>
                </div>
                <div className={isRoomChat ? 'chat_window_wrap roomchat_mobile' : 'chat_window_wrap'}>
                    <div className="chat_window">
                        {createMsgList()}
                        <div className="chat_bottom">
                            <div className="form">
                                <antd.Input className="input" value={textMsg} onChange={onChangeTextMsg}></antd.Input>
                                <antd.Button className="btn" type="primary" onClick={sendMsg}>
                                    send
                                </antd.Button>
                            </div>
                            <antd.Checkbox value={byteMsg} onChange={onChangeByteMsg}>
                                byte
                            </antd.Checkbox>
                        </div>
                    </div>
                    {createUserList()}
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="content">
            <antd.Spin spinning={loading}></antd.Spin>
            {router == 0 && createLoginForm()}
            {router == 1 && createChatPickForm()}
            {router == 2 && createChatWindow()}
        </div>
    );
}
