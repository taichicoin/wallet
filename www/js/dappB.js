// ========== DApp 浏览器（地址栏底部精确定位） ==========
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

    // 获取地址栏底部物理坐标
    const toolbar = document.querySelector('#browserModal .browser-toolbar');
    if (!toolbar) {
        showToast('找不到地址栏');
        showDesktopView();
        return;
    }

    const rect = toolbar.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const top = Math.round(rect.bottom * dpr);   // 物理像素

    if (window.android && typeof window.android.showDapp === 'function') {
        window.android.showDapp(url, top);
    } else {
        showToast('原生浏览器不可用');
        showDesktopView();
    }
}

function closeBrowserModal() {
    if (window.android && typeof window.android.hideDapp === 'function') {
        window.android.hideDapp();
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
    // 不需要再操作 dappContentArea
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
