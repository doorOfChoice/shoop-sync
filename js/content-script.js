(function () {
    /**
     * 返回可以拖动dom的事件函数
     * @param dom 被拖动的元素
     * @returns {Function}
     */
    function dragFunction(dom) {
        return function (event) {
            //获取鼠标按下的时候左侧偏移量和上侧偏移量
            let old_left = event.pageX;//左侧偏移量
            let old_top = event.pageY;//竖直偏移量

            //获取鼠标的位置
            let old_position_left = dom.position().left;
            let old_position_top = dom.position().top;

            //鼠标移动
            $(document).mousemove(function (event) {
                let new_left = event.pageX;//新的鼠标左侧偏移量
                let new_top = event.pageY;//新的鼠标竖直方向上的偏移量

                //计算发生改变的偏移量是多少
                let chang_x = new_left - old_left;
                let change_y = new_top - old_top;

                //计算出现在的位置是多少

                let new_position_left = old_position_left + chang_x;
                let new_position_top = old_position_top + change_y;
                //加上边界限制
                if (new_position_top < 0) {//当上边的偏移量小于0的时候，就是上边的临界点，就让新的位置为0
                    new_position_top = 0;
                }
                //如果向下的偏移量大于文档对象的高度减去自身的高度，就让它等于这个高度
                if (new_position_top > $(document).height() - dom.height()) {
                    new_position_top = $(document).height() - dom.height();
                }
                //右限制
                if (new_position_left > $(document).width() - dom.width()) {
                    new_position_left = $(document).width() - dom.width();
                }
                if (new_position_left < 0) {//左边的偏移量小于0的时候设置 左边的位置为0
                    new_position_left = 0;
                }

                dom.css({
                    left: new_position_left + 'px',
                    top: new_position_top + 'px'
                })
            });
            dom.mouseup(function () {
                $(document).off("mousemove");
            })
        }
    }

    /**
     * 同步两个dom的横纵坐标
     * @param dom1
     * @param dom2
     */
    function syncCoord(dom1, dom2) {
        dom1.offset(dom2.offset());
    }

    let body = $("body");

    //缩小后的按钮
    let smallMain = $("<div class='sync-small-main-panel'></div>").hide();
    smallMain.mousedown(dragFunction(smallMain));

    let menu = $("<div class='sync-main-menu'><b>SHOOP</b></div>");
    //主面板
    let main = $("<div class='sync-main-panel'></div>").append(menu).hide();
    menu.mousedown(dragFunction(main));

    smallMain.dblclick(function (event) {
        main.show(500);
        smallMain.hide(500);
        syncCoord(main, smallMain);
    });
    menu.dblclick(function (event) {
        main.hide(500);
        smallMain.show(500);
        syncCoord(smallMain, main);
    });

    //====================================================
    //|                  右边的栏目                       |
    //====================================================
    let rightPanel = $("<div class='sync-block'></div>");

    //好友面板
    let friends = $("<div class='sync-friends-panel'></div>");

    //连接面板
    let conn = $("<div class='sync-conn-panel'></div>");
    let connText = $("<input type='text' class='sync-conn-panel-text' placeholder='对方的peer id'/>");
    let connBtn = $("<button class='sync-conn-panel-btn green'>连接</button>");
    conn.append(connText).append(connBtn);

    rightPanel.append(friends).append(conn);

    //====================================================
    //|                  左边的栏目                       |
    //====================================================
    let leftPanel = $("<div class='sync-block'></div>");

    //聊天面板
    let chat = $("<div class='sync-chat-panel'></div>");

    //输入面板
    let input = $("<div class='sync-input-panel'></div>");
    let inputText = $("<input type='text' class='sync-input-panel-text' placeholder='输入发送的内容'/>");
    let inputBtn = $("<button class='sync-input-panel-btn blue'>发送</button>");
    let clearBtn = $("<button class='sync-input-panel-btn blue'>清空</button>");
    input.append(inputText).append(inputBtn).append(clearBtn);

    leftPanel.append(chat).append(input);

    //视频控制面板
    let video = $("<div class='sync-video-panel'></div>");
    let playBtn = $("<button class='red'>一起播放</button>");
    let pauseBtn = $("<button class='red'>一起暂停</button>");
    let syncBtn = $("<button class='red'>同步对方</button>");
    video.append(playBtn).append(pauseBtn).append(syncBtn);


    main.append(leftPanel).append(rightPanel).append(video);
    body.append(main);
    body.append(smallMain);


    //====================================================
    //|                  注册peer事件                     |
    //====================================================
    (function () {
        function buildP(text) {
            return $("<p>").text(text);
        }

        function buildTable(headers, data) {
            console.log("warnning");
            console.log(data);
            let table = $('<table>');
            let thead = $('<tr>');
            for(let i = 0; i < headers.length; i++) {
                thead.append($('<th>').text(headers[i]));
            }
            table.append(thead);
            for(let i = 0; i < data.length; i++) {
                let tbody = $('<tr>').append($('<td>').text(data[i]));
                table.append(tbody);

            }

            return table;
        }

        function generateText(peer, content) {
            let div = $("<div></div>");
            div.append(buildP(peer + " 说道:").css('color', 'blue')).append(buildP(content));
            return div;
        }

        function dateFormat(date) {
            return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + ' ' + date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();
        }

        function chromeAlert(title, msg) {
            chrome.runtime.sendMessage({
                title: title,
                message: msg
            }, rep => {});
        }

        let sync = new Sync();
        let vc = new VideoController();

        sync.setPeerOpenFunc(function (id) {
            chat.text("your name is: " + id);
        });

        sync.setPeerErrorFunc(function (err) {
            chromeAlert("连接失败", '失败原因: ' + err.type);
        });

        sync.setPeerConnFunc(function (conn) {
            chromeAlert('新的连接', conn.peer + '加入了你的房间');
        });

        sync.setConnDataFunc(function (conn, data) {
            chat.append(generateText(data.peer, data.msg));
        });

        sync.setConnOpenFunc(function (conn) {
            chromeAlert('连接状况', '和' + conn.peer + '连接成功');
        });

        sync.setConnCloseFunc(function (conn) {
            chromeAlert('连接状况', conn.peer + '退出了你的房间');
        });

        sync.setConnsChanged(function (conns) {
            console.log(conns);
            friends.html("");
            conns.unshift(sync.peerId());
            friends.append(buildTable(['在线用户(第一个是自己)'], conns));
        });

        sync.setConnOperation(function (opt) {
            if(opt.op === 'play') {
                vc.play();
            }else if(opt.op === 'pause') {
                vc.pause();
            }else if(opt.op === 'setTime') {
                vc.setTimes(opt.times);
            }
        });

        inputBtn.click(function (event) {
            sync.sendData(inputText.val());
            chat.append(generateText(sync.peerId(), inputText.val()));
        });

        connBtn.click(function (event) {
            sync.connect(connText.val());
        });

        playBtn.click(function (event) {
            vc.play();
            sync.sendOperation(vc.newData("play"));
        });

        pauseBtn.click(function (event) {
            vc.pause();
            sync.sendOperation(vc.newData("pause"));
        });

        syncBtn.click(function (event) {
            sync.sendOperation(vc.newData("setTime"));
        });

        clearBtn.click(function (event) {
           chat.html('');
        });

        sync.init();

        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
        {
            if(request.cmd === 'show') {
                if(main.is(':visible') || smallMain.is(':visible')) {
                    main.hide();
                    smallMain.hide();
                }else {
                    main.show();
                }
            }
        });
    })();

})();
