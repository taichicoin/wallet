// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    // 1. 先隐藏桌面，显示占位区域
    hideDesktopView();

    // 2. 等一帧，确保布局已更新
    requestAnimationFrame(() => {
        const contentArea = document.getElementById('dappContentArea');
        if (!contentArea) {
            showToast('浏览器区域未初始化');
            return;
        }

        const rect = contentArea.getBoundingClientRect();
        console.log('DApp区域位置:', rect);

        if (rect.width === 0 || rect.height === 0) {
            showToast('无法获取浏览器区域大小');
            // 恢复桌面视图，避免界面卡住
            showDesktopView();
            return;
        }

        // 3. 调用原生接口，在指定位置嵌入 WebView
        if (window.android && typeof window.android.openEmbeddedDapp === 'function') {
            window.android.openEmbeddedDapp(
                url || 'https://pancakeswap.finance',
                Math.round(rect.left),
                Math.round(rect.top),
                Math.round(rect.width),
                Math.round(rect.height)
            );
        } else {
            showToast('原生浏览器不可用');
            // 恢复桌面视图
            showDesktopView();
        }
    });
}

function closeBrowserModal() {
    if (window.android && typeof window.android.closeEmbeddedDapp === 'function') {
        window.android.closeEmbeddedDapp();
    }
    showDesktopView();
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
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
    if (dappArea) dappArea.style.display = 'block';   // 关键：让其可见
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
