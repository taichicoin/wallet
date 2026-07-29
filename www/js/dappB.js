// ========== DApp 浏览器（地址栏底部精确定位） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    if (!url) {
        // 桌面模式：移除 DApp 状态
        modal.classList.remove('is-dapp-mode');
        showDesktopView();
        return;
    }

    // DApp 模式：激活状态，彻底隐藏底部占位
    modal.classList.add('is-dapp-mode');
    hideDesktopView();

    // 计算地址栏底部坐标 + WebView 精确高度
    const toolbar = document.querySelector('#browserModal .browser-toolbar');
    if (!toolbar) {
        showToast('找不到地址栏');
        showDesktopView();
        return;
    }

    const rect = toolbar.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const top = Math.round(rect.bottom * dpr);
    // 直接用视口底部计算高度，确保铺满到屏幕最下方
    const viewportBottom = Math.round(window.innerHeight * dpr);
    const height = viewportBottom - top;

    if (window.android && typeof window.android.showDapp === 'function') {
        // 传入精确高度（Java 侧需要同步改成接收 3 个参数）
        window.android.showDapp(url, top, height);
    } else {
        showToast('原生浏览器不可用');
        showDesktopView();
    }
}

function closeBrowserModal() {
    if (window.android && typeof window.android.hideDapp === 'function') {
        window.android.hideDapp();
    }
    const modal = document.getElementById('browserModal');
    modal.classList.remove('active');
    modal.classList.remove('is-dapp-mode');
    showDesktopView();
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    const area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
