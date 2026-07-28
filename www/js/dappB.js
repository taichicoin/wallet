// ========== DApp 浏览器（原生全屏铺满地址栏以下） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    modal.classList.add('active');

    // 隐藏桌面内容
    hideDesktopView();

    // 获取地址栏底部位置
    const toolbar = document.getElementById('browserToolbar');
    const rect = toolbar.getBoundingClientRect();

    // 只把“地址栏底部Y坐标”传给原生
    const top = Math.round(rect.bottom);

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
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
}

function openBrowserFromDesktop(url) { openBrowserModal(url); }
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
