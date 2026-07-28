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

    // 4. 立即获取目标区域精确坐标（同步计算）
    const rect = getTargetRect();
    if (!rect) {
        showToast('无法获取浏览器区域大小，请重试');
        showDesktopView();
        return;
    }

    // 5. 调用原生接口
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

// 主动计算目标区域的屏幕坐标（基于已知布局）
function getTargetRect() {
    const modal = document.getElementById('browserModal');
    if (!modal) return null;

    const content = modal.querySelector('.modal-content');
    if (!content) return null;

    const toolbar = content.querySelector('.browser-toolbar');
    const bottomTitle = document.getElementById('browserBottomTitle');

    // 获取 modal-content 的屏幕坐标和尺寸
    const contentRect = content.getBoundingClientRect();

    // 工具栏高度
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    // 底部标题高度（隐藏时为0）
    const bottomHeight = (bottomTitle && !bottomTitle.classList.contains('hidden')) ? bottomTitle.offsetHeight : 0;
    // 内边距（modal-content 的 padding 上下）
    const computedStyle = window.getComputedStyle(content);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    // 目标区域在内容区内的起始偏移（top）
    const areaOffsetTop = toolbarHeight + paddingTop;
    // 目标区域的高度 = 内容区总高度 - 顶部偏移 - 底部标题高度 - 底部内边距
    const areaHeight = contentRect.height - areaOffsetTop - bottomHeight - paddingBottom;

    if (areaHeight <= 0) return null;

    // 目标区域的绝对屏幕坐标
    const left = contentRect.left;
    const top = contentRect.top + areaOffsetTop;
    const width = contentRect.width;
    const height = areaHeight;

    // 同时设置 dappContentArea 的样式以便视觉对齐（可选）
    const area = document.getElementById('dappContentArea');
    if (area) {
        area.style.position = 'absolute';
        area.style.left = '0';
        area.style.top = areaOffsetTop + 'px';
        area.style.width = '100%';
        area.style.height = height + 'px';
        area.style.display = 'block';
    }

    return { left, top, width, height };
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
        area.style.position = '';
        area.style.left = '';
        area.style.top = '';
        area.style.height = '';
        area.style.width = '';
    }
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
    // 注意：不在这里操作 dappContentArea，由 getTargetRect 动态设置
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
