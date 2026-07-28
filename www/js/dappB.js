// ========== DApp 浏览器（弹窗内嵌入式 WebView · 终版） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 无网址 → 只显示桌面
    if (!url) {
        showDesktopView();
        return;
    }

    // 隐藏桌面，让位给 WebView
    hideDesktopView();

    // 直接根据已知布局算出目标区的绝对屏幕坐标
    const rect = calcTargetRect();
    if (!rect) {
        showToast('浏览器区域异常，请重试');
        showDesktopView();
        return;
    }

    // 通知原生层嵌入 WebView
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

// 根据弹窗的实际布局，同步计算目标区域
function calcTargetRect() {
    const modal = document.getElementById('browserModal');
    if (!modal) return null;
    const content = modal.querySelector('.modal-content');
    if (!content) return null;

    const toolbar = content.querySelector('.browser-toolbar');
    const bottomTitle = document.getElementById('browserBottomTitle');

    // 弹窗内容区的屏幕矩形
    const contentRect = content.getBoundingClientRect();

    // 工具栏高度
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    // 底部标题高度（隐藏时为零）
    const bottomHeight = (bottomTitle && !bottomTitle.classList.contains('hidden'))
        ? bottomTitle.offsetHeight : 0;

    // 内容区的内边距
    const style = window.getComputedStyle(content);
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;

    // 目标区域左上角相对于 content 的偏移
    const areaTop = toolbarHeight + padTop;
    const areaHeight = contentRect.height - areaTop - bottomHeight - padBottom;

    if (areaHeight <= 0) return null;

    return {
        left: contentRect.left,
        top: contentRect.top + areaTop,
        width: contentRect.width,
        height: areaHeight
    };
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

function openDapp(url) {
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
