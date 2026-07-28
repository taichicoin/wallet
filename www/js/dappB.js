// ========== DApp 浏览器（最终修复版） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    if (!url) {
        showDesktopView();
        return;
    }

    hideDesktopView();
    forceLayoutRefresh();

    setTimeout(() => {
        const area = document.getElementById('dappContentArea');
        if (!area) return;

        // 强制计算占位区域的绝对屏幕坐标
        const rect = area.getBoundingClientRect();
        // 若尺寸仍为0，手动设置一个保底尺寸
        if (rect.width === 0 || rect.height === 0) {
            area.style.width = '100%';
            area.style.height = (window.innerHeight * 0.6) + 'px';
            // 再次获取
            const fallbackRect = area.getBoundingClientRect();
            if (fallbackRect.width === 0) return;
            sendToNative(url, fallbackRect);
            return;
        }

        sendToNative(url, rect);
    }, 400); // 足够等待动画完成
}

function forceLayoutRefresh() {
    const area = document.getElementById('dappContentArea');
    if (area) {
        area.style.display = 'block';
        void area.offsetHeight; // 触发重排
    }
}

function sendToNative(url, rect) {
    if (window.android && typeof window.android.openEmbeddedDapp === 'function') {
        window.android.openEmbeddedDapp(
            url,
            Math.round(rect.left),
            Math.round(rect.top),
            Math.round(rect.width),
            Math.round(rect.height)
        );
    } else {
        showToast('原生浏览器不可用');
        showDesktopView();
    }
}

function closeBrowserModal() {
    if (window.android && typeof window.android.closeEmbeddedDapp === 'function') {
        window.android.closeEmbeddedDapp();
    }
    document.getElementById('browserModal').classList.remove('active');
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
    if (area) {
        area.style.display = 'none';
        area.style.width = '';
        area.style.height = '';
    }
    document.getElementById('browserBottomTitle').classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    document.getElementById('browserBottomTitle').classList.add('hidden');
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
