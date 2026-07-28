// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 1. 先显示弹窗（如果还没显示）
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 2. 隐藏桌面，显示占位区域
    hideDesktopView();

    // 3. 等待布局完成（200ms 足够）
    setTimeout(() => {
        const contentArea = document.getElementById('dappContentArea');
        if (!contentArea) {
            showToast('浏览器区域未初始化');
            return;
        }

        const rect = contentArea.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            showToast('无法获取浏览器区域大小，请重试');
            showDesktopView();
            return;
        }

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
            showDesktopView();
        }
    }, 200);
}

function closeBrowserModal() {
    // 移除原生 WebView
    if (window.android && typeof window.android.closeEmbeddedDapp === 'function') {
        window.android.closeEmbeddedDapp();
    }
    // 隐藏弹窗
    document.getElementById('browserModal').classList.remove('active');
    // 恢复桌面视图
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
    if (dappArea) dappArea.style.display = 'block';
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
