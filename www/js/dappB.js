// ========== DApp 浏览器（使用原生嵌入式 WebView） ==========
window._browserHistory = [];
window._browserHistoryIndex = -1;

function openBrowserModal(url) {
    if (window.android && window.android.openEmbeddedDapp) {
        window.android.openEmbeddedDapp(url || 'https://pancakeswap.finance');
    } else {
        showToast('原生浏览器不可用');
    }
}

function closeBrowserModal() {
    if (window.android && window.android.closeEmbeddedDapp) {
        window.android.closeEmbeddedDapp();
    }
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

// 桌面图标点击（保留原有桌面图标结构）
function openDapp(url) {
    openBrowserModal(url);
}

// 其他按钮函数保留空实现，防止报错
function browserBack() {}
function browserForward() {}
function showDesktopView() {}
function showWebView() {}
