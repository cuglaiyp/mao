class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameScene'});
        this.clearStage();
    }

    clearStage() {
        this.textWish = null;
        this.xiCardContainer = null;
    }

    preload() {


    }

    create() {
        this.initStage();
    }

    initStage() {
        // 创建排行榜和点击次数显示
        this.createXiCard();
        setTimeout(() => {

            this.showXiCard();
        }, 500);
    }


    update(time, delta) {
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
        textWish.innerHTML = "顺顺顺顺遂无虞<br>皆得所愿";

        // 设置图片的宽高
        const imgHeight = this.scale.height * 0.2;
        // 计算图片的高度，保持图片的宽高比例
        const imgWidth = imgHeight * (img.naturalWidth / img.naturalHeight);
        // 设置图片的宽高
        img.style.width = `${imgWidth}px`;
        img.style.height = `${imgHeight}px`;

        textGreeting.style.setProperty("font-size", (imgWidth / 145 * 12) + "px", "important");
        textWish.style.setProperty("font-size", (imgWidth / 145 * 14) + "px", "important");
        // textGreeting.style.fontSize = `` // 156 14px
        // textWish.style.fontSize = `${imgWidth / 145 * 14}px` // 156 16px

        // 外围容器的宽度比图片多40px，高度与图片一致
        xiCardContainer.style.width = `${imgWidth + 40}px`;
        xiCardContainer.style.height = `${imgHeight}px`;
        // 将父容器添加到页面中（例如添加到 body 中）
        xiCardContainer.style.visibility = 'hidden';

        // 将所有元素添加到父容器中
        xiCardContainer.appendChild(img);
        xiCardContainer.appendChild(closeBtn);
        xiCardContainer.appendChild(textGreeting);
        xiCardContainer.appendChild(textWish);

        document.body.appendChild(xiCardContainer);

        this.xiCardContainer = xiCardContainer;
        this.textWish = textWish;
    }

    closeXiCard() {
        this.xiCardContainer.style.visibility = 'hidden';
        this.xiCardContainer.classList.remove('show');
    }


    showXiCard() {
        this.xiCardContainer.style.visibility = 'visible';
        // 使用 requestAnimationFrame 确保在浏览器下一帧渲染时应用动画
        requestAnimationFrame(() => {
            this.xiCardContainer.classList.add('show');
        });

    }


}

document.addEventListener('dblclick', function (event) {
    event.preventDefault();  // 禁用双击放大
}, {passive: false});


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
