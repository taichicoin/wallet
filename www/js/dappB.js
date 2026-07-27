// ========== DApp 浏览器 ==========
window._browserHistory = [];
window._browserHistoryIndex = -1;
let isShowingDesktop = true; // 默认显示桌面

// 切换视图：显示桌面或网页
function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    document.getElementById('browserFrame').style.display = 'none';
    document.getElementById('browserBottomTitle').classList.remove('hidden');
    isShowingDesktop = true;
}

function showWebView() {
    document.getElementById('desktopView').style.display = 'none';
    document.getElementById('browserFrame').style.display = 'block';
    document.getElementById('browserBottomTitle').classList.add('hidden');
    isShowingDesktop = false;
}

// 点击桌面图标打开 DApp
function openDapp(url) {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    document.getElementById('browserUrl').value = url;
    document.getElementById('browserFrame').src = url;
    showWebView();
    // 记录历史
    if (window._browserHistoryIndex === -1 || window._browserHistory[window._browserHistoryIndex] !== url) {
        window._browserHistory = window._browserHistory.slice(0, window._browserHistoryIndex + 1);
        window._browserHistory.push(url);
        window._browserHistoryIndex++;
    }
}

// 打开浏览器弹窗（默认显示桌面）
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    const input = document.getElementById('browserUrl');
    // 如果传入了 url，直接打开网页；否则显示桌面
    if (url) {
        openDapp(url);
    } else {
        // 显示桌面
        input.value = '';
        showDesktopView();
        // 重置历史
        window._browserHistory = [];
        window._browserHistoryIndex = -1;
    }
    modal.classList.add('active');
}

function closeBrowserModal() {
    document.getElementById('browserModal').classList.remove('active');
    // 关闭时不清除状态，下次打开继续
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openDapp(url);
}

function browserBack() {
    if (window._browserHistoryIndex > 0) {
        window._browserHistoryIndex--;
        const url = window._browserHistory[window._browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrl').value = url;
        showWebView();
    } else if (window._browserHistoryIndex === 0) {
        // 回到桌面
        window._browserHistoryIndex = -1;
        showDesktopView();
        document.getElementById('browserUrl').value = '';
    }
}

function browserForward() {
    if (window._browserHistoryIndex < window._browserHistory.length - 1) {
        window._browserHistoryIndex++;
        const url = window._browserHistory[window._browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrl').value = url;
        showWebView();
    }
}
