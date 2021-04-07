$(() => {
	// タブ切り替え
	$('.nav-content').on('click', function() {
		const bind = this.dataset.bind;

		$('.nav-content.selected').removeClass('selected');
		this.classList.add('selected');

		$('.content.show').removeClass('show');
		$(`.tab-${bind}`).addClass('show');

		// 高さ更新
		heightRefresh();
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

	// レイアウト
	const heightRefresh = () => {
		const tables = $('.list-tab > .table');
		for (let i = 0; i < tables.length; i++) {
			const table = tables[i];
			const tbody = table.getElementsByTagName('tbody')[0];
			const labelHeight = table.parentElement?.getElementsByClassName('label')[0].scrollHeight;
			if (labelHeight) {
				console.log(($(window).height() || 0) - labelHeight);
				
				table.style.maxHeight = `${($(window).height() || 0) - labelHeight}px`;
				tbody.style.maxHeight = `${($(window).height() || 0) - labelHeight - 40}px`;
			}
		}
	};
	$(window).on('resize', heightRefresh).trigger('resize');

	// submit無効化
	$('.disable-submit').on('submit', () => false);

	// banIP
	$('#add-ban-ip').on('submit', () => {
		const banIP = $('#ban-ip-box').val();
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

	// モニター
	let chartData = {
		CPU: 0,
		Memory: 0,
		NetworkUp: 0,
		NetworkDown: 0,
		Disk: 0,
	}
	const colors = {
		cpu: '17, 125, 187',
		memory: '139, 18, 174',
		network: '167, 79, 1',
		disk: '77, 166, 12'
	}
	const monitorDatasets = {
		cpu: [{
			label: 'CPU',
			borderColor: `rgb(${colors.cpu})`,
			backgroundColor: `rgba(${colors.cpu}, .1)`,
			data: []
		}],
		memory: [{
			label: 'Memory',
			borderColor: `rgb(${colors.memory})`,
			backgroundColor: `rgba(${colors.memory}, .1)`,
			data: []
		}],
		network: [{
			label: 'NetworkUp',
			borderColor: `rgb(${colors.network})`,
			backgroundColor: `rgba(${colors.network}, .1)`,
			data: []
		},{
			label: 'NetworkDown',
			borderColor: `rgb(${colors.network})`,
			backgroundColor: `rgba(${colors.network}, .1)`,
			borderDash: [5,5],
			data: []
		}],
		disk: [{
			label: 'Disk',
			borderColor: `rgb(${colors.disk})`,
			backgroundColor: `rgba(${colors.disk}, .1)`,
			data: []
		}],
	}
	const monitors = document.querySelectorAll('.chart-div > canvas');
	for (let i = 0; i < monitors.length; i++) {
		const monitor = <HTMLCanvasElement> monitors[i];
		const ctx = monitor.getContext('2d');
		const id = (monitor.id.match(/monitor\-(\w+)/) || [,])[1];
		if (ctx && id) {
			const chart = new Chart(ctx, {
				type: 'line',
				data: {
					// @ts-ignore
					datasets: monitorDatasets[id]
				},
				options: {
					scales: {
						xAxes: [{
							type: 'realtime',
							// @ts-ignore
							realtime: {
								duration: 30000,
								refresh: 500,
								delay: 500,
								frameRate: 30,
								onRefresh: (chart: Chart) => {
									// @ts-ignore
									const datasets = chart.data.datasets;
									if (datasets) {
										datasets.forEach(dataset => {
											// @ts-ignore
											dataset.data.push({
												x: Date.now(),
												// @ts-ignore
												// y: chartData[dataset.label],
												y: Math.floor(Math.random() * 100)
											});
										});
									}
								}
							},
							display: false
						}],
						yAxes: [{
							ticks: {
								suggestedMin: 0,
								suggestedMax: 100,
								stepSize: 20,
								padding: 10
							},
							gridLines: {
								display: true,
								color: 'rgb(230, 230, 230)',
								drawBorder: false,
								lineWidth: 1,
							}
						}]
					},
					legend: {
						display: false
					},
					tooltips: {
						enabled: false
					},
					hover: {
						mode: undefined
					},
					elements: {
						point: {
							radius: 0
						},
						line: {
							tension: 0,
							borderWidth: 1
						}
					},
					responsive: true,
					maintainAspectRatio: false,
				}
			});
		}
	}
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