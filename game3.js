// 创建 Phaser 游戏配置
const config = {
	type: Phaser.AUTO,  // 自动选择 WebGL 或 Canvas
	width: 800,         // 游戏宽度
	height: 600,        // 游戏高度
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

// 创建 Phaser 游戏实例
const game = new Phaser.Game(config);

// 预加载资源
function preload() {
	// 加载精灵图片
	this.load.image('cat', 'assets/images/cat1_1.png');
}

// 创建场景
function create() {
	// 创建一个精灵，初始位置在 (100, 100)
	this.sprite = this.add.sprite(100, 100, 'cat');

	// 监听鼠标点击事件，点击时精灵将平滑移动到点击位置
	this.input.on('pointerdown', (pointer) => {
		const targetX = pointer.x;  // 获取点击位置的 X 坐标
		const targetY = pointer.y;  // 获取点击位置的 Y 坐标

		// 创建平滑移动的动画
		this.tweens.add({
			targets: this.sprite,      // 动画目标是精灵
			x: targetX,                // 目标 X 坐标
			y: targetY,                // 目标 Y 坐标
			duration: 1000,            // 动画持续时间 1000 毫秒
			ease: 'Sine.easeInOut'     // 缓动函数：Sine.easeInOut
		});
	});
}

// 每帧更新
function update() {
	// 这里可以更新场景中的其他内容，例如检测碰撞等
}
