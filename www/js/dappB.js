// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    // 获取弹窗内容区域（工具栏下方，桌面视图/WebView 区域）的位置和大小
    const contentArea = document.getElementById('dappContentArea'); // 我们将给这个区域设置 id
    if (!contentArea) {
        showToast('浏览器区域未初始化');
        return;
    }
    const rect = contentArea.getBoundingClientRect();

    // 通知原生层打开嵌入式 WebView，并传递位置信息
    if (window.android && window.android.openEmbeddedDapp) {
        window.android.openEmbeddedDapp(
            url || 'https://pancakeswap.finance',
            Math.round(rect.left),
            Math.round(rect.top),
            Math.round(rect.width),
            Math.round(rect.height)
        );
    } else {
        showToast('原生浏览器不可用');
    }
}

function closeBrowserModal() {
    if (window.android && window.android.closeEmbeddedDapp) {
        window.android.closeEmbeddedDapp();
    }
    // 恢复桌面视图
    showDesktopView();
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

// 桌面图标点击
function openDapp(url) {
    openBrowserModal(url);
}

// 桌面视图切换（由前端控制）
let isDesktopVisible = true;
function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    document.getElementById('browserBottomTitle').classList.remove('hidden');
    isDesktopVisible = true;
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    document.getElementById('browserBottomTitle').classList.add('hidden');
    isDesktopVisible = false;
}

// 在打开浏览器时隐藏桌面，关闭时显示桌面（在 openBrowserModal 中调用）
function openEmbeddedDapp(url) {
    hideDesktopView();
    openBrowserModal(url);
}

// 覆盖原来的 openBrowserModal，使其默认显示桌面（从桌面点击时调用此函数）
function openBrowserFromDesktop(url) {
    hideDesktopView();
    openBrowserModal(url);
}

// 初始化时，修改 HTML 中按钮的调用，我们将在下面手动绑定
function browserBack() {}
function browserForward() {}
