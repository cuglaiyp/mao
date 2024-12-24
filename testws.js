function test() {
	for (let i = 0; i < 200; i++) {
		connectWebSocket(i);
	}

}

let totalConnect = 0;

function connectWebSocket(i) {
	this.socket = new WebSocket( 'ws://8.156.69.47:8080/mao?player=' + i);

	this.socket.onopen = (event) => {
		totalConnect += 1;
		console.log('WebSocket is open now. totalConnect =' + totalConnect);
	};
}

test()