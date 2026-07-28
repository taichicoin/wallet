// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 1. 显示弹窗
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 2. 如果没有传入 url，只显示桌面（不加载任何网站）
    if (!url) {
        showDesktopView();
        return;
    }

    // 3. 隐藏桌面，显示占位区域
    hideDesktopView();

    // 4. 主动计算目标区域尺寸（立即执行，不等动画）
    setDappAreaSize();
    const area = document.getElementById('dappContentArea');
    if (!area) {
        showToast('浏览器区域错误');
        showDesktopView();
        return;
    }

    // 5. 获取区域屏幕坐标
    const rect = area.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        // 极少数情况仍为0，延迟重试一次
        setTimeout(() => {
            const retryRect = area.getBoundingClientRect();
            if (retryRect.width === 0 || retryRect.height === 0) {
                showToast('无法获取浏览器区域大小，请重试');
                showDesktopView();
                return;
            }
            callNativeWebView(url, retryRect);
        }, 350);
        return;
    }

    callNativeWebView(url, rect);
}

function setDappAreaSize() {
    const modal = document.getElementById('browserModal');
    const content = modal.querySelector('.modal-content');
    const toolbar = content.querySelector('.browser-toolbar');
    const bottom = document.getElementById('browserBottomTitle');
    const area = document.getElementById('dappContentArea');

    // 获取弹窗内容区总高度
    const contentHeight = content.clientHeight;
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    const bottomHeight = (bottom && !bottom.classList.contains('hidden')) ? bottom.offsetHeight : 0;

    // 计算 dappContentArea 应该占用的高度
    const areaHeight = contentHeight - toolbarHeight - bottomHeight - 16; // 减去内边距
    if (areaHeight > 0) {
        area.style.height = areaHeight + 'px';
    }
    area.style.width = '100%';
}

function callNativeWebView(url, rect) {
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
        area.style.height = ''; // 清除固定高度
    }
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'block';
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
