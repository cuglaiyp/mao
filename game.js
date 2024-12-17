const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update,
    resize
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // 自适应窗口大小
    autoCenter: Phaser.Scale.CENTER_BOTH, // 居中显示
    width: '100%',
    height: '100%'
  }
};

const game = new Phaser.Game(config);

let cat1, cat2, boostButton;
let moveSpeed = 10; // 每次点击移动的步长
let initialCat1Y, initialCat2Y, initialCat1X, initialCat2x;
let isMoving = false;
let lastMoveTime = 0; // 记录最后一次移动的时间
const idleThreshold = 500; // 设置为0.5秒
let stompClient = null; // WebSocket 客户端
let player = '来云鹏';
let leaderboard = {}; // 用于存储实时排行榜
let leaderboardText;  // 用于显示排行榜的文本对象
let running = false; // 标记场景是否开始运行

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

  initStage(this);

  this.input.keyboard.on('keydown', event => {
    switch (event.key) {
      case ' ':
        // 清空数据，重新开始，避免频繁启动后端
        fetch('http://localhost:8080/reset')  // 获取游戏数据
          .then(response => response.json())
          .then(body => {
            console.log('清空成功');
          });
        break;
      case 'Enter':
        fetch('http://localhost:8080/start')  // 开始游戏
          .then(response => response.json())
          .then(body => {
            console.log('清空成功');
          });
        break;
    }

  }, this);  // 使用 this 作为事件处理的上下文（指向当前场景）

  // 监听窗口尺寸变化
  this.scale.on('resize', (gameSize, baseSize, displaySize, resolution) => {
    setLayout(this);  // 重新设置布局
  });


  // 创建猫猫的奔跑动画
  this.anims.create({
    key: 'runCat1',
    frames: [
      { key: 'cat1_1' },
      { key: 'cat1_2' },
      { key: 'cat1_3' },
      { key: 'cat1_4' }
    ],
    frameRate: 8,
    repeat: -1 // 无限循环
  });

  this.anims.create({
    key: 'runCat2',
    frames: [
      { key: 'cat2_1' },
      { key: 'cat2_2' },
      { key: 'cat2_3' },
      { key: 'cat2_4' }
    ],
    frameRate: 8,
    repeat: -1 // 无限循环
  });

  // 初始化时猫猫保持静止
  cat1.setTexture('cat1_1');
  cat2.setTexture('cat2_1');
}

function initStage(scene) {
  // 创建猫猫精灵
  cat1 = scene.add.sprite(-30, 0, 'cat1_1').setScale(1);
  cat2 = scene.add.sprite(-30, 0, 'cat2_1').setScale(1);

  // 创建排行榜显示
  leaderboardText = scene.add.text(30, window.innerHeight - 200, '', {
    font: '20px Arial',
    fill: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
    padding: { x: 10, y: 10 },
    wordWrap: { width: window.innerWidth / 3, useAdvancedWrap: true }
  }).setOrigin(0, 1);

  // 更新猫猫1和猫猫2的位置
  fetch('http://localhost:8080/init')  // 获取游戏数据
    .then(response => response.json())
    .then(body => {
      // 等精灵创建后，获取它们的宽度并设置位置
      inProgressCats(body.progress);
      leaderboard = body.player2Score;
      running = body.running;
      updateLeaderboard();
      resolvePointerEvent();

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

function resetCats() {
  cat1x = initialCat1X;  // 离屏幕边缘100px
  cat2x = initialCat2x;  // 离屏幕边缘100px
  cat1y = initialCat1Y;
  cat2y = initialCat2Y;
  drawCats(cat1x, cat1y, cat2x, cat2y);
}

function inProgressCats(progress) {
  let total = initialCat2Y - initialCat1Y;
  let delta = total / 200 * progress;

  cat1x = initialCat1X;
  cat2x = initialCat2x;
  cat1y = initialCat1Y + delta;
  cat2y = initialCat2Y - delta;
  drawCats(cat1x, cat1y, cat2x, cat2y);
}

function moveCats(scene, progress) {
  isMoving = true;
  // 记录最后一次移动时间
  lastMoveTime = scene.time.now;

  inProgressCats(progress);

  if (!cat1.anims.isPlaying && !cat2.anims.isPlaying) {
    // 播放猫猫的奔跑动画，动画只播放一次
    cat1.anims.play('runCat1', true);
    cat2.anims.play('runCat2', true);
  }
  // 检查猫猫是否碰撞
  // checkBounds();
}

function checkBounds() {
  if (running) {
    running = false;
    resolvePointerEvent();
    console.log('猫猫碰撞发生！');
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
  // 获取屏幕的宽高，分割画布
  let screenWidth = scene.scale.width;
  let screenHeight = scene.scale.height;
  let marginBorder = 30; // 离边界固定值
  let centerX = screenWidth / 2; // 横向剧中
  let bottomY = screenHeight / 3 * 2; // 画布上2/3为游戏界面
  // 初始化猫猫位置边界
  initialCat1Y = marginBorder;
  initialCat2Y = bottomY - marginBorder;
  initialCat1X = centerX - 30;
  initialCat2x = centerX + 30;
}

// 创建 WebSocket 连接
function connectWebSocket() {
  const socket = new SockJS('http://localhost:8080/cat'); // 连接到Spring Boot的WebSocket服务端
  stompClient = Stomp.over(socket);
  stompClient.connect({}, onConnect);
}

// WebSocket 连接成功后的回调
function onConnect() {
  console.log('WebSocket 连接成功');

  stompClient.subscribe('/topic/game', function(message) {
    let body = JSON.parse(message.body);
    leaderboard = body.player2Score;
    // 监听后端发送的消息，触发猫猫移动
    moveCats(game.scene.scenes[0], body.progress);
  });

  stompClient.subscribe('/topic/ctrl', function(message) {
    let body = JSON.parse(message.body);
    if (!running && body.running) {
      running = body.running;
      // 添加按钮点击事件
      resolvePointerEvent();
    }
    leaderboard = body.player2Score;
    resetCats();
  });
}


function drawCats(cat1x, cat1y, cat2x, cat2y) {
  cat1.x = cat1x;
  cat1.y = cat1y;
  cat2.x = cat2x;
  cat2.y = cat2y;
}

// 向后端发送 boost 消息
function sendBoostMessage() {
  if (stompClient) {
    stompClient.send('/app/boost', {}, player);
  }
}

function resolvePointerEvent() {
  if (running) {
    game.scene.scenes[0].input.on('pointerdown', () => {
      // 每次点击按钮时触发一次移动
      sendBoostMessage();
    });
  } else {
    game.scene.scenes[0].input.off('pointerdown');
  }
}
