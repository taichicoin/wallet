// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 1. 显示弹窗
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 2. 如果没有传入 url，只显示桌面
    if (!url) {
        showDesktopView();
        return;
    }

    // 3. 隐藏桌面，显示占位区域
    hideDesktopView();

    // 4. 等待布局稳定（弹窗动画、flex 布局更新需要时间）
    waitForLayout((success) => {
        if (!success) {
            showToast('无法获取浏览器区域大小，请重试');
            showDesktopView();
            return;
        }

        const area = document.getElementById('dappContentArea');
        const rect = area.getBoundingClientRect();
        console.log('DApp 区域位置:', rect);

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

function waitForLayout(callback) {
    let attempts = 0;
    function check() {
        const area = document.getElementById('dappContentArea');
        if (!area) {
            callback(false);
            return;
        }
        const rect = area.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            callback(true);
        } else if (attempts < 15) {
            attempts++;
            requestAnimationFrame(check);
        } else {
            // 超时后再给一次机会
            setTimeout(() => {
                const rect2 = area.getBoundingClientRect();
                if (rect2.width > 0 && rect2.height > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            }, 300);
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
