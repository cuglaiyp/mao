function test() {
	for (let i = 0; i < 200; i++) {
		connectWebSocket();
	}

}

let totalConnect = 0;

function connectWebSocket() {
	// const socket = new SockJS('http://8.156.69.47:8080/cat');
	const socket = new SockJS('http://localhost:8080/cat');
	this.stompClient = Stomp.over(socket);
	this.stompClient.connect({}, this.onConnect.bind(this));
}

function onConnect() {
	totalConnect += 1;
	console.log('WebSocket 连接成功');

	this.stompClient.subscribe('/topic/game', (message) => {
		let gameStage = JSON.parse(message.body);
		console.log(gameStage);
	});

	this.stompClient.subscribe('/topic/ctrl', (message) => {
		let gameStage = JSON.parse(message.body);
		console.log(gameStage)
		/*this.status = gameStage.status;
		this.resolvePointerEvent();
		switch (this.status) {
			case 0:
				// 各项元素归位
				this.resetCats(gameStage.progress);
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
		}*/
	});
}

test()