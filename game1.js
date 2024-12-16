// import SockJS from 'sockjs-client';
// import Stomp from 'stompjs';
//
// const config = {
//     type: Phaser.AUTO,
//     width: window.innerWidth,
//     height: window.innerHeight,
//     physics: {
//         default: 'arcade',
//         arcade: {
//             gravity: {y: 0},
//             debug: false,
//         },
//     },
//     scene: {
//         preload,
//         create,
//         update,
//         resize,
//     },
//     scale: {
//         mode: Phaser.Scale.RESIZE, // 自适应窗口大小
//         autoCenter: Phaser.Scale.CENTER_BOTH, // 居中显示
//         width: '100%',
//         height: '100%',
//     },
// };
//
// const game = new Phaser.Game(config);
//
// let cat1, cat2, boostButton;
// let moveSpeed = 10; // 每次点击移动的步长
// let catsClose = false; // 标记猫猫是否靠近
// let initialCat1X, initialCat2X;
// let isMoving = false;
// let lastMoveTime = 0; // 记录最后一次移动的时间
// const idleThreshold = 500; // 设置为2秒
// let border;
// let stompClient = null; // WebSocket 客户端
//
// function preload() {
//     // 加载猫猫的4张奔跑图片
//     this.load.image('cat1_1', 'assets/images/cat1_1.png');
//     this.load.image('cat1_2', 'assets/images/cat1_2.png');
//     this.load.image('cat1_3', 'assets/images/cat1_3.png');
//     this.load.image('cat1_4', 'assets/images/cat1_4.png');
//
//     this.load.image('cat2_1', 'assets/images/cat2_1.png');
//     this.load.image('cat2_2', 'assets/images/cat2_2.png');
//     this.load.image('cat2_3', 'assets/images/cat2_3.png');
//     this.load.image('cat2_4', 'assets/images/cat2_4.png');
//
//     // 加载按钮图片
//     this.load.image('button', 'assets/images/boost.png');
// }
//
// function create() {
//     setLayout(this);
//
//     // 创建 WebSocket 连接
//     connectWebSocket();
//
//     // 获取屏幕的宽高
//     let screenWidth = this.scale.width;
//     let screenHeight = this.scale.height;
//
//     // 设定横向和纵向的偏移量
//     let marginX = 100; // 横向距离边界的固定间距
//     let centerY = screenHeight / 2; // 纵向居中
//
//     // 创建猫猫精灵
//     cat1 = this.add.sprite(0, centerY, 'cat1_1').setScale(4);
//     cat2 = this.add.sprite(0, centerY, 'cat2_1').setScale(4);
//
//     // 等精灵创建后，获取它们的宽度并设置位置
//     cat1.x = marginX + cat1.width / 2;  // 离屏幕左边缘100px
//     cat1.y = centerY;  // 纵向居中
//
//     cat2.x = screenWidth - marginX - cat2.width / 2;  // 离屏幕右边缘100px
//     cat2.y = centerY;  // 纵向居中
//
//     // 创建按钮
//     boostButton = this.add.image(this.scale.width / 2, this.scale.height - 50, 'button')
//       .setInteractive()
//       .setScale(10);
//
//     // 添加按钮点击事件
//     boostButton.on('pointerdown', () => {
//         // 每次点击按钮时触发一次移动
//         sendBoostMessage();
//     });
//
//     // 监听窗口尺寸变化
//     this.scale.on('resize', (gameSize, baseSize, displaySize, resolution) => {
//         setLayout(this);  // 重新设置布局
//     });
//
//     // 创建边框
//     createBorder(this);
//
//     // 创建猫猫的奔跑动画
//     this.anims.create({
//         key: 'runCat1',
//         frames: [
//             {key: 'cat1_1'},
//             {key: 'cat1_2'},
//             {key: 'cat1_3'},
//             {key: 'cat1_4'},
//         ],
//         frameRate: 8,
//         repeat: -1, // 无限循环
//     });
//
//     this.anims.create({
//         key: 'runCat2',
//         frames: [
//             {key: 'cat2_1'},
//             {key: 'cat2_2'},
//             {key: 'cat2_3'},
//             {key: 'cat2_4'},
//         ],
//         frameRate: 8,
//         repeat: -1, // 无限循环
//     });
//
//     // 初始化时猫猫保持静止
//     cat1.setTexture('cat1_1');
//     cat2.setTexture('cat2_1');
// }
//
// // 创建边框
// function createBorder(scene) {
//     // 使用 Graphics 对象来绘制边框
//     border = scene.add.graphics();
//     border.lineStyle(10, 0x8B0000, 1);  // 设置边框的颜色和宽度
//     border.strokeRect(0, 0, scene.scale.width, scene.scale.height);  // 绘制矩形边框
// }
//
// function update(time, delta) {
//     // 检查是否超过空闲阈值，若超过则回到第0帧并停止动画
//     if (time - lastMoveTime > idleThreshold) {
//         cat1.anims.stop();
//         cat2.anims.stop();
//         // 如果猫猫静止太久，切换回第0帧并停止动画
//         cat1.setTexture('cat1_1'); // 停止动画，恢复静止状态
//         cat2.setTexture('cat2_1'); // 停止动画，恢复静止状态
//     }
// }
//
// function moveCats(scene) {
//     // 记录最后一次移动时间
//     lastMoveTime = scene.time.now;
//
//     // 只有在猫猫未到达目标时才允许移动
//     const cat1Move = moveSpeed;
//     const cat2Move = -moveSpeed;
//
//     // 更新猫猫的位置
//     cat1.x += cat1Move;
//     cat2.x += cat2Move;
//
//     if (!cat1.anims.isPlaying && !cat2.anims.isPlaying) {
//         // 播放猫猫的奔跑动画，动画只播放一次
//         cat1.anims.play('runCat1', true);
//         cat2.anims.play('runCat2', true);
//     }
//
//     // 检查猫猫是否碰撞
//     checkBounds();
// }
//
// function checkBounds() {
//     // 获取猫猫的缩放比例
//     let cat1ScaledWidth = cat1.width * cat1.scaleX;
//     let cat1ScaledHeight = cat1.height * cat1.scaleY;
//
//     let cat2ScaledWidth = cat2.width * cat2.scaleX;
//     let cat2ScaledHeight = cat2.height * cat2.scaleY;
//
//     // 计算猫猫的边缘位置（考虑缩放）
//     let cat1Left = cat1.x - cat1ScaledWidth / 2;
//     let cat1Right = cat1.x + cat1ScaledWidth / 2;
//     let cat1Top = cat1.y - cat1ScaledHeight / 2;
//     let cat1Bottom = cat1.y + cat1ScaledHeight / 2;
//
//     let cat2Left = cat2.x - cat2ScaledWidth / 2;
//     let cat2Right = cat2.x + cat2ScaledWidth / 2;
//     let cat2Top = cat2.y - cat2ScaledHeight / 2;
//     let cat2Bottom = cat2.y + cat2ScaledHeight / 2;
//
//     // 检测猫猫的边缘是否接触
//     if (cat1Right >= cat2Left && cat1Left <= cat2Right && cat1Bottom >= cat2Top && cat1Top <= cat2Bottom) {
//         // 发生碰撞
//         if (!catsClose) {
//             catsClose = true;
//             boostButton.setTint(0x808080); // 禁用按钮
//             boostButton.removeInteractive(); // 禁用按钮交互
//             console.log('猫猫碰撞发生！');
//         }
//     }
// }
//
// // 空的 resize 方法
// function resize() {
//     // 更新画布大小
//     this.scale.resize(window.innerWidth, window.innerHeight);
//
//     // 调用 setLayout 更新布局
//     setLayout(this);
// }
//
// // 更新布局函数
// function setLayout(scene) {
//     // 获取屏幕的宽高
//     const screenWidth = scene.scale.width;
//     const screenHeight = scene.scale.height;
//
//     // 设定横向和纵向的偏移量
//     const marginX = 100; // 横向距离边界的固定间距
//     const centerY = screenHeight / 2; // 纵向居中
//
//     // 更新猫猫1和猫猫2的位置
//     if (cat1) {
//         cat1.setPosition(marginX + cat1.width / 2, centerY);  // 离左边界100px
//     }
//
//     if (cat2) {
//         cat2.setPosition(screenWidth - marginX - cat2.width / 2, centerY);  // 离右边界100px
//     }
//
//     // 更新边框的位置和大小
//     if (border) {
//         // 清除旧的边框
//         border.clear();
//
//         // 绘制新的边框
//         border.lineStyle(10, 0x8B0000, 1);  // 重新设置颜色和宽度
//         border.strokeRect(0, 0, scene.scale.width, scene.scale.height);  // 绘制新的边框
//     }
//
//     // 更新按钮的位置
//     if (boostButton) {
//         boostButton.setPosition(screenWidth / 2, screenHeight - 50);  // 位于底部居中
//     }
// }
//
// // 创建 WebSocket 连接
// function connectWebSocket() {
//     const socket = new SockJS('http://localhost:8080/ws'); // 连接到Spring Boot的WebSocket服务端
//     stompClient = Stomp.over(socket);
//     stompClient.connect({}, onConnect);
// }
//
// // WebSocket 连接成功后的回调
// function onConnect() {
//     console.log('WebSocket 连接成功');
//     stompClient.subscribe('/topic/boost', function (message) {
//         // 监听后端发送的消息，触发猫猫移动
//         if (message.body === 'BOOST') {
//             moveCats(game.scene.scenes[0]);
//         }
//     });
// }
//
// // 向后端发送 boost 消息
// function sendBoostMessage() {
//     if (stompClient) {
//         stompClient.send('/app/boost', {}, JSON.stringify({}));
//     }
// }