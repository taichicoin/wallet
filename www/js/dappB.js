// ========== DApp 浏览器（前端计算坐标版） ==========
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

    // 强制布局并计算目标区域的绝对屏幕坐标
    const rect = calcDappArea();
    if (!rect) {
        showToast('浏览器区域异常，请重试');
        showDesktopView();
        return;
    }

    // 存到全局变量，供原生读取
    window.__dappRect = rect;

    // 调用原生接口（原生会读 window.__dappRect）
    if (window.android && typeof window.android.openAutoDapp === 'function') {
        window.android.openAutoDapp(url);
    } else {
        showToast('原生浏览器不可用');
        showDesktopView();
    }
}

function calcDappArea() {
    const modal = document.getElementById('browserModal');
    if (!modal) return null;
    const content = modal.querySelector('.modal-content');
    if (!content) return null;

    const toolbar = content.querySelector('.browser-toolbar');
    const bottomTitle = document.getElementById('browserBottomTitle');

    // 内容区屏幕坐标
    const contentRect = content.getBoundingClientRect();
    // 工具栏高度
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    // 底部标题高度（隐藏时为零）
    const bottomHeight = (bottomTitle && !bottomTitle.classList.contains('hidden')) ? bottomTitle.offsetHeight : 0;
    // 内边距
    const style = window.getComputedStyle(content);
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;

    const areaTop = contentRect.top + toolbarHeight + padTop;
    const areaHeight = contentRect.height - toolbarHeight - padTop - bottomHeight - padBottom;

    if (areaHeight <= 0) return null;

    return {
        left: contentRect.left,
        top: areaTop,
        width: contentRect.width,
        height: areaHeight
    };
}

function closeBrowserModal() {
    if (window.android && typeof window.android.closeAutoDapp === 'function') {
        window.android.closeAutoDapp();
    } else if (window.android && typeof window.android.closeEmbeddedDapp === 'function') {
        window.android.closeEmbeddedDapp();
    }
    document.getElementById('browserModal').classList.remove('active');
    showDesktopView();
    delete window.__dappRect;
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
    const area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'block';
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
