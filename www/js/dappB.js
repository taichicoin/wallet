// ========== DApp 浏览器（布局轮询版） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    // 1. 显示弹窗
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    // 2. 如果没有传入 url，只显示桌面（绝不自动加载任何网站）
    if (!url) {
        showDesktopView();
        return;
    }

    // 3. 隐藏桌面，显示占位区域
    hideDesktopView();

    // 4. 开始轮询，直到 dappContentArea 获得有效稳定尺寸
    waitForStableRect(function(rect) {
        if (!rect) {
            showToast('浏览器区域无法使用，请重试');
            showDesktopView();
            return;
        }

        // 5. 将坐标传给原生层
        if (window.android && typeof window.android.openAutoDapp === 'function') {
            window.android.openAutoDapp(
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

/**
 * 轮询获取 dappContentArea 的尺寸，直到两次连续有效且相同
 * @param {function} callback 回调，参数为 {left, top, width, height} 或 null
 * @param {number} timeout 超时时间(ms)，默认 3000
 */
function waitForStableRect(callback, timeout) {
    timeout = timeout || 3000;
    var area = document.getElementById('dappContentArea');
    if (!area) {
        callback(null);
        return;
    }

    var lastRect = null;
    var stableCount = 0;
    var startTime = Date.now();
    var maxAttempts = 60; // 最多 60 帧，约 1 秒

    function check() {
        // 超时或超过最大尝试次数
        if (Date.now() - startTime > timeout || maxAttempts <= 0) {
            // 最后一次尝试
            var rect = area.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                callback({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                });
            } else {
                callback(null);
            }
            return;
        }

        var rect = area.getBoundingClientRect();

        // 尺寸必须非零
        if (rect.width > 0 && rect.height > 0) {
            // 检查是否与上次相同
            if (lastRect &&
                lastRect.left === rect.left &&
                lastRect.top === rect.top &&
                lastRect.width === rect.width &&
                lastRect.height === rect.height) {
                stableCount++;
                if (stableCount >= 3) { // 连续 3 次相同，认为稳定
                    callback({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height
                    });
                    return;
                }
            } else {
                stableCount = 0;
            }
            lastRect = {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            };
        }

        maxAttempts--;
        requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
}

function closeBrowserModal() {
    if (window.android && typeof window.android.closeAutoDapp === 'function') {
        window.android.closeAutoDapp();
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
    var area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'none';
    var bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    var bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
    var area = document.getElementById('dappContentArea');
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
