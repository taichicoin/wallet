// ========== DApp 浏览器（桌面优先，全屏填充） ==========

// 打开浏览器弹窗（不传url = 只显示桌面；传url = 加载该网站）
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 1. 显示弹窗
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 2. 如果没有传入 url，只显示桌面，不加载任何网站
    if (!url) {
        showDesktopView();
        return;
    }

    // 3. 隐藏桌面，显示占位区域
    hideDesktopView();

    // 4. 等待布局完成，确保区域有尺寸
    waitForLayout(() => {
        const contentArea = document.getElementById('dappContentArea');
        if (!contentArea) {
            showToast('浏览器区域错误');
            showDesktopView();
            return;
        }

        const rect = contentArea.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            showToast('无法获取区域大小，请重试');
            showDesktopView();
            return;
        }

        // 5. 调用原生接口嵌入 WebView
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

// 等待布局稳定（最多等待 500ms）
function waitForLayout(callback) {
    let attempts = 0;
    function check() {
        const area = document.getElementById('dappContentArea');
        if (!area) {
            callback();
            return;
        }
        const rect = area.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            callback();
        } else if (attempts < 10) {
            attempts++;
            requestAnimationFrame(check);
        } else {
            callback(); // 超时也尝试
        }
    }
    requestAnimationFrame(check);
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
