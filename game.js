const httpPrefix = `${CONFIG.HTTP_PREFIX}`;
const wsPrefix = `${CONFIG.WS_PREFIX}`;

class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameScene'});
        this.clearStage();
    }

    clearStage() {
        this.status = 0; // 0未开始，1开始，2结束
        this.socket = null;

        this.cat1 = null;
        this.cat2 = null;
        this.initialCat1Y = 0;
        this.initialCat2Y = 0;
        this.initialCat1X = 0;
        this.initialCat2x = 0;
        this.endCatX = 0;
        this.endCatY = 0;

        this.isMoving = false;
        this.progress = 0;
        this.targetCat1Y = 0;
        this.targetCat2Y = 0;

        this.player = localStorage.getItem('maoUsername');
        if (this.player === null || this.player === undefined) {
            window.location.href = 'index.html';
            return;
        }
        this.playerCnt = 0;
        this.playerCntContainer = null;  // 存储用户点击次数容器
        this.canUpdateLeaderBoard = false;
        this.leaderboard = [];
        this.leaderboardContainer = null;  // 存储排行榜容器
        this.blessButton = null;  // 用来存储按钮对象
        this.canUpdateOnlineCnt = false;
        this.onlineCnt = 0;
        this.onlineCntContainer = null;
        this.textWish = null;
        this.xiCardContainer = null;

        this.yanhua = null;
        this.tieCat = null;

        this.one2TwoStage = false;
    }

    preload() {
        this.load.image('cat1_1', 'assets/images/mao11.png');
        this.load.image('cat1_2', 'assets/images/mao12.png');
        this.load.image('cat1_3', 'assets/images/mao13.png');
        this.load.image('cat1_4', 'assets/images/mao14.png');
        this.load.image('cat1_5', 'assets/images/mao15.png');
        this.load.image('cat1_6', 'assets/images/mao16.png');
        this.load.image('cat1_7', 'assets/images/mao17.png');
        this.load.image('cat1_8', 'assets/images/mao18.png');
        this.load.image('cat2_1', 'assets/images/mao21.png');
        this.load.image('cat2_2', 'assets/images/mao22.png');
        this.load.image('cat2_3', 'assets/images/mao23.png');
        this.load.image('cat2_4', 'assets/images/mao24.png');
        this.load.image('cat2_5', 'assets/images/mao25.png');
        this.load.image('cat2_6', 'assets/images/mao26.png');
        this.load.image('cat2_7', 'assets/images/mao27.png');
        this.load.image('cat2_8', 'assets/images/mao28.png');

        this.load.image('yanhua-1.png', 'assets/images/yanhua-1.png');
        this.load.image('yanhua-2.png', 'assets/images/yanhua-2.png');
        this.load.image('yanhua-3.png', 'assets/images/yanhua-3.png');
        this.load.image('yanhua-4.png', 'assets/images/yanhua-4.png');
        this.load.image('yanhua-5.png', 'assets/images/yanhua-5.png');
        this.load.image('yanhua-6.png', 'assets/images/yanhua-6.png');
        this.load.image('yanhua-7.png', 'assets/images/yanhua-7.png');
        this.load.image('yanhua-8.png', 'assets/images/yanhua-8.png');
        this.load.image('yanhua-9.png', 'assets/images/yanhua-9.png');
        this.load.image('yanhua-10.png', 'assets/images/yanhua-10.png');
        this.load.image('yanhua-11.png', 'assets/images/yanhua-11.png');
        this.load.image('yanhua-12.png', 'assets/images/yanhua-12.png');
        this.load.image('yanhua-13.png', 'assets/images/yanhua-13.png');
        this.load.image('yanhua-14.png', 'assets/images/yanhua-14.png');

        this.load.image('tie1.png', 'assets/images/tie1.png');
        this.load.image('tie2.png', 'assets/images/tie2.png');
        this.load.image('tie3.png', 'assets/images/tie3.png');
        this.load.image('tie4.png', 'assets/images/tie4.png');
        this.load.image('tie5.png', 'assets/images/tie5.png');
        this.load.image('tie6.png', 'assets/images/tie6.png');
        this.load.image('tie7.png', 'assets/images/tie7.png');
        this.load.image('tie8.png', 'assets/images/tie8.png');
        this.load.image('tie9.png', 'assets/images/tie9.png');
        this.load.image('tie10.png', 'assets/images/tie10.png');
        this.load.image('tie11.png', 'assets/images/tie11.png');
        this.load.image('tie12.png', 'assets/images/tie12.png');
        this.load.image('tie13.png', 'assets/images/tie13.png');
        this.load.image('tie14.png', 'assets/images/tie14.png');
        this.load.image('tie15.png', 'assets/images/tie15.png');
        this.load.image('tie16.png', 'assets/images/tie16.png');
        this.load.image('tie17.png', 'assets/images/tie17.png');
        this.load.image('tie18.png', 'assets/images/tie18.png');
        this.load.image('tie19.png', 'assets/images/tie19.png');
        this.load.image('tie20.png', 'assets/images/tie20.png');


    }

    create() {
        this.connectWebSocket();
        this.initStage();
    }

    initStage() {
        this.setLayout();
        this.resetCats();
        // 监听窗口尺寸变化
        this.scale.on('resize', () => {
            this.setLayout();
        });
        // 创建排行榜和点击次数显示
        this.createLeaderboard();
        this.createPlayerCnt();
        this.createBlessButton();
        this.createOnlineCnt();
        this.createXiCard();
        this.fetchInit();
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // 页面从隐藏切回可见时，执行后台拉取操作
                this.fetchInit();
            }
        });
    }

    resetCats() {
        if (this.cat1 !== null) {
            this.cat1.destroy();
        }
        if (this.cat2 !== null) {
            this.cat2.destroy();
        }
        this.anims.remove('runCat1')
        this.anims.remove('runCat2')
        this.anims.create({
            key: 'runCat1',
            frames: [{key: 'cat1_1'}, {key: 'cat1_2'}, {key: 'cat1_3'}, {key: 'cat1_4'}, {key: 'cat1_5'}, {key: 'cat1_6'}, {key: 'cat1_7'}, {key: 'cat1_8'}],
            frameRate: 16,
            repeat: -1 // 无限循环
        });
        this.anims.create({
            key: 'runCat2',
            frames: [{key: 'cat2_1'}, {key: 'cat2_2'}, {key: 'cat2_3'}, {key: 'cat2_4'}, {key: 'cat2_5'}, {key: 'cat2_6'}, {key: 'cat2_7'}, {key: 'cat2_8'}],
            frameRate: 16,
            repeat: -1 // 无限循环
        });
        this.cat1 = this.physics.add.sprite(this.initialCat1X, this.initialCat1Y, 'cat1_1');
        this.cat2 = this.physics.add.sprite(this.initialCat2x, this.initialCat2Y, 'cat2_1');
        this.targetCat1Y = this.initialCat1Y;
        this.targetCat2Y = this.initialCat2Y;
        this.cat1.setTexture('cat1_1');
        this.cat2.setTexture('cat2_1');
    }

    fetchInit() {
        fetch(httpPrefix + '/init/' + this.player)
            .then(response => response.json())
            .then(res => {
                let gameInfo = res['gameInfo'];
                let sceneInfo = res['sceneInfo'];
                this.inProgressCats(gameInfo.progress);
                this.leaderboard = gameInfo.player2Score;
                this.playerCnt = gameInfo.playerScore || 0;
                this.status = sceneInfo.status;
                this.onlineCnt = sceneInfo.onlineCnt;
                this.textWish.innerHTML = sceneInfo.xiCardWord;
                this.updateLeaderboard();
                this.updatePlayerCntText();
                this.updateOnlineCntText();
                this.resolvePointerEvent();
                if (this.status === 2) {
                    this.showXiCard();
                } else {
                    this.closeXiCard();
                }
                this.resolveEndAnimate();

            })
            .catch(error => console.error('获取数据失败:', error));
    }

    resolveEndAnimate() {
        if (this.status === 2) {
            this.cat1.destroy();
            this.cat2.destroy();
            if (this.tieCat === null) {
                this.tieCat = this.add.sprite(this.endCatX, this.endCatY, 'tie1');
                this.anims.create({
                    key: 'tie-play',
                    frames: [
                        {key: 'tie1.png'},
                        {key: 'tie2.png'},
                        {key: 'tie3.png'},
                        {key: 'tie4.png'},
                        {key: 'tie5.png'},
                        {key: 'tie6.png'},
                        {key: 'tie7.png'},
                        {key: 'tie8.png'},
                        {key: 'tie9.png'},
                        {key: 'tie10.png'},
                        {key: 'tie11.png'},
                        {key: 'tie12.png'},
                        {key: 'tie13.png'},
                        {key: 'tie14.png'},
                        {key: 'tie15.png'},
                        {key: 'tie16.png'},
                        {key: 'tie17.png'},
                        {key: 'tie18.png'},
                        {key: 'tie19.png'},
                        {key: 'tie20.png'}
                    ],
                    frameRate: 10,
                    repeat: -1 // 无限循环
                });
                this.tieCat.play('tie-play');
            }
            if (this.yanhua === null) {
                setTimeout(() => {
                    this.yanhua = this.add.sprite(this.endCatX, this.cat1.y - 150, 'yanhua-1');
                    this.anims.create({
                        key: 'yanhua-play',
                        frames: [
                            {key: 'yanhua-1.png'},
                            {key: 'yanhua-2.png'},
                            {key: 'yanhua-3.png'},
                            {key: 'yanhua-4.png'},
                            {key: 'yanhua-5.png'},
                            {key: 'yanhua-6.png'},
                            {key: 'yanhua-7.png'},
                            {key: 'yanhua-8.png'},
                            {key: 'yanhua-9.png'},
                            {key: 'yanhua-10.png'},
                            {key: 'yanhua-11.png'},
                            {key: 'yanhua-12.png'},
                            {key: 'yanhua-13.png'},
                            {key: 'yanhua-14.png'}
                        ],
                        frameRate: 7,
                        repeat: -1 // 无限循环
                    });
                    this.yanhua.play('yanhua-play'); // 播放动画
                }, 1000);
            }

        } else {
            if (this.tieCat !== null) {
                this.tieCat.destroy();
                this.tieCat = null;
            }
            if (this.yanhua !== null) {
                this.yanhua.destroy();
                this.yanhua = null;
            }
            this.anims.remove('tie-play')
            this.anims.remove('yanhua-play')
        }
    }

    update(time, delta) {
        if (this.canUpdateLeaderBoard) {
            this.updateLeaderboard();
            this.updatePlayerCntText();
            this.canUpdateLeaderBoard = false;
        }
        if (this.canUpdateOnlineCnt) {
            this.updateOnlineCntText();
            this.canUpdateOnlineCnt = false;
        }

        if (!this.isMoving && this.status == 1) {
            if (this.cat1.anims.isPlaying || this.cat2.anims.isPlaying) {
                this.cat1.anims.stop();
                this.cat2.anims.stop();
                this.cat1.setTexture('cat1_1');
                this.cat2.setTexture('cat2_1');
            }
            return;
        }

        if (this.status !== 1 && !this.one2TwoStage) {
            return;
        }

        if (!this.cat1.anims.isPlaying && !this.cat2.anims.isPlaying) {
            this.cat1.anims.play('runCat1', true);
            this.cat2.anims.play('runCat2', true);
        }

        let deltaCat1YDist = this.cat1.y - this.targetCat1Y;
        let deltaCat2YDist = this.targetCat2Y - this.cat2.y;
        if (deltaCat1YDist < 0.1) {
            this.cat1.y = this.targetCat1Y;
            this.cat2.y = this.targetCat2Y;
            this.isMoving = false;
            // 过渡状态结束
            if (this.one2TwoStage) {
                this.cat1.anims.stop();
                this.cat2.anims.stop();
                this.cat1.setTexture('cat1_1');
                this.cat2.setTexture('cat2_1');
                // 启动猫猫横向移动动画
                setTimeout(() => {
                    let runCat1 = this.anims.get('runCat1');
                    let runCat2 = this.anims.get('runCat2');
                    runCat1.frameRate = 4;
                    runCat2.frameRate = 4;
                    this.cat1.anims.play('runCat1', true);
                    this.cat2.anims.play('runCat2', true);
                    // 设置横向移动
                    // 设置横向移动
                    this.cat1.setVelocityX(5);
                    this.cat2.setVelocityX(-5);
                    // 碰撞检测
                    this.physics.add.collider(this.cat1, this.cat2, this.onCollide, null, this);
                }, 1000);
                this.one2TwoStage = false;
            }
        } else {
            this.cat1.y = this.cat1.y - deltaCat1YDist * 0.1;
            this.cat2.y = this.cat2.y + deltaCat2YDist * 0.1;
        }
    }

    updateLeaderboard() {
        let leaderboardTextContent = '';
        for (let i = 0; i < this.leaderboard.length; i++) {
            let s = this.leaderboard[i];
            let rank = i + 1;
            leaderboardTextContent += `${rank}. ${s}次<br>`;
        }

        this.leaderboardContainer.innerHTML = leaderboardTextContent;
    }

    updatePlayerCntText() {
        this.playerCntContainer.querySelector('div').innerText = `${this.player}: ${this.playerCnt} 次`;
    }

    updateOnlineCntText() {
        this.onlineCntContainer.querySelector('div').innerText = `在线人数: ${this.onlineCnt}`;
    }

    inProgressCats(progress) {
        if (this.status == 2) {
            this.resolveEndAnimate();
            return;
        }
        let total = this.initialCat1Y - this.initialCat2Y;
        let delta = total / 200 * progress;
        this.cat1.x = this.initialCat1X;
        this.cat2.x = this.initialCat2x;
        this.cat1.y = this.initialCat1Y - delta;
        this.cat2.y = this.initialCat2Y + delta;
    }

    moveCats(progress) {
        this.isMoving = true;
        this.canUpdateLeaderBoard = true;
        this.progress = progress;
        let totalYDist = this.initialCat1Y - this.initialCat2Y;
        let targetYDist = totalYDist / 200 * this.progress;
        this.targetCat1Y = this.initialCat1Y - targetYDist;
        this.targetCat2Y = this.initialCat2Y + targetYDist;
    }


    setLayout() {
        let screenWidth = this.scale.width;
        let screenHeight = this.scale.height;
        let marginBorder = 30;
        let centerX = screenWidth / 2;
        let bottomY = screenHeight / 3 * 2;
        this.initialCat1Y = bottomY - marginBorder;
        this.initialCat2Y = 100;
        this.initialCat1X = centerX - 50;
        this.initialCat2x = centerX + 50;
        this.targetCat1Y = this.initialCat1Y;
        this.targetCat2Y = this.initialCat2Y;
        this.endCatX = centerX;
        this.endCatY = (this.initialCat1Y - this.initialCat2Y) / 2 + this.initialCat2Y;
    }


    connectWebSocket() {
        this.socket = new WebSocket(wsPrefix + '/mao?player=' + this.player);

        this.socket.onopen = (event) => {
            console.log('WebSocket is open now.');
        };

        this.socket.onmessage = (event) => {
            let data = JSON.parse(event.data);
            if (data.type == 0) {
                let gameInfo = data;
                this.leaderboard = gameInfo.player2Score;
                this.playerCnt = gameInfo.playerScore || 0;
                this.moveCats(gameInfo.progress);
            } else if (data.type == 2) {
                let gameInfo = data;
                if (this.onlineCnt !== gameInfo.onlineCnt) {
                    this.onlineCnt = gameInfo.onlineCnt;
                    this.canUpdateOnlineCnt = true;
                }
            } else if (data.type == 1) {
                let sceneInfo = data;
                this.status = sceneInfo.status;
                this.resolvePointerEvent();
                switch (this.status) {
                    case 0:
                        // 各项元素归位
                        this.resetCats();
                        // 排行榜变动，刷新排行榜
                        this.leaderboard = {};
                        this.canUpdateLeaderBoard = true;
                        this.playerCnt = 0;
                        this.closeXiCard();
                        this.resolveEndAnimate();
                        break;
                    case 1:
                        // 开启点击事件
                        // 弹出游戏开始提示
                        // 示例：调用 showToast 函数显示提示
                        this.showToast('游戏开始', 500);
                        break;
                    case 2:
                        // 关闭点击事件
                        // 关闭刷新排行榜
                        // this.canUpdateLeaderBoard = false;
                        // 结束动画
                        // 设置喜卡文案，准备弹出
                        this.textWish.innerHTML = sceneInfo.xiCardWord;
                        // 设置过渡阶段，防止猫猫还没走到指定位置就被截停
                        // 由update函数触发后续动画
                        this.one2TwoStage = true;
                        break;
                }
            }
        };

        this.socket.onerror = (event) => {
            console.log('WebSocket Error: ' + error);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed.');
        };
    }

    onCollide() {
        // 销毁原猫猫
        this.cat1.destroy();
        this.cat2.destroy();
        // 处理结束动画
        this.resolveEndAnimate();
        // 弹出喜卡
        setTimeout(() => {
            this.showXiCard();
        }, 3000);


    }

    sendBoostMessage() {
        /*if (this.stompClient) {
            this.stompClient.send('/app/boost', {}, this.player);
        }*/
        if (!this.socket || !this.socket.readyState === WebSocket.OPEN) {
            this.connectWebSocket();
        }
        this.socket.send(this.player);
    }

    resolvePointerEvent() {
        if (this.status === 1) {
            this.blessButton.disabled = false;
        } else {
            this.blessButton.disabled = true;
        }
    }

    showToast(message, duration = 3000) {
        // 创建 Toast 元素
        const toast = document.createElement('div');
        toast.classList.add('toast', 'align-items-center', 'text-dark', 'bg-white', 'border', 'border-light', 'shadow-sm');
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        // Toast 内容
        const toastBody = document.createElement('div');
        toastBody.classList.add('d-flex', 'justify-content-center', 'toast-body');
        toastBody.innerText = message;

        // 将内容添加到 Toast 中
        toast.appendChild(toastBody);

        // 获取 Toast 容器并添加到页面
        const toastContainer = document.getElementById('toast-container');
        toastContainer.appendChild(toast);

        // 使用 Bootstrap 的 Toast 实例来控制动画
        const bsToast = new bootstrap.Toast(toast, {
            animation: true, autohide: true, delay: duration
        });

        // 启动 Toast
        bsToast.show();
    }

    createLeaderboard() {
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.classList.add('leaderboard-container');

        // 设置排行榜容器的样式
        leaderboardContainer.style.position = 'absolute';
        leaderboardContainer.style.bottom = '20px'; // 距离底部20px
        leaderboardContainer.style.left = '20px'; // 距离左侧20px
        leaderboardContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // 半透明白色背景
        leaderboardContainer.style.borderRadius = '12px'; // 圆角
        leaderboardContainer.style.padding = '15px';
        leaderboardContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'; // 柔和的阴影
        leaderboardContainer.style.fontSize = '14px';
        leaderboardContainer.style.color = '#333'; // 文本颜色
        leaderboardContainer.style.maxHeight = '300px';
        leaderboardContainer.style.overflowY = 'auto';
        leaderboardContainer.style.backgroundImage = 'linear-gradient(145deg, #f5f5f5, #e0e0e0)'; // 背景渐变效果
        leaderboardContainer.style.border = '1px solid rgba(200, 200, 200, 0.6)'; // 边框颜色

        // 创建排行榜的标题
        const leaderboardTitle = document.createElement('h4');
        leaderboardTitle.innerText = '';
        leaderboardTitle.style.textAlign = 'center'; // 标题居中
        leaderboardTitle.style.marginBottom = '10px';
        leaderboardTitle.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        leaderboardContainer.appendChild(leaderboardTitle);

        // 添加到页面中
        document.body.appendChild(leaderboardContainer);
        this.leaderboardContainer = leaderboardContainer;
    }

    // 创建用户点击次数显示
    createPlayerCnt() {
        const playerCntContainer = document.createElement('div');
        playerCntContainer.classList.add('player-cnt-container');
        playerCntContainer.style.position = 'absolute';
        playerCntContainer.style.top = '20px';
        playerCntContainer.style.right = '20px';
        playerCntContainer.style.backgroundColor = 'transparent';
        playerCntContainer.style.padding = '10px';
        playerCntContainer.style.fontSize = '16px';

        // 创建玩家点击次数显示
        const playerCntText = document.createElement('div');
        playerCntText.innerText = `${this.player}: 0 次`;
        playerCntContainer.appendChild(playerCntText);

        // 添加到页面中
        document.body.appendChild(playerCntContainer);
        this.playerCntContainer = playerCntContainer;
    }

    // 创建用户点击次数显示
    createOnlineCnt() {
        const onlineCntContainer = document.createElement('div');
        onlineCntContainer.classList.add('online-cnt-container');
        onlineCntContainer.style.position = 'absolute';
        onlineCntContainer.style.top = '20px';
        onlineCntContainer.style.left = '20px';
        onlineCntContainer.style.backgroundColor = 'transparent';
        onlineCntContainer.style.padding = '10px';
        onlineCntContainer.style.fontSize = '16px';

        // 创建玩家点击次数显示
        const onlineCntText = document.createElement('div');
        onlineCntText.innerText = `在线人数: 0`;
        onlineCntContainer.appendChild(onlineCntText);

        // 添加到页面中
        document.body.appendChild(onlineCntContainer);
        this.onlineCntContainer = onlineCntContainer;
    }

    createBlessButton() {
        // 创建一个 HTML 元素按钮并应用 Bootstrap 样式
        const button = document.createElement('button');
        button.innerHTML = '祝福+1';
        button.classList.add('btn', 'shadow', 'rounded'); // 使用 btn-danger 类使按钮为红色
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.fontSize = '18px';
        button.style.padding = '10px 20px';
        button.style.border = '1px solid #ccc';
        // 设置按钮背景颜色和文字颜色
        button.style.backgroundColor = '#b32d2d';  // 红色背景
        button.style.color = '#fff';  // 白色字体

        // 设置按钮宽度为屏幕的三分之一
        button.style.width = '40%';

        // 将按钮添加到页面中
        document.body.appendChild(button);

        // 给按钮添加点击事件
        button.addEventListener('click', event => {
            event.preventDefault(); // 阻止默认的事件行为
            this.sendBoostMessage();
            this.showPlusOneAnimation(button);
        });

        this.blessButton = button;
        this.blessButton.disabled = true;
    }

    showPlusOneAnimation(button) {
        // 创建一个显示 '+1' 的元素
        const plusOne = document.createElement('div');
        plusOne.innerHTML = '+1';
        plusOne.style.position = 'absolute';
        plusOne.style.bottom = '60px';  // 设置显示的位置，刚好在按钮的正上方

        // 获取按钮的宽度和右侧偏移量
        const buttonWidth = button.offsetWidth;
        const buttonRight = parseInt(button.style.right, 10);

        // 获取 '+1' 元素的宽度，这里假设 '+1' 的宽度是 40px
        const plusOneWidth = 40;

        // 计算 '+1' 元素的左侧偏移，使它水平居中在按钮内
        const leftPosition = (buttonWidth - plusOneWidth) / 2;

        // 根据按钮右侧偏移量和左侧偏移量计算 '+1' 元素的位置
        plusOne.style.right = `${buttonRight + leftPosition}px`;

        plusOne.style.fontSize = '24px';
        plusOne.style.color = '#b32d2d';  // 与按钮颜色一致
        plusOne.style.opacity = '1';
        plusOne.style.transition = 'all 1s ease-out'; // 动画时间

        // 将 '+1' 元素添加到页面中
        document.body.appendChild(plusOne);

        // 使用动画使 '+1' 元素向上移动并渐变消失
        setTimeout(() => {
            plusOne.style.bottom = '80px';  // 向上移动
            plusOne.style.opacity = '0';    // 渐变消失
        }, 10); // 等待元素添加后执行动画

        // 动画结束后，移除元素
        setTimeout(() => {
            plusOne.remove();
        }, 1000);  // 与动画时间一致，1秒后移除
    }

    createXiCard() {
        // 创建外层容器 div
        const xiCardContainer = document.createElement('div');
        xiCardContainer.id = 'xiCardContainer';
        xiCardContainer.classList.add('image-wrapper');

        // 创建 img 标签
        const img = document.createElement('img');
        img.id = 'card-image';
        img.src = './assets/images/xiCard.png';
        img.alt = '祝福图片';

        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.classList.add('close-btn');
        closeBtn.textContent = '×';
        closeBtn.onclick = () => this.closeXiCard(); // 关闭按钮点击时调用 closeImage 函数

        // 创建祝福文字 div
        const textGreeting = document.createElement('div');
        textGreeting.classList.add('text-greeting');
        textGreeting.textContent = '祝您';
        const textWish = document.createElement('div');

        textWish.classList.add('text-wish');
        textWish.innerHTML = this.xiCardWord;
        // 将所有元素添加到父容器中

        xiCardContainer.appendChild(img);
        xiCardContainer.appendChild(closeBtn);
        xiCardContainer.appendChild(textGreeting);
        xiCardContainer.appendChild(textWish);
        // 设置图片的宽度为视口宽度的60%
        // 设置图片的宽高
        const imgWidth = this.scale.width * 0.4;
        // 计算图片的高度，保持图片的宽高比例
        const imgHeight = imgWidth * (img.naturalHeight / img.naturalWidth);
        // 设置图片的宽高
        img.style.width = `${imgWidth}px`;
        img.style.height = `${imgHeight}px`;
        img.style.maxWidth = '400px';

        textGreeting.style.fontSize = `${Math.floor(imgWidth / 156 * 12)}px` // 156 14px
        textWish.style.fontSize = `${Math.floor(imgWidth / 156 * 14)}px` // 156 16px

        // 外围容器的宽度比图片多40px，高度与图片一致
        xiCardContainer.style.width = `${imgWidth + 40}px`;
        xiCardContainer.style.height = `${imgHeight}px`;
        // 将父容器添加到页面中（例如添加到 body 中）
        xiCardContainer.style.visibility = 'hidden';
        document.body.appendChild(xiCardContainer);

        this.xiCardContainer = xiCardContainer;
        this.textWish = textWish;
    }

    closeXiCard() {
        this.xiCardContainer.style.visibility = 'hidden';
        this.xiCardContainer.classList.remove('show');
    }

    showXiCard() {
        if (this.status == 2) {
            this.xiCardContainer.style.visibility = 'visible';
            // 使用 requestAnimationFrame 确保在浏览器下一帧渲染时应用动画
            requestAnimationFrame(() => {
                this.xiCardContainer.classList.add('show');
            });
        }
    }
}

// 配置 Phaser 游戏实例
const config = {
    type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, physics: {
        default: 'arcade', arcade: {
            gravity: {y: 0}, debug: false
        }
    }, scene: GameScene, scale: {
        mode: Phaser.Scale.RESIZE
    }, backgroundColor: '#e0e1e2'
};

const game = new Phaser.Game(config);
