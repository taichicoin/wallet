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

    // 4. 等待动画完成 + 布局稳定（最多等待 1 秒）
    waitForValidRect(function(rect) {
        if (!rect) {
            showToast('无法获取浏览器区域，请重试');
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

function waitForValidRect(callback) {
    var area = document.getElementById('dappContentArea');
    if (!area) {
        callback(null);
        return;
    }

    var start = Date.now();
    function check() {
        var rect = area.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            callback(rect);
        } else if (Date.now() - start < 1000) {
            requestAnimationFrame(check);
        } else {
            // 超时最后再试一次
            rect = area.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                callback(rect);
            } else {
                callback(null);
            }
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
    var url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    var area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'none';
    var bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    var area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'block';
    var bottom = document.getElementById('browserBottomTitle');
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
