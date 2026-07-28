// ========== DApp 浏览器核心逻辑 ==========
const fabBtn = document.getElementById('fabBtn');
const browserModal = document.getElementById('browserModal');

function openBrowserModal(url) {
    browserModal.classList.add('active');
    
    // 按钮切换为关闭状态
    fabBtn.textContent = '✕';
    fabBtn.onclick = closeBrowserModal;

    if (!url) {
        browserModal.classList.remove('is-dapp-mode');
        showDesktopView();
        return;
    }

    // DApp模式：打开原生WebView
    browserModal.classList.add('is-dapp-mode');
    hideDesktopView();

    const toolbar = document.querySelector('#browserModal .browser-toolbar');
    if (!toolbar) return;

    const rect = toolbar.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const top = Math.round(rect.bottom * dpr);
    const height = Math.round(window.innerHeight * dpr) - top;

    if (window.android && typeof window.android.showDapp === 'function') {
        window.android.showDapp(url, top, height);
    }
}

function closeBrowserModal() {
    // 销毁原生WebView
    if (window.android && typeof window.android.hideDapp === 'function') {
        window.android.hideDapp();
    }

    // 关闭弹窗、重置状态
    browserModal.classList.remove('active');
    browserModal.classList.remove('is-dapp-mode');
    showDesktopView();
    document.getElementById('browserUrl').value = '';

    // 按钮切回地球图标
    fabBtn.textContent = '🌐';
    fabBtn.onclick = openBrowserModal;
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
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

function browserBack() {}
function browserForward() {}
