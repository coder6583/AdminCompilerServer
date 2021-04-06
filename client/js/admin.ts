$(() => {
	// タブ切り替え
	$('.nav-content').on('click', function() {
		const bind = this.dataset.bind;

		$('.nav-content.selected').removeClass('selected');
		this.classList.add('selected');

		$('.content.show').removeClass('show');
		$(`.tab-${bind}`).addClass('show');
	});

	// コンソール
	$('#console').terminal(function(command) {
		console.log(command);
		if (command) {
			try {
				evalCommand(command, this);
			}catch (err) {
				this.error(err);
			}
		}
	}, {
		greetings: 'Welcome to Laze Admin Console',
	});

	// オーバーレイ
	$('.button-overlay').on('click', function() {
		const overlay = this.dataset.overlay;
		$(`.overlay-${overlay}`).addClass('show');
	});
	$('.overlay-window').on('click', function() {
		this.classList.remove('show');
	});
	$('.overlay-content').on('click', () => false);
	$('.overlay-close').on('click', function() {
		this.closest('.overlay-window')?.classList.remove('show');
	});

	let logs = [];
	for (let i = 0; i < 20; i++) {
		logs.push({
			category: 'info',
			value: 'ログ',
			timestmap: 1617702127000 + i * 200000
		});
	}
	parseServerLog(logs);

	parseBanIP([{
		ip: '192.168.10.9',
		memo: '',
		timestamp: 1617708382000
	}]);

	parseUsers([{
		avatar: 'https://yt3.ggpht.com/yti/ANoDKi5CBrHWvjnpuTFnhDQFsZni4l7RXVKgu8QsA6OF=s88-c-k-c0x00ffffff-no-rj-mo',
		id: 'cp20',
		username: 'cp20',
		email: 'expample@gmail.com',
	}]);
});

// @ts-ignore
const socket = io.connect('');
async function evalCommand(cmd :string, terminal :JQueryTerminal) {
	terminal.pause();

	socket.emit('command', {
		command: cmd
	});
	socket.on('result', (result: {success: boolean, result: string}) => {
		if (result.success) {
			terminal.echo(result.result).resume();
		}else {
			terminal.error(result.result).resume();
		}
	});
	const sleep = (msec :number) => new Promise(resolve => setTimeout(resolve, msec));
	await sleep(1000);
	terminal.echo('うぇい').resume();
}

function parseServerLog(logs :serverLog[]) {
	const resolveCategory = (category :string) => {
		const categorys = {
			info: '情報',
			warn: '警告',
			error: 'エラー'
		}
		// @ts-ignore
		return categorys[category] || '';
	};
	logs.forEach(log => {
		$('#server-log > tbody').append(`<tr><td class="${log.category}">${resolveCategory(log.category)}</td><td>${log.value}</td><td>${moment(new Date(log.timestmap)).format('YYYY/MM/DD HH:mm:ss')}</td></tr>`)
	});
}

function parseBanIP(banIPs :banIP[]) {
	banIPs.forEach(banIP => {
		$('#ban-ip > tbody').append(`<tr><td>${banIP.ip}</td><td>${banIP.memo}</td><td>${moment(new Date(banIP.timestamp)).format('YYYY/MM/DD HH:mm:ss')}</td><td><button class="btn btn-outline-secondary edit"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-secondary remove"><i class="bi bi-x"></i></button></td></tr>`)
	});
}

function parseUsers(users: userData[]) {
	users.forEach(user => {
		$('#users > tbody').append(`<tr><td><img src="${user.avatar}"></td><td>${user.id}</td><td>${user.username}</td><td>${user.email}</td><td><button class="btn btn-outline-secondary edit"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-secondary remove"><i class="bi bi-x"></i></button></td></tr>`)
	});	
}