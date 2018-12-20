function Sync(_props) {
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
     * @param operation
     */
    let connOperation = (data) => {};

    this.setPeerOpenFunc = function (func) {
        peerOpenFunc = func;
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
            debug: 3
        });
        peer.on('open', id => {
            status = 1;
            connsChanged(conns);
            peerOpenFunc(id);
        });
        peer.on('connection', registerConn);
    };

    this.connect = connect;

    this.sendData =  (data) => send(Sync.DATA + data);

    this.sendOperation = (data) => send(Sync.OPERATION + data);

    function send(content) {
        for(let i = 0; i < conns.length; i++) {
            let conn = conns[i];
            conn.send(content);
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

    function registerConn (conn) {
        for(let i = 0; i < conns.length; i++) {
            let connIn = conns[i];
            if(connIn.peer === conn.peer) {
                return;
            }
        }


        conn.on('open', () => {
            conn.send(combineConns(conns));
            conns.push(conn);
            connsChanged(conns);
        });

        conn.on('data', data => {
            if(data.indexOf(Sync.DATA) === 0) {
                connDataFunc(conn, data.substring(Sync.DATA.length));
            }else if(data.indexOf(Sync.CHAT_SYNC) === 0) {
                let peers = data.substring(Sync.CHAT_SYNC.length).split(",");
                for(let i = 0; i < peers.length; i++) {
                    connect(peers[i]);
                }
            }else if(data.indexOf(Sync.OPERATION) === 0) {
                operationRecieved(data.substring(Sync.OPERATION.length));
            }
        });

        conn.on('close', () => {
            if(deleteConn(conn) !== false) {
                connsChanged(conns);
                connCloseFunc(conn);
            }
        });
    }

    function combineConns(conns) {
        let peers = [];
        for(let i = 0; i < conns.length; i++) {
            peers.push(conns[i].peer);
        }
        return "CHAT-SYNC:" + peers.join(',');
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
}

//DATA: 普通数据
//CHAT-SYNC: 同步多个端到端
//OPERATION: 控制操作
Sync.DATA = 'DATA:';
Sync.CHAT_SYNC = 'CHAT-SYNC:';
Sync.OPERATION = 'OPERATION:';