// ========== DApp 浏览器（桌面优先，不自动加载） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 显示弹窗
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 如果没有 url，只显示桌面
    if (!url) {
        showDesktopView();
        return;
    }

    // 隐藏桌面，显示占位区域
    hideDesktopView();

    // 等待布局稳定
    waitForLayout(() => {
        const area = document.getElementById('dappContentArea');
        const rect = area.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            showToast('浏览器区域尺寸异常，请重试');
            showDesktopView();
            return;
        }

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
    });
}

function waitForLayout(callback) {
    let attempts = 0;
    function check() {
        const area = document.getElementById('dappContentArea');
        if (!area) { callback(); return; }
        const rect = area.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            callback();
        } else if (attempts < 10) {
            attempts++;
            requestAnimationFrame(check);
        } else {
            // 超时直接执行
            callback();
        }
    }
    requestAnimationFrame(check);
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
