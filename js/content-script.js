(function () {
    //判断sync界面是否初始化
    let hasInit = false;
    //初始化返回的节点
    let doms = null;

    /**
     * 初始化界面并且初始化网络
     * 最后返回main面板（用户操作），和smallMain（缩小菜单）
     * @returns {{main: (*|jQuery), smallMain: (*|jQuery)}}
     */
    function initDoms() {
        /**
         * 返回可以拖动dom的事件函数
         * @param dom 被拖动的元素
         * @returns {Function}
         */
        function dragFunction(dom) {
            return function (e) {
                //获取鼠标按下的时候左侧偏移量和上侧偏移量
                let old_left = e.pageX;//左侧偏移量
                let old_top = e.pageY;//竖直偏移量

                //获取鼠标的位置
                let old_position_left = dom.position().left;
                let old_position_top = dom.position().top;

                //鼠标移动
                $(document).mousemove(function (e) {
                    let new_left = e.pageX;//新的鼠标左侧偏移量
                    let new_top = e.pageY;//新的鼠标竖直方向上的偏移量

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

        function buildCt() {
            let parent = $("<div>").addClass('sync-panel-container');
            for(let i = 0; i < arguments.length; i++) {
                parent.append(arguments[i]);
            }
            return parent;
        }

        function buildP(text) {
            return $("<p>").text(text);
        }

        function buildTable(headers, data) {
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

        let body = $("body");

        //缩小后的按钮
        let smallMain = $("<div class='sync-small-main-panel'></div>").hide();
        smallMain.mousedown(dragFunction(smallMain));

        let menu = $("<div class='sync-main-menu'><b>Shoop</b></div>");
        //主面板
        let main = $("<div class='sync-main-panel'></div>").append(menu).hide();
        menu.mousedown(dragFunction(main));

        smallMain.dblclick(function (e) {
            main.show(500);
            smallMain.hide(500);
            syncCoord(main, smallMain);
        });
        menu.dblclick(function (e) {
            main.hide(500);
            smallMain.show(500);
            syncCoord(smallMain, main);
        });

        //====================================================
        //|                  右边的栏目                       |
        //====================================================
        let rightPanel = $("<div class='sync-panel-1'></div>");

        //好友面板
        let friends = $("<div class='sync-friends-panel'></div>");

        //连接面板
        let conn = $("<div class='sync-conn-panel'></div>");
        let connText = $("<input type='text' class='sync-conn-panel-text sync-panel-1' placeholder='对方的peer id'/>");
        let connBtn = $("<button class='sync-conn-panel-btn green sync-panel-1'>连接</button>");
        conn.append(buildCt(connText)).append(buildCt(connBtn));

        rightPanel.append(friends).append(conn);

        //====================================================
        //|                  左边的栏目                       |
        //====================================================
        let leftPanel = $("<div class='sync-panel-2'></div>");

        //聊天面板
        let chat = $("<div class='sync-chat-panel'></div>");
        let unreadHit = $('<p class="sync-chat-panel-hit">');

        //输入面板
        let input = $("<div class='sync-input-panel'></div>");
        let inputText = $("<input type='text' class='sync-input-panel-text sync-panel-1' placeholder='输入发送的内容'/>");
        let inputBtn = $("<button class='sync-input-panel-btn blue sync-panel-1'>发送</button>");
        let clearBtn = $("<button class='sync-input-panel-btn blue sync-panel-1'>清空</button>");
        input.append(buildCt(inputText)).append(buildCt(inputBtn, clearBtn));

        leftPanel.append(chat).append(input);

        //视频控制面板
        let video = $("<div class='sync-video-panel'></div>");
        let playBtn = $("<button class='red'>一起播放</button>");
        let pauseBtn = $("<button class='red'>一起暂停</button>");
        let syncBtn = $("<button class='red'>同步对方</button>");
        let shiftL = $("<button class='red'>退1秒</button>");
        let shiftR = $("<button class='red'>快1秒</button>");
        video.append(shiftL).append(playBtn).append(pauseBtn).append(syncBtn).append(shiftR);


        main.append(buildCt(leftPanel, rightPanel)).append(video);
        body.append(main);
        body.append(smallMain);


        /**====================================================
        //|                  注册peer事件                     |
        //|                 网络事件初始化                    |
        //====================================================**/
        function initNetworkAndEvent() {
            function print(content, color) {
                let div = $("<div></div>");
                div.append(buildP(content));
                if(color !== undefined) {
                    div.css('color', color);
                }
                chat.append(div);
            }
            function printText(content, peer) {
                let div = $("<div></div>");
                if(peer !== undefined) {
                    div.append(buildP(peer + " 说道:").css('color', 'blue'))
                }
                div.append(buildP(dateFormat(new Date()) + ">").css('color', 'blue'));
                div.append(buildP(content));
                chat.append(div);
            }

            function sendMessage(data) {
                if(data.trim() !== '') {
                    sync.sendData(data);
                    inputText.val('');
                    printText(data, sync.peerId());
                    chat[0].scrollTop = chat[0].scrollHeight;
                }
            }

            function printError(err) {
                print(err, 'red');
            }

            function printSuccess(suc) {
                print(suc, 'green');
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
                print('欢迎加入大家庭', 'purple');
                print('你的peerid是: ' + id, 'purple');
            });

            sync.setPeerErrorFunc(function (err) {
                printError('连接失败, 失败原因: ' + err.type);
            });

            sync.setPeerConnFunc(function (conn) {
                printSuccess('新的连接' + conn.peer + '加入了你的房间');
            });

            sync.setConnDataFunc(function (conn, data) {
                printText(data.msg, data.peer);
                //如果用户还没有滚动到底部，提示未读信息
                if(chat.scrollTop() < chat[0].scrollHeight - chat.height()) {
                    let toggleMsg = data.msg.length >= 10 ? data.msg.substring(0, 10) + '...' : data.msg;
                    unreadHit.text('未读消息: ' + toggleMsg);
                    unreadHit.click(function (e) {
                        chat[0].scrollTop = chat[0].scrollHeight;
                        unreadHit.remove();
                    });
                    chat.append(unreadHit);
                }else {
                    unreadHit.remove();
                }
                console.log('scrollTop: ' + main.scrollTop());
                console.log('scrollHeight: ' + main[0].scrollHeight);
                console.log('height: ' + main.height());
                console.log('scroll-' + (main[0].scrollHeight - main.height()));
            });

            sync.setConnOpenFunc(function (conn) {
                printSuccess('连接状况: 和' + conn.peer + '连接成功');
            });

            sync.setConnCloseFunc(function (conn) {
                printError('连接状况 ' + conn.peer + '退出了你的房间');
            });

            sync.setConnsChanged(function (conns) {
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

            inputBtn.click(function (e) {
               sendMessage(inputText.val());
            });

            inputText.keydown(function (e) {
                let keyNum = window.event ? e.keyCode :e.which;
                if(keyNum === 13) {
                    sendMessage(inputText.val());
                }
            });

            connBtn.click(function (e) {
                sync.connect(connText.val());
            });

            playBtn.click(function (e) {
                sync.sendOperation(vc.newData("play"));
                vc.play();
            });

            pauseBtn.click(function (e) {
                sync.sendOperation(vc.newData("pause"));
                vc.pause();
            });

            syncBtn.click(function (e) {
                sync.sendOperation(vc.newData("setTime"));
            });

            shiftL.click(function (e) {
                sync.sendOperation(vc.newData('setTime', -1));
                vc.shiftTime(-1);
            });

            shiftR.click(function (e) {
                sync.sendOperation(vc.newData('setTime', 1));
                vc.shiftTime(1);
            });

            clearBtn.click(function (e) {
                chat.html('');
            });
            //滚动到底部然后消除提示
            chat.scroll(function (e) {
                if(chat.scrollTop() >= chat[0].scrollHeight - chat.height() - 10) {
                    unreadHit.remove();
                }
            });

            sync.init();
        }

        initNetworkAndEvent();

        return  {
            main: main,
            smallMain: smallMain
        };
    }

    function initAll() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
            if(request.cmd === 'show') {
                clickFilterURL();
                clickReflection();
            }
        });
    }
    /**
     * 控制doms的可见性
     * 先显示main，再显示smallMain，来回交替
     */
    function toggleDomsVisibility() {
        if(doms.main.is(':visible') || doms.smallMain.is(':visible')) {
            doms.main.hide();
            doms.smallMain.hide();
        }else {
            doms.main.show();
        }
    }

    function clickReflection() {
        if(!hasInit) {
            hasInit = true;
            doms = initDoms();
            toggleDomsVisibility();
        }else if(doms != null){
            toggleDomsVisibility();
        }

    }

    function clickFilterURL() {
        let uri = window.location.href;
        if(/https?:\/\/www.imomoe.net\/player\/.+/.test(uri)) {
            window.location.href = $($('iframe')[1]).attr('src');
            return true;
        }else if(/https?:\/\/.*\.yn-dove.cn\/m?play\.php.+/.test(uri)) {
            window.location.href = $('iframe').attr('src');
            return true;
        }

        return false;
    }

    function autoFilterURL() {
        let uri = window.location.href;
        if(/https?:\/\/.*.aeidu\.cn\/index\.php.+/.test(uri)
            || /https?:\/\/jx\.aeidu\.cn\/.+/.test(uri)
            || /https?:\/\/vip\.jlsprh\.com\/.+/.test(uri)
            || /https?:\/\/jx\.618ge\.com.+/.test(uri)
        ) {
            window.location.href = $('iframe').attr('src');
            return true;
        }

        return false;
    }

    function autoOpenByURL() {
        let uri = window.location.href;

        if(/https?:\/\/api.jialingmm.net\/.+/.test(uri)
            || /https?:\/\/vip.94kuyun.com\/.+/.test(uri)
            || /http:\/\/api\.bbbbbb\.me\/.+/.test(uri)
            || /https?:\/\/bobo\.kukucdn\.com\/.+/.test(uri)
            || /https?:\/\/52dy\.hanju2017\.com\/.+/.test(uri)
        ) {
            initAll();
            clickReflection();
            return true;
        }
        return false;
    }


    //如果是特殊网页, 执行跳转
    if(autoFilterURL()) return;

    //如果是需要自动打开的网页，自动注册
    if(autoOpenByURL()) return;
    //正常网页，需要点击打开


    initAll();

})();
