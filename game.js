const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false,
        },
    },
    scene: {
        preload,
        create,
        update,
        resize,
    },
    scale: {
        mode: Phaser.Scale.RESIZE, // 自适应窗口大小
        autoCenter: Phaser.Scale.CENTER_BOTH, // 居中显示
        width: '100%',
        height: '100%',
    },
};

const game = new Phaser.Game(config);

let cat1, cat2, boostButton;
let moveSpeed = 10; // 每次点击移动的步长
let catsClose = false; // 标记猫猫是否靠近
let initialCat1Y, initialCat2Y;
let isMoving = false;
let lastMoveTime = 0; // 记录最后一次移动的时间
const idleThreshold = 500; // 设置为0.5秒
let border;
let stompClient = null; // WebSocket 客户端
let player = "来云鹏";
let leaderboard = {}; // 用于存储实时排行榜
let leaderboardText;  // 用于显示排行榜的文本对象

function preload() {
    // 加载猫猫的4张奔跑图片
    this.load.image('cat1_1', 'assets/images/cat1_1.png');
    this.load.image('cat1_2', 'assets/images/cat1_2.png');
    this.load.image('cat1_3', 'assets/images/cat1_3.png');
    this.load.image('cat1_4', 'assets/images/cat1_4.png');

    this.load.image('cat2_1', 'assets/images/cat2_1.png');
    this.load.image('cat2_2', 'assets/images/cat2_2.png');
    this.load.image('cat2_3', 'assets/images/cat2_3.png');
    this.load.image('cat2_4', 'assets/images/cat2_4.png');
}

function create() {
    setLayout(this);

    // 创建 WebSocket 连接
    connectWebSocket();

    // 创建猫猫精灵
    cat1 = this.add.sprite(0, 0, 'cat1_1').setScale(1);
    cat2 = this.add.sprite(0, 0, 'cat2_1').setScale(1);

    // 创建排行榜显示
    leaderboardText = this.add.text(30, window.innerHeight - 200, '', {
        font: '20px Arial',
        fill: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
        padding: {x: 10, y: 10},
        wordWrap: {width: window.innerWidth / 3, useAdvancedWrap: true}
    }).setOrigin(0, 1);

    initStage(this)

    // 添加按钮点击事件
    this.input.on('pointerdown', () => {
        // 每次点击按钮时触发一次移动
        sendBoostMessage();
    });

    // 监听窗口尺寸变化
    this.scale.on('resize', (gameSize, baseSize, displaySize, resolution) => {
        setLayout(this);  // 重新设置布局
    });


    // 创建猫猫的奔跑动画
    this.anims.create({
        key: 'runCat1',
        frames: [
            {key: 'cat1_1'},
            {key: 'cat1_2'},
            {key: 'cat1_3'},
            {key: 'cat1_4'},
        ],
        frameRate: 8,
        repeat: -1, // 无限循环
    });

    this.anims.create({
        key: 'runCat2',
        frames: [
            {key: 'cat2_1'},
            {key: 'cat2_2'},
            {key: 'cat2_3'},
            {key: 'cat2_4'},
        ],
        frameRate: 8,
        repeat: -1, // 无限循环
    });

    // 初始化时猫猫保持静止
    cat1.setTexture('cat1_1');
    cat2.setTexture('cat2_1');
}

function initStage(scene) {
    // 获取屏幕的宽高
    let screenWidth = scene.scale.width;
    let screenHeight = scene.scale.height;
    // 设定横向和纵向的偏移量
    let marginBorder = 30; // 离边界固定值
    let centerX = screenWidth / 2; // 横向剧中
    let bottomY = screenHeight / 3 * 2; // 画布上2/3为游戏界面

    initialCat1Y = marginBorder;
    initialCat2Y = bottomY - marginBorder;

    // 更新猫猫1和猫猫2的位置
    fetch('http://localhost:8080/process')  // 获取游戏数据
        .then(response => response.json())
        .then(data => {
            // 等精灵创建后，获取它们的宽度并设置位置
            cat1.x = centerX;  // 离屏幕边缘100px
            cat2.x = centerX;  // 离屏幕边缘100px

            let total = initialCat2Y - initialCat1Y;
            let delta = total / 200 * data.progress

            // 更新猫猫的位置
            cat1.y = initialCat1Y + delta;
            cat2.y = initialCat2Y - delta;

            leaderboard = data.player2Score

        })
        .catch(error => {
            console.error('获取数据失败:', error);
        });
}

function update(time, delta) {
    // 更新排行榜显示
    updateLeaderboard();
    // 检查是否超过空闲阈值，若超过则回到第0帧并停止动画
    if (time - lastMoveTime > idleThreshold) {
        cat1.anims.stop();
        cat2.anims.stop();
        // 如果猫猫静止太久，切换回第0帧并停止动画
        cat1.setTexture('cat1_1'); // 停止动画，恢复静止状态
        cat2.setTexture('cat2_1'); // 停止动画，恢复静止状态
    }
}

function updateLeaderboard() {
    // 排序并更新排行榜
    const sortedLeaderboard = Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1]) // 按助力次数降序排序
        .slice(0, 5); // 只显示前5名

    let leaderboardTextContent = '排行榜：\n';
    sortedLeaderboard.forEach(([playerName, score], index) => {
        leaderboardTextContent += `${index + 1}. ${playerName}: ${score} 次\n`;
    });

    leaderboardText.setText(leaderboardTextContent);  // 更新显示
}


function moveCats(scene, progress) {
    isMoving = true;
    // 记录最后一次移动时间
    lastMoveTime = scene.time.now;
    let total = initialCat2Y - initialCat1Y;
    let delta = total / 200 * progress

    // 更新猫猫的位置
    cat1.y = initialCat1Y + delta;
    cat2.y = initialCat2Y - delta;

    if (!cat1.anims.isPlaying && !cat2.anims.isPlaying) {
        // 播放猫猫的奔跑动画，动画只播放一次
        cat1.anims.play('runCat1', true);
        cat2.anims.play('runCat2', true);
    }

    // 检查猫猫是否碰撞
    checkBounds();
}

function checkBounds() {
    // 获取猫猫的缩放比例
    let cat1ScaledWidth = cat1.width * cat1.scaleX;
    let cat1ScaledHeight = cat1.height * cat1.scaleY;

    let cat2ScaledWidth = cat2.width * cat2.scaleX;
    let cat2ScaledHeight = cat2.height * cat2.scaleY;

    // 计算猫猫的边缘位置（考虑缩放）
    let cat1Left = cat1.x - cat1ScaledWidth / 2;
    let cat1Right = cat1.x + cat1ScaledWidth / 2;
    let cat1Top = cat1.y - cat1ScaledHeight / 2;
    let cat1Bottom = cat1.y + cat1ScaledHeight / 2;

    let cat2Left = cat2.x - cat2ScaledWidth / 2;
    let cat2Right = cat2.x + cat2ScaledWidth / 2;
    let cat2Top = cat2.y - cat2ScaledHeight / 2;
    let cat2Bottom = cat2.y + cat2ScaledHeight / 2;

    // 检测猫猫的边缘是否接触
    if (cat1Right >= cat2Left && cat1Left <= cat2Right && cat1Bottom >= cat2Top && cat1Top <= cat2Bottom) {
        // 发生碰撞
        if (!catsClose) {
            catsClose = true;
            cat1.scene.input.off('pointerdown');
            cat2.scene.input.off('pointerdown');
            console.log('猫猫碰撞发生！');
        }
    }
}

// 空的 resize 方法
function resize() {
    // 更新画布大小
    this.scale.resize(window.innerWidth, window.innerHeight);

    // 调用 setLayout 更新布局
    setLayout(this);
}

// 更新布局函数
function setLayout(scene) {
}

// 创建 WebSocket 连接
function connectWebSocket() {
    const socket = new SockJS('http://localhost:8080/game'); // 连接到Spring Boot的WebSocket服务端
    stompClient = Stomp.over(socket);
    stompClient.connect({}, onConnect);
}

// WebSocket 连接成功后的回调
function onConnect() {
    console.log('WebSocket 连接成功');

    stompClient.subscribe('/topic/game', function (message) {
        let body = JSON.parse(message.body);
        leaderboard = body.player2Score
        // 监听后端发送的消息，触发猫猫移动
        moveCats(game.scene.scenes[0], body.progress);
    });
}

// 向后端发送 boost 消息
function sendBoostMessage() {
    if (stompClient) {
        stompClient.send('/app/boost', {}, player);
    }
}
