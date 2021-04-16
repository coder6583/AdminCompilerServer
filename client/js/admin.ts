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
	// タブのハンバーガー化
	$('#nav-show').on('click', function() {
		$('.navigation').removeClass('hide');
		$('.navigation').addClass('show');
	});
	$('#nav-hide').on('click', function() {
		$('.navigation').removeClass('show');
		$('.navigation').addClass('hide');
	});
	// レスポンシブ
	if (matchMedia('(max-width: 480px)').matches) {
		$('.navigation').addClass('hide');
	}else {
		$('.navigation').addClass('show');
	}

	// コンソール
	$('#console').terminal(function(command) {
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

	// フィルター
	let filterTimer: NodeJS.Timeout | undefined;
	let filter :{keyword: string[], category: string[], server: string[], before: number | undefined, after: number | undefined} = {
		keyword: [],
		category: [],
		server: [],
		before: undefined,
		after: undefined
	};
	$('#log-filter-box').on('input', () => {		
		if (filterTimer) clearTimeout(filterTimer);
		filterTimer = setTimeout(() => {
			const filterString = $('#log-filter-box').val()?.toString() || '';
			filter = (() => {
				let result :{keyword: string[], category: string[], server: string[], before: number | undefined, after: number | undefined} = {
					keyword: [],
					category: [],
					server: [],
					before: undefined,
					after: undefined
				}
				const selectors = filterString.match(/"(\\["]|[^"])*"|[^\s]+/g)?.map(selector => selector.replace(/^"(.*)"$/, '$1'));
				if (!selectors) return result;
				selectors.forEach(selector => {
					const unEscape = (str :string) => str.replace('\\#', '#').replace('\\@', '@').replace('\\~', '~').replace('\\*', '*').replace('\\\\', '\\');
					const getKey = (obj :{[key: string]: string}, keyword :string) => {
						return Object.keys(obj).reduce( (r :any, key) => {
							return obj[key] === keyword ? key : r 
						}, null);
					}
					const getLastDate = (date :string) => {
						if (date.match(/^\d\d\d\d$/)) {
							// 年
							return moment(date).add(1, 'year');
						}else if (date.match(/^\d\d\d\d\-\d\d$/)) {
							// 月
							return moment(date).add(1, 'month');
						}else if (date.match(/^\d\d\d\d\-\d\d\-\d\d$/)) {
							// 日
							return moment(date).add(1, 'day');
						}else if (date.match(/^\d\d\d\d\-\d\d\-\d\dT\d\d$/)) {
							// 時
							return moment(date).add(1, 'hour');
						}else if (date.match(/^\d\d\d\d\-\d\d\-\d\dT\d\d:\d\d$/)) {
							// 分
							return moment(date).add(1, 'minute');
						}else if (date.match(/^\d\d\d\d\-\d\d\-\d\dT\d\d:\d\d:\d\d$/)) {
							// 秒
							return moment(date).add(1, 'second');
						}
					};

					if (selector.startsWith('*')) {
						const server = (() => {
							const server = unEscape(selector.substr(1));
							return getKey(servers, server) || server;
						})();
						result.server.push(server);
					}else if (selector.startsWith('#')) {
						const category = (() => {
							const category = unEscape(selector.substr(1));
							return getKey(categorys, category) || category;
						})();
						result.category.push(category);
					}else if (selector.startsWith('@')) {
						const {before, after} = (() => {
							const during = unescape(selector.substr(1));
							const before = moment(during).unix() * 1000;
							const after = (getLastDate(during)?.unix() || 0) * 1000;
							return {before, after};
						})();
						result.before = before;
						result.after = after;
					}else if (selector.match(/(.+[^\\])~(.+)/)) {
						const before = (selector.match(/(.+[^\\])~(.+)/) || [,])[1] || '';
						const after = (selector.match(/(.+[^\\])~(.+)/) || [,,])[2] || '';
						result.before = moment(before).unix() * 1000;
						result.after = (getLastDate(after)?.unix() || 0) * 1000;
					}else {
						result.keyword.push(unEscape(selector));
					}
				});
				return result;
			})();
			getLogs();

			// 読み込み中
			const labelHeight = $('#server-log').parent().find('.label').height() || 0;
			const controlHeight = $('#server-log').parent().find('.control').height() || 0;
			const loading = $('#server-log ~ .loading-div');
			loading.css({
				'top': `${labelHeight + 40}px`,
				'height': `${($(window).height() || 0) - labelHeight - controlHeight - 40}px`
			});
			loading.addClass('show');
		}, 200);
	});
	const linesPerPage = 50;
	const getLogs = () => {
		const currentLogs = $('#server-log tbody').children().length;
		socket.emit('logGet', {
			from: currentLogs + 1,
			until: currentLogs + linesPerPage,
			filter: filter,
		});
	};
	getLogs();

	socket.on('logReturn', (log :{max: number, value: serverLog[]}) => {
		console.log(log);
		parseServerLog(log.value);
		$('#server-log ~ .loading-div').removeClass('show');
	});

	// 無限スクロール
	$('#server-log tbody').on('scroll', function() {
		if (this.scrollTop + this.clientHeight >= this.scrollHeight) {
			getLogs();
		}
	});

	// レイアウト
	const heightRefresh = () => {
		const tables = $('.list-tab > .table');
		for (let i = 0; i < tables.length; i++) {
			const table = tables[i];
			const tbody = table.getElementsByTagName('tbody')[0];
			const labelHeight = table.parentElement?.getElementsByClassName('label')[0].scrollHeight || 0;
			const controlHeight = table.parentElement?.getElementsByClassName('control')[0]?.scrollHeight || 0;
			table.style.maxHeight = `${($(window).height() || 0) - labelHeight - controlHeight}px`;
			tbody.style.maxHeight = `${($(window).height() || 0) - labelHeight - controlHeight - 40}px`;
		}

		
	};
	$(window).on('resize', heightRefresh).trigger('resize');
	document.querySelectorAll('.label').forEach(label => {
		new ResizeObserver(heightRefresh).observe(label);
	});

	// submit無効化
	$('.disable-submit').on('submit', () => false);

	// banIP
	$('#add-ban-ip').on('submit', () => {
		const banIP = $('#ban-ip-box').val();
	});

	// モニター
	let chartData = {
		CPU: 0,
		Memory: 0,
		NetworkUp: 0,
		NetworkDown: 0,
		DiskRead: 0,
		DiskWrite: 0,
	}
	const colors = {
		cpu: '17, 125, 187',
		memory: '139, 18, 174',
		network: '167, 79, 1',
		disk: '77, 166, 12'
	}
	const monitorDatasets: {[key :string]: any} = {
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
			label: 'DiskRead',
			borderColor: `rgb(${colors.disk})`,
			backgroundColor: `rgba(${colors.disk}, .1)`,
			data: []
		},{
			label: 'DiskWrite',
			borderColor: `rgb(${colors.disk})`,
			backgroundColor: `rgba(${colors.disk}, .1)`,
			borderDash: [5,5],
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
								refresh: 1000,
								delay: 1000,
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
												y: chartData[dataset.label],
											});
										});
									}
								}
							},
							display: false
						}],
						yAxes: [{
							ticks: {
								suggestedMin: ['network', 'disk'].includes(id) ? undefined : 0,
								suggestedMax: ['network', 'disk'].includes(id) ? undefined : 100,
								stepSize: ['network', 'disk'].includes(id) ? undefined : 20,
								maxTicksLimit: ['network', 'disk'].includes(id) ? 5 : undefined,
								beginAtZero: true,
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
					maintainAspectRatio: false
				}
			});
		}
	}
	const SI = (number :number) => {
		if (number < 1000) {
			return number.toFixed(1);
		}else if (number < 1000 ** 2) {
			return `${(number / 1000).toFixed(1)}K`;
		}else if (number < 1000 ** 3) {
			return `${(number / 1000 ** 2).toFixed(1)}M`;
		}else {
			return `${(number / 1000 ** 3).toFixed(1)}G`;
		}
	};
	socket.on('cpu-usage', (usage :{percentage: number}) => {
		chartData.CPU = usage.percentage;
		$('#cpu-rate').text(usage.percentage.toFixed(1));
	});
	socket.on('memory-usage', (usage :{percentage: number, total: number, using: number}) => {
		chartData.Memory = usage.percentage;
		$('#memory-rate').text(usage.percentage.toFixed(1));
		$('#memory-using').text((usage.using / 1000000).toFixed(0));
		$('#memory-total').text((usage.total / 1000000).toFixed(0));
	});
	socket.on('network-usage', (usage :{received: number, transmitted: number}) => {
		const transmitted = usage.transmitted || 0;
		const received = usage.received || 0;
		chartData.NetworkUp = transmitted / 1000;
		chartData.NetworkDown = received / 1000;
		$('#network-up-rate').text(SI(transmitted));
		$('#network-down-rate').text(SI(received));
	});
	socket.on('disk-usage', (usage :{read: number, write: number}) => {
		const read = usage.read || 0;
		const write = usage.write || 0;
		chartData.DiskRead = read / 1000;
		chartData.DiskWrite = write / 1000;
		$('#disk-read-rate').text(SI(read));
		$('#disk-write-rate').text(SI(write));
	});
});

// @ts-ignore
const socket = io.connect('', {
	'reconnection': true,
	'reconnectionDelay': 10000,
	'reconnectionDelayMax' : 60000,
	'reconnectionAttempts': 10,
});
socket.on('connect_error', () => {
	popupMessage('ソケットに接続できません\n再接続を試みています...', 'err');
});
socket.on('disconnect', () => {
	popupMessage('ソケットが切断されました\n再接続を試みています...', 'err');
});
async function evalCommand(cmd :string, terminal :JQueryTerminal) {
	terminal.pause();

	socket.emit('command', {
		command: cmd
	});
	function receiveResult(result: {success: boolean, result: string}){
		if (result.success) {
			terminal.echo(result.result).resume();
		}else {
			terminal.error(result.result).resume();
		}
		socket.removeListener('result', receiveResult);
	}
	socket.on('result', receiveResult);	
}

const categorys :{[key:string]:string} = {
	info: '情報',
	warn: '警告',
	error: 'エラー',
}
const servers :{[key:string]:string} = {
	main: 'メイン',
	admin: '管理者',
}
const resolveCategory = (category :string) => categorys[category] || '';
const resolveServer = (server :string) => servers[server] || '';
const escapeLog = (log :string) => log.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\n/g, '<br>');
function parseServerLog(logs :serverLog[]) {
	logs.forEach(log => {
		$('#server-log > tbody').append(`<tr><td class="${log.server}">${resolveServer(log.server)}</td><td class="${log.category}">${resolveCategory(log.category)}</td><td>${escapeLog(log.value)}</td><td>${moment(new Date(log.timestamp)).format('YYYY/MM/DD HH:mm:ss')}</td></tr>`);
	});
}
socket.on('newLog', (result: {value: serverLog}) => {
	const log = result.value;
	$('#server-log > tbody').prepend(`<tr><td class="${log.server}">${resolveServer(log.server)}</td><td class="${log.category}">${resolveCategory(log.category)}</td><td>${escapeLog(log.value)}</td><td>${moment(new Date(log.timestamp)).format('YYYY/MM/DD HH:mm:ss')}</td></tr>`);
});

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

function popupMessage(value :string, style='info') {
	$('#overlay-popup').append(`<div class="popup-message ${style}"><span>${escapeLog(value)}</span><button><svg viewBox="0 0 64 64"><use xlink:href="assets/icons/icons.svg#cross"></use></svg></button></div>`);
	document.querySelector('#overlay-popup .popup-message:last-of-type')?.addEventListener('animationend', function(e) {
		// @ts-ignore
		if (e.animationName.startsWith('popup-end')) this.remove();
	});
	document.querySelector('#overlay-popup .popup-message:last-of-type')?.addEventListener('animationstart', function(e) {
		// @ts-ignore
		if (e.animationName.startsWith('popup-end')) $(this).animate({height: 0, padding: '0 10px'}, 500);
	});
	
	// @ts-ignore
	document.querySelector('#overlay-popup .popup-message:last-of-type button')!.onclick = function() {
		this.parentElement?.classList.add('close');
	}
}
