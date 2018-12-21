function VideoController() {
    this.play = play;

    this.pause = pause;

    this.setTimes = setTimes;

    this.newData = newData;

    function play() {
        let video = $("video");
        for(let i = 0; i < video.length; i++)
            video[i].play();

    }

    function pause() {
        let video = $("video");
        for(let i = 0; i < video.length; i++)
            video[i].pause();
    }

    function setTimes(times) {
        let video = $("video");
        for(let i = 0; i < video.length && i < times.length; i++)
            video[i].currentTime = times[i];
    }

    function getTimes() {
        let video = $("video");
        let times = [];
        for(let i = 0; i < video.length; i++)
            times.push(video[i].currentTime);
        return times;
    }

    function newData(op) {
        let data = {
            op: op,
            times: []
        };
        if(op === 'setTime') {
            data.times = getTimes();
        }
        return data
    }
}

function Sync() {
    let peer = null;

    //运行状态
    //0 还未初始化
    //1 开始初始化成功
    let status = 0;

    //已经建立的链接
    let conns = [];

    /**
     * peer 被打开
     * @param conn
     */
    let peerOpenFunc = conn => {};
    /**
     * peer发生错误
     * @param err
     */
    let peerErrorFunc = err => {};
    /**
     * 有新的连接建立
     * @param conn
     */
    let peerConnFunc = conn => {};
    /**
     * 连接成功建立
     * @param conn
     */
    let connOpenFunc = conn => {};
    /**
     * 链接断开的时候
     * @param conn
     */
    let connCloseFunc = conn => {};

    /**
     * 数据到达的时候
     * @param conn
     * @param data
     */
    let connDataFunc = (conn, data) => {

    };
    /**
     * 连接人数发生变化的时候
     * @param conns
     */
    let connsChanged = (conns) => {};

    /**
     * 收到操作信号
     * @param data
     */
    let connOperation = (data) => {};

    this.setPeerOpenFunc = function (func) {
        peerOpenFunc = func;
    };

    this.setPeerErrorFunc = function(func){
        peerErrorFunc = func;
    };

    this.setPeerConnFunc = function (func) {
        peerConnFunc = func;
    };

    this.setConnOpenFunc = function (func) {
        connOpenFunc = func;
    };

    this.setConnCloseFunc = function (func) {
        connCloseFunc = func;
    };

    this.setConnDataFunc = function (func) {
        connDataFunc = func;
    };

    this.setConnsChanged = function (func) {
        connsChanged = func;
    };

    this.setConnOperation = function (func) {
        connOperation = func;
    };

    this.peerId = function () {
        return peer.id;
    };

    this.init = () => {
        peer = new Peer({
            debug: 3,
            secure: true,
            port: 443,
            config: {
                // free servers from https://gist.github.com/yetithefoot/7592580
                iceServers: [
                    { url: 'stun:stun.turnservers.com:3478' },
                    { url: 'stun:stun01.sipphone.com' },
                    { url: 'stun:stun.ekiga.net' },
                    { url: 'stun:stun.fwdnet.net' },
                    { url: 'stun:stun.ideasip.com' },
                    { url: 'stun:stun.iptel.org' },
                    { url: 'stun:stun.rixtelecom.se' },
                    { url: 'stun:stun.schlund.de' },
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun1.l.google.com:19302' },
                    { url: 'stun:stun2.l.google.com:19302' },
                    { url: 'stun:stun3.l.google.com:19302' },
                    { url: 'stun:stun4.l.google.com:19302' },
                    { url: 'stun:stunserver.org' },
                    { url: 'stun:stun.softjoys.com' },
                    { url: 'stun:stun.voiparound.com' },
                    { url: 'stun:stun.voipbuster.com' },
                    { url: 'stun:stun.voipstunt.com' },
                    { url: 'stun:stun.voxgratia.org' },
                    { url: 'stun:stun.xten.com' },
                    { url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' },
                    { url: 'turn:192.158.29.39:3478?transport=udp', credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=', username: '28224511:1379330808' },
                    { url: 'turn:192.158.29.39:3478?transport=tcp', credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=', username: '28224511:1379330808' }
                ]
            }
        });
        peer.on('error', peerErrorFunc);

        peer.on('open', id => {
            status = 1;
            connsChanged(peersGot());
            peerOpenFunc(id);
        });
        peer.on('connection', conn => {
            registerConn(conn);
            peerConnFunc(conn);
        });
    };

    this.connect = connect;

    this.sendData =  (data) => send({
        type: "DATA",
        msg: data
    });

    this.sendOperation = (data) => send({
        type: "OPERATION",
        msg: data
    });

    function send(content) {
        for(let i = 0; i < conns.length; i++) {
            let conn = conns[i];
            content.peer = peer.id;
            conn.send(content)
        }
    }

    function connect(peerId) {
        if(status === 1 && !connExist(peerId)) {
            let conn = peer.connect(peerId);
            registerConn(conn);
            return true;
        }
        return false;
    }
    //将连接注册进全局数组，并且注册事件
    function registerConn (conn) {
        for(let i = 0; i < conns.length; i++) {
            let connIn = conns[i];
            if(connIn.peer === conn.peer) {
                return;
            }
        }
        conn.on('open', () => {
            conn.send({
                type: "SYNC",
                msg: peersGot(conns)
            });
            conns.push(conn);
            connsChanged(peersGot());
        });

        conn.on('data', data => {
            if(data.type === 'DATA') {
                connDataFunc(conn, data);
            }else if(data.type === 'SYNC') {
                let peers = data.msg;
                for(let i = 0; i < peers.length; i++) {
                    connect(peers[i]);
                }
            }else if(data.type === 'OPERATION') {
                connOperation(data.msg);
            }
        });

        conn.on('close', () => {
            if(deleteConn(conn) !== false) {
                connsChanged(peersGot());
                connCloseFunc(conn);
            }
        });
    }


    function deleteConn(conn) {
        for(let i = 0; i < conns.length; i++) {
            let connIn = conns[i];
            if(connIn.peer === conn.peer) {
                conns.splice(i, 1);
                return conn;
            }
        }
        return false;
    }

    function connExist(peerId) {
        if(peerId === peer.id)
            return true;
        for(let i = 0; i < conns.length; i++) {
            if(conns[i].peer === peerId)
                return true;
        }
        return false;
    }

    function peersGot() {
        let peers = [];
        for(let i = 0; i < conns.length; i++) {
            peers.push(conns[i].peer);
        }
        return peers;
    }
}
