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
        console.log(dom1.offset());
        console.log(dom2.offset());
        dom1.offset(dom2.offset());
    }

    let body = $("body");

    //缩小后的按钮
    let smallMain = $("<div class='sync-small-main-panel'></div>").hide();
    smallMain.mousedown(dragFunction(smallMain));

    //主面板
    let main = $("<div class='sync-main-panel'></div>");
    let menu = $("<div class='sync-main-menu'></div>");
    main.append(menu);
    menu.mousedown(dragFunction(main));

    smallMain.dblclick(function (event) {
        main.show(1000);
        smallMain.hide(1000);
        syncCoord(main, smallMain);
    });
    menu.dblclick(function (event) {
        main.hide(1000);
        smallMain.show(1000);
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
    let connBtn = $("<button class='sync-conn-panel-btn'>连接</button>");
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
    let inputBtn = $("<button class='sync-input-panel-btn'>发送</button>");
    input.append(inputText).append(inputBtn);

    leftPanel.append(chat).append(input);

    main.append(leftPanel).append(rightPanel);
    body.append(main);
    body.append(smallMain);

    //====================================================
    //|                  注册peer事件                     |
    //====================================================

    function generateText(content) {
        return $("<p></p>").text(new Date() + '\n' + content);
    }

    let sync = new Sync();

    sync.setPeerOpenFunc(function (id) {
        chat.text("your name is: " + id);
    });
    sync.setConnDataFunc(function (conn, data) {
        chat.append(generateText(data));
    });
    sync.setConnOpenFunc(function (conn) {
        console.log(conn);
    });
    sync.setConnsChanged(function (conns) {
        console.log(conns);
        friends.html("");
        friends.append($('<p></p>').text("Your ID: " + sync.peerId()));
        for(let i = 0; i < conns.length; i++) {
            let conn = conns[i];
            let dom = $("<p></p>").text(conn.peer);
            friends.append(dom);
        }
    });
    sync.setConnOperation(function (opt) {

    });
    inputBtn.click(function (event) {
        sync.sendData(inputText.val());
        chat.append(generateText(inputText.val()));
    });
    connBtn.click(function (event) {
        sync.connect(connText.val());
    });
    sync.init();
})();
