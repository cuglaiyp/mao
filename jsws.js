// 创建游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create
    }
};

// 预加载资源
function preload() {
    this.load.image('cardImage', './assets/images/fuCard.png'); // 替换为你自己的图片路径
}

// 创建场景
function create() {
    // 创建图片精灵
    const card = this.add.sprite(400, 300, 'cardImage');

    // 设置初始状态：透明，缩放Y轴为0，并且开始没有旋转
    card.setAlpha(0);
    card.setScale(0, 0);  // 沿Y轴缩放为0，避免图片立即显示
    card.setRotation(Phaser.Math.DegToRad(0));

    // 使用 tween 动画让图片沿 Y 轴逐步放大并进行3D旋转
    this.tweens.add({
        targets: card,                  // 动画目标是卡片
        alpha: 1,                        // 透明度从 0 到 1
        scaleX: 1,                       // 水平缩放保持 1
        scaleY: 1,                       // 垂直缩放从 0 到 1
        rotationY: Phaser.Math.DegToRad(360),  // 沿 Y轴 旋转360度
        duration: 3000,                  // 动画时长 3秒
        ease: 'Power2',                  // 缓动效果
        repeat: 0,                       // 不重复
        yoyo: false                      // 不回弹
    });
}

// 启动 Phaser 游戏
const game = new Phaser.Game(config);
