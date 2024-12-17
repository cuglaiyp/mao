class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.cat1 = null;
        this.cat2 = null;
        this.moveSpeed = 10;
        this.isMoving = false;
        this.lastMoveTime = 0;
        this.idleThreshold = 500; // 设置为0.5秒
        this.stompClient = null;
        this.player = localStorage.getItem('username');
        this.leaderboard = {};
        this.leaderboardText = null;
        this.playerCntText = null;
        this.running = false;
        this.playerCnt = 0;
        this.initialCat1Y = 0;
        this.initialCat2Y = 0;
        this.initialCat1X = 0;
        this.initialCat2x = 0;
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

        this.input.keyboard.on('keydown', (event) => {
            switch (event.key) {
                case ' ':
                    fetch('http://8.156.69.47:8080/reset')  // 获取游戏数据
                        .then();
                    break;
                case 'Enter':
                    fetch('http://8.156.69.47:8080/start')  // 开始游戏
                        .then();
                    break;
            }
        });

        // 监听窗口尺寸变化
        this.scale.on('resize', () => {
            this.setLayout();
        });

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
        this.cat1.setTexture('cat1_1');
        this.cat2.setTexture('cat2_1');
    }

    initStage() {
        this.cat1 = this.add.sprite(-30, 0, 'cat1_1').setScale(1);
        this.cat2 = this.add.sprite(-30, 0, 'cat2_1').setScale(1);

        // 创建排行榜显示
        this.leaderboardText = this.add.text(0, window.innerHeight, '', {
            font: '20px Arial',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: { x: 10, y: 10 },
        }).setOrigin(0, 1);

        this.playerCntText = this.add.text(this.scale.width, 0, '', {
            font: '20px Arial',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: { x: 10, y: 10 },
        }).setOrigin(1, 0);

        fetch('http://8.156.69.47:8080/init')
            .then(response => response.json())
            .then(body => {
                this.inProgressCats(body.progress);
                this.leaderboard = body.player2Score;
                this.running = body.running;
                this.updateLeaderboard();
                this.resolvePointerEvent();
            })
            .catch(error => console.error('获取数据失败:', error));
    }

    update(time, delta) {
        this.updateLeaderboard();
        this.updatePlayerCntText();

        if (time - this.lastMoveTime > this.idleThreshold) {
            this.cat1.anims.stop();
            this.cat2.anims.stop();
            this.cat1.setTexture('cat1_1');
            this.cat2.setTexture('cat2_1');
        }
    }

    updateLeaderboard() {
        const sortedLeaderboard = Object.entries(this.leaderboard)
            .sort((a, b) => b[1] - a[1]) // 按助力次数降序排序
            .slice(0, 10); // 只显示前5名

        let leaderboardTextContent = '';
        sortedLeaderboard.forEach(([playerName, score], index) => {
            leaderboardTextContent += `${index + 1}. ${playerName}: ${score} 次\n`;
        });

        this.leaderboardText.setText(leaderboardTextContent);
    }

    updatePlayerCntText() {
        this.playerCntText.setText(`${this.player}: ${this.playerCnt}`);
    }

    inProgressCats(progress) {
        let total = this.initialCat2Y - this.initialCat1Y;
        let delta = total / 200 * progress;

        this.cat1x = this.initialCat1X;
        this.cat2x = this.initialCat2x;
        this.cat1y = this.initialCat1Y + delta;
        this.cat2y = this.initialCat2Y - delta;
        this.drawCats(this.cat1x, this.cat1y, this.cat2x, this.cat2y);
    }

    moveCats(progress) {
        this.isMoving = true;
        this.lastMoveTime = this.time.now;

        this.inProgressCats(progress);

        if (!this.cat1.anims.isPlaying && !this.cat2.anims.isPlaying) {
            this.cat1.anims.play('runCat1', true);
            this.cat2.anims.play('runCat2', true);
        }
    }

    resetCats() {
        this.cat1x = this.initialCat1X;
        this.cat2x = this.initialCat2x;
        this.cat1y = this.initialCat1Y;
        this.cat2y = this.initialCat2Y;
        this.drawCats(this.cat1x, this.cat1y, this.cat2x, this.cat2y);
    }

    drawCats(cat1x, cat1y, cat2x, cat2y) {
        this.cat1.x = cat1x;
        this.cat1.y = cat1y;
        this.cat2.x = cat2x;
        this.cat2.y = cat2y;
    }

    setLayout() {
        let screenWidth = this.scale.width;
        let screenHeight = this.scale.height;
        let marginBorder = 30;
        let centerX = screenWidth / 2;
        let bottomY = screenHeight / 3 * 2;
        this.initialCat1Y = marginBorder;
        this.initialCat2Y = bottomY - marginBorder;
        this.initialCat1X = centerX - 30;
        this.initialCat2x = centerX + 30;
    }

    connectWebSocket() {
        const socket = new SockJS('http://8.156.69.47:8080/cat');
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect() {
        console.log('WebSocket 连接成功');

        this.stompClient.subscribe('/topic/game', (message) => {
            let gameStage = JSON.parse(message.body);
            this.leaderboard = gameStage.player2Score;
            this.playerCnt = gameStage.player2Score[this.player];
            this.running = gameStage.running;
            this.moveCats(gameStage.progress);
        });

        this.stompClient.subscribe('/topic/ctrl', (message) => {
            let gameStage = JSON.parse(message.body);
            this.running = gameStage.running;
            this.resolvePointerEvent();
            this.leaderboard = gameStage.player2Score;
            this.playerCnt = gameStage.player2Score[this.player];
            this.inProgressCats(gameStage.progress);
        });
    }

    sendBoostMessage() {
        if (this.stompClient) {
            this.stompClient.send('/app/boost', {}, this.player);
        }
    }

    resolvePointerEvent() {
        if (this.running) {
            this.input.on('pointerdown', () => {
                this.sendBoostMessage();
            });
        } else {
            this.input.off('pointerdown');
        }
    }
}

// 配置 Phaser 游戏实例
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
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.RESIZE
    }
};

const game = new Phaser.Game(config);
