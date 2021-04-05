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
});

// @ts-ignore
const socket = io.connect('');
async function evalCommand(cmd:string, terminal :JQueryTerminal) {
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