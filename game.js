const urlPrefix = `${CONFIG.DOMAIN_PREFIX}`;

class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
		this.status = 0; // 0未开始，1开始，2结束
		this.stompClient = null;

		this.cat1 = null;
		this.cat2 = null;
		this.initialCat1Y = 0;
		this.initialCat2Y = 0;
		this.initialCat1X = 0;
		this.initialCat2x = 0;
		this.isMoving = false;
		this.progress = 0;
		this.targetCat1Y = 0;
		this.targetCat2Y = 0;

		this.player = localStorage.getItem('username');
		this.playerCnt = 0;
		this.playerCntContainer = null;  // 存储用户点击次数容器
		this.canUpdateLeaderBoard = false;
		this.leaderboard = {};
		this.leaderboardContainer = null;  // 存储排行榜容器
		this.blessButton = null;  // 用来存储按钮对象
		this.canUpdateOnlineCnt = false;
		this.onlineCnt = 0;
		this.onlineCntContainer = null;
	}

	preload() {
		this.load.image('cat1_1', 'assets/images/cat1_1.png');
		this.load.image('cat1_2', 'assets/images/cat1_2.png');
		this.load.image('cat1_3', 'assets/images/cat1_3.png');
		this.load.image('cat1_4', 'assets/images/cat1_4.png');
		this.load.image('cat2_1', 'assets/images/cat2_1.png');
		this.load.image('cat2_2', 'assets/images/cat2_2.png');
		this.load.image('cat2_3', 'assets/images/cat2_3.png');
		this.load.image('cat2_4', 'assets/images/cat2_4.png');
	}

	create() {
		this.setLayout();
		this.connectWebSocket();
		this.initStage();
		// 创建排行榜和点击次数显示
		this.createLeaderboard();
		this.createPlayerCnt();
		this.createBlessButton();
		this.createOnlineCnt();

		// 监听窗口尺寸变化
		this.scale.on('resize', () => {
			this.setLayout();
		});

		this.anims.create({
			key: 'runCat1',
			frames: [{ key: 'cat1_1' }, { key: 'cat1_2' }, { key: 'cat1_3' }, { key: 'cat1_4' }],
			frameRate: 8,
			repeat: -1 // 无限循环
		});

		this.anims.create({
			key: 'runCat2',
			frames: [{ key: 'cat2_1' }, { key: 'cat2_2' }, { key: 'cat2_3' }, { key: 'cat2_4' }],
			frameRate: 8,
			repeat: -1 // 无限循环
		});

		// 初始化时猫猫保持静止
		this.cat1.setTexture('cat1_1');
		this.cat2.setTexture('cat2_1');
	}

	initStage() {
		this.cat1 = this.add.sprite(-30, 0, 'cat1_1');
		this.cat2 = this.add.sprite(-30, 0, 'cat2_1');
		this.cat1.setScale(1);
		this.cat2.setScale(1);

		/*        // 创建排行榜显示
				this.leaderboardText = this.add.text(0, window.innerHeight, '', {
					font: '20px 宋体', fill: '#333333', backgroundColor: '#e0e1e2', padding: {x: 10, y: 10}, resolution: 2  // 提高渲染分辨率
				}).setOrigin(0, 1);

				this.playerCntText = this.add.text(this.scale.width, 0, '', {
					font: '20px 宋体', fill: '#333333', backgroundColor: '#e0e1e2', padding: {x: 10, y: 10}, resolution: 2  // 提高渲染分辨率
				}).setOrigin(1, 0);*/

		fetch(urlPrefix + '/init')
			.then(response => response.json())
			.then(res => {
				let gameInfo = res['gameInfo'];
				let sceneInfo = res['sceneInfo'];
				this.inProgressCats(gameInfo.progress);
				this.leaderboard = gameInfo.player2Score;
				this.playerCnt = this.leaderboard[this.player] || 0;
				this.status = sceneInfo.status;
				this.onlineCnt = sceneInfo.onlineCnt;
				this.updateLeaderboard();
				this.updatePlayerCntText();
				this.updateOnlineCntText();
				this.resolvePointerEvent();
			})
			.catch(error => console.error('获取数据失败:', error));
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

		if (!this.isMoving) {
			if (this.cat1.anims.isPlaying || this.cat2.anims.isPlaying) {
				this.cat1.anims.stop();
				this.cat2.anims.stop();
				this.cat1.setTexture('cat1_1');
				this.cat2.setTexture('cat2_1');
			}
			return;
		}

		if (!this.cat1.anims.isPlaying && !this.cat2.anims.isPlaying) {
			this.cat1.anims.play('runCat1', true);
			this.cat2.anims.play('runCat2', true);
		}

		let deltaCat1YDist = this.targetCat1Y - this.cat1.y;
		let deltaCat2YDist = this.cat2.y - this.targetCat2Y;
		if (deltaCat1YDist < 0.1) {
			this.cat1.y = this.targetCat1Y;
			this.cat2.y = this.targetCat2Y;
			this.isMoving = false;
		} else {
			this.cat1.y = this.cat1.y + deltaCat1YDist * 0.1;
			this.cat2.y = this.cat2.y - deltaCat2YDist * 0.1;
		}


		// if (time - this.lastMoveTime > this.idleThreshold) {
		//
		// }
	}

	updateLeaderboard() {
		const sortedLeaderboard = Object.entries(this.leaderboard)
			.sort((a, b) => b[1] - a[1]) // 按助力次数降序排序
			.slice(0, 10); // 只显示前10名

		let leaderboardTextContent = '';
		sortedLeaderboard.forEach(([playerName, score], index) => {
			leaderboardTextContent += `${index + 1}. ${playerName}: ${score} 次<br>`;
		});

		this.leaderboardContainer.innerHTML = leaderboardTextContent;
	}

	updatePlayerCntText() {
		this.playerCntContainer.querySelector('div').innerText = `${this.player}: ${this.playerCnt} 次`;
	}

	updateOnlineCntText() {
		this.onlineCntContainer.querySelector('div').innerText = `在线人数: ${this.onlineCnt}`;
	}

	inProgressCats(progress) {
		let total = this.initialCat2Y - this.initialCat1Y;
		let delta = total / 200 * progress;

		this.cat1.x = this.initialCat1X;
		this.cat2.x = this.initialCat2x;
		this.cat1.y = this.initialCat1Y + delta;
		this.cat2.y = this.initialCat2Y - delta;
	}

	moveCats(progress) {
		this.isMoving = true;
		this.canUpdateLeaderBoard = true;
		this.lastMoveTime = this.time.now;
		this.progress = progress;
		let totalYDist = this.initialCat2Y - this.initialCat1Y;
		let targetYDist = totalYDist / 200 * this.progress;
		this.targetCat1Y = this.initialCat1Y + targetYDist;
		this.targetCat2Y = this.initialCat2Y - targetYDist;
		if (!this.cat1.anims.isPlaying && !this.cat2.anims.isPlaying) {
			// this.cat1.anims.play('runCat1', true);
			// this.cat2.anims.play('runCat2', true);
		}
	}

	resetCats() {
		this.cat1.x = this.initialCat1X;
		this.cat2.x = this.initialCat2x;
		this.cat1.y = this.initialCat1Y;
		this.cat2.y = this.initialCat2Y;
		this.targetCat1Y = this.initialCat1Y;
		this.targetCat2Y = this.initialCat2Y;
	}

	setLayout() {
		let screenWidth = this.scale.width;
		let screenHeight = this.scale.height;
		let marginBorder = 30;
		let centerX = screenWidth / 2;
		let bottomY = screenHeight / 3 * 2;
		this.initialCat1Y = 100;
		this.initialCat2Y = bottomY - marginBorder;
		this.initialCat1X = centerX - 30;
		this.initialCat2x = centerX + 30;
		this.targetCat1Y = this.initialCat1Y;
		this.targetCat2Y = this.initialCat2Y;
	}

	connectWebSocket() {
		const socket = new SockJS(urlPrefix + '/cat');
		this.stompClient = Stomp.over(socket);
		this.stompClient.connect({}, this.onConnect.bind(this));
	}

	onConnect() {
		console.log('WebSocket 连接成功');

		this.stompClient.subscribe('/topic/game', (message) => {
			let gameInfo = JSON.parse(message.body);
			this.leaderboard = gameInfo.player2Score;
			this.playerCnt = gameInfo.player2Score[this.player] || 0;
			this.moveCats(gameInfo.progress);
		});

		this.stompClient.subscribe('/topic/ctrl', (message) => {
			let sceneInfo = JSON.parse(message.body);
			this.status = sceneInfo.status;
			if (this.onlineCnt !== sceneInfo.onlineCnt) {
				this.onlineCnt = sceneInfo.onlineCnt;
				this.canUpdateOnlineCnt = true;
			}
			this.resolvePointerEvent();
			switch (this.status) {
				case 0:
					// 各项元素归位
					this.resetCats();
					// 排行榜变动，刷新排行榜
					this.leaderboard = {};
					this.canUpdateLeaderBoard = true;
					this.playerCnt = 0;
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
					break;
			}
		});
	}

	sendBoostMessage() {
		if (this.stompClient) {
			this.stompClient.send('/app/boost', {}, this.player);
		}
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
		leaderboardTitle.innerText = '排行榜';
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
		playerCntContainer.style.backgroundColor = '#e0e1e2';
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
		onlineCntContainer.style.backgroundColor = '#e0e1e2';
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


}

// 配置 Phaser 游戏实例
const config = {
	type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, physics: {
		default: 'arcade', arcade: {
			gravity: { y: 0 }, debug: false
		}
	}, scene: GameScene, scale: {
		mode: Phaser.Scale.RESIZE
	}, backgroundColor: '#e0e1e2'
};

const game = new Phaser.Game(config);
