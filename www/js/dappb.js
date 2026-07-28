// ========== DApp 浏览器（调试版） ==========
function openBrowserModal(url) {
    if (typeof showToast === 'function') showToast('正在打开浏览器...');

    const contentArea = document.getElementById('dappContentArea');
    if (!contentArea) {
        if (typeof showToast === 'function') showToast('错误：dappContentArea 不存在');
        return;
    }

    // 先确保区域可见
    hideDesktopView();
    const rect = contentArea.getBoundingClientRect();

    // 检查原生接口
    if (window.android) {
        // 优先使用 openEmbeddedDapp（新接口）
        if (typeof window.android.openEmbeddedDapp === 'function') {
            window.android.openEmbeddedDapp(
                url || 'https://pancakeswap.finance',
                Math.round(rect.left),
                Math.round(rect.top),
                Math.round(rect.width),
                Math.round(rect.height)
            );
            return;
        }
        // 降级到旧接口 openDapp（全屏版）
        if (typeof window.android.openDapp === 'function') {
            if (typeof showToast === 'function') showToast('正在用全屏浏览器打开...');
            window.android.openDapp(url || 'https://pancakeswap.finance');
            return;
        }
    }

    // 如果所有原生接口都不存在，降级到系统浏览器（无法连接钱包）
    if (typeof showToast === 'function') showToast('原生浏览器不可用，将用系统浏览器打开');
    window.open(url || 'https://pancakeswap.finance', '_blank');
}

function closeBrowserModal() {
    if (window.android && typeof window.android.closeEmbeddedDapp === 'function') {
        window.android.closeEmbeddedDapp();
    } else if (window.android && typeof window.android.closeDapp === 'function') {
        window.android.closeDapp();
    }
    showDesktopView();
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    const dappArea = document.getElementById('dappContentArea');
    if (dappArea) dappArea.style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const dappArea = document.getElementById('dappContentArea');
    if (dappArea) dappArea.style.display = 'block';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
}

function openBrowserFromDesktop(url) {
    hideDesktopView();
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
