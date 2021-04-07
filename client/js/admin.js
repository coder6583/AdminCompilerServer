"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
$(function () {
    // タブ切り替え
    $('.nav-content').on('click', function () {
        var bind = this.dataset.bind;
        $('.nav-content.selected').removeClass('selected');
        this.classList.add('selected');
        $('.content.show').removeClass('show');
        $(".tab-" + bind).addClass('show');
        // 高さ更新
        heightRefresh();
    });
    // コンソール
    $('#console').terminal(function (command) {
        console.log(command);
        if (command) {
            try {
                evalCommand(command, this);
            }
            catch (err) {
                this.error(err);
            }
        }
    }, {
        greetings: 'Welcome to Laze Admin Console',
    });
    // オーバーレイ
    $('.button-overlay').on('click', function () {
        var overlay = this.dataset.overlay;
        $(".overlay-" + overlay).addClass('show');
    });
    $('.overlay-window').on('click', function () {
        this.classList.remove('show');
    });
    $('.overlay-content').on('click', function () { return false; });
    $('.overlay-close').on('click', function () {
        var _a;
        (_a = this.closest('.overlay-window')) === null || _a === void 0 ? void 0 : _a.classList.remove('show');
    });
    // レイアウト
    var heightRefresh = function () {
        var _a;
        var tables = $('.list-tab > .table');
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var tbody = table.getElementsByTagName('tbody')[0];
            var labelHeight = (_a = table.parentElement) === null || _a === void 0 ? void 0 : _a.getElementsByClassName('label')[0].scrollHeight;
            if (labelHeight) {
                console.log(($(window).height() || 0) - labelHeight);
                table.style.maxHeight = ($(window).height() || 0) - labelHeight + "px";
                tbody.style.maxHeight = ($(window).height() || 0) - labelHeight - 40 + "px";
            }
        }
    };
    $(window).on('resize', heightRefresh).trigger('resize');
    // submit無効化
    $('.disable-submit').on('submit', function () { return false; });
    // banIP
    $('#add-ban-ip').on('submit', function () {
        var banIP = $('#ban-ip-box').val();
    });
    var logs = [];
    for (var i = 0; i < 20; i++) {
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
    var chartData = {
        CPU: 0,
        Memory: 0,
        NetworkUp: 0,
        NetworkDown: 0,
        Disk: 0,
    };
    var colors = {
        cpu: '17, 125, 187',
        memory: '139, 18, 174',
        network: '167, 79, 1',
        disk: '77, 166, 12'
    };
    var monitorDatasets = {
        cpu: [{
                label: 'CPU',
                borderColor: "rgb(" + colors.cpu + ")",
                backgroundColor: "rgba(" + colors.cpu + ", .1)",
                data: []
            }],
        memory: [{
                label: 'Memory',
                borderColor: "rgb(" + colors.memory + ")",
                backgroundColor: "rgba(" + colors.memory + ", .1)",
                data: []
            }],
        network: [{
                label: 'NetworkUp',
                borderColor: "rgb(" + colors.network + ")",
                backgroundColor: "rgba(" + colors.network + ", .1)",
                data: []
            }, {
                label: 'NetworkDown',
                borderColor: "rgb(" + colors.network + ")",
                backgroundColor: "rgba(" + colors.network + ", .1)",
                borderDash: [5, 5],
                data: []
            }],
        disk: [{
                label: 'Disk',
                borderColor: "rgb(" + colors.disk + ")",
                backgroundColor: "rgba(" + colors.disk + ", .1)",
                data: []
            }],
    };
    var monitors = document.querySelectorAll('.chart-div > canvas');
    for (var i = 0; i < monitors.length; i++) {
        var monitor = monitors[i];
        var ctx = monitor.getContext('2d');
        var id = (monitor.id.match(/monitor\-(\w+)/) || [,])[1];
        if (ctx && id) {
            var chart = new Chart(ctx, {
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
                                    onRefresh: function (chart) {
                                        // @ts-ignore
                                        var datasets = chart.data.datasets;
                                        if (datasets) {
                                            datasets.forEach(function (dataset) {
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
var socket = io.connect('');
function evalCommand(cmd, terminal) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            terminal.pause();
            socket.emit('command', {
                command: cmd
            });
            socket.on('result', function (result) {
                if (result.success) {
                    terminal.echo(result.result).resume();
                }
                else {
                    terminal.error(result.result).resume();
                }
                socket.removeListener('result', this);
            });
            return [2 /*return*/];
        });
    });
}
function parseServerLog(logs) {
    var resolveCategory = function (category) {
        var categorys = {
            info: '情報',
            warn: '警告',
            error: 'エラー'
        };
        // @ts-ignore
        return categorys[category] || '';
    };
    logs.forEach(function (log) {
        $('#server-log > tbody').append("<tr><td class=\"" + log.category + "\">" + resolveCategory(log.category) + "</td><td>" + log.value + "</td><td>" + moment(new Date(log.timestmap)).format('YYYY/MM/DD HH:mm:ss') + "</td></tr>");
    });
}
function parseBanIP(banIPs) {
    banIPs.forEach(function (banIP) {
        $('#ban-ip > tbody').append("<tr><td>" + banIP.ip + "</td><td>" + banIP.memo + "</td><td>" + moment(new Date(banIP.timestamp)).format('YYYY/MM/DD HH:mm:ss') + "</td><td><button class=\"btn btn-outline-secondary edit\"><i class=\"bi bi-pencil\"></i></button><button class=\"btn btn-outline-secondary remove\"><i class=\"bi bi-x\"></i></button></td></tr>");
    });
}
function parseUsers(users) {
    users.forEach(function (user) {
        $('#users > tbody').append("<tr><td><img src=\"" + user.avatar + "\"></td><td>" + user.id + "</td><td>" + user.username + "</td><td>" + user.email + "</td><td><button class=\"btn btn-outline-secondary edit\"><i class=\"bi bi-pencil\"></i></button><button class=\"btn btn-outline-secondary remove\"><i class=\"bi bi-x\"></i></button></td></tr>");
    });
}
socket.on('');
