// ========== DApp 浏览器（稳定坐标传递） ==========
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

    // 等待布局稳定后获取坐标
    waitForStableDappArea(function(rect) {
        if (!rect) {
            showToast('浏览器区域错误，请重试');
            showDesktopView();
            return;
        }

        // 传给原生（坐标已乘以 devicePixelRatio）
        if (window.android && typeof window.android.setDappRect === 'function') {
            window.android.setDappRect(
                JSON.stringify(rect),
                url
            );
        } else {
            showToast('原生浏览器不可用');
            showDesktopView();
        }
    });
}

function waitForStableDappArea(callback, maxFrames = 30) {
    var area = document.getElementById('dappContentArea');
    if (!area) { callback(null); return; }

    var lastRect = null;
    var stableCount = 0;
    var check = function() {
        var rect = area.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            if (lastRect &&
                lastRect.left === rect.left &&
                lastRect.top === rect.top &&
                lastRect.width === rect.width &&
                lastRect.height === rect.height) {
                stableCount++;
                if (stableCount >= 3) {
                    // 稳定了，返回物理像素坐标
                    var dpr = window.devicePixelRatio || 1;
                    callback({
                        left: rect.left * dpr,
                        top: rect.top * dpr,
                        width: rect.width * dpr,
                        height: rect.height * dpr
                    });
                    return;
                }
            } else {
                stableCount = 0;
                lastRect = {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }
        }
        if (--maxFrames > 0) {
            requestAnimationFrame(check);
        } else {
            // 超时，取最后一次有效值
            if (lastRect) {
                var dpr = window.devicePixelRatio || 1;
                callback({
                    left: lastRect.left * dpr,
                    top: lastRect.top * dpr,
                    width: lastRect.width * dpr,
                    height: lastRect.height * dpr
                });
            } else {
                callback(null);
            }
        }
    };
    requestAnimationFrame(check);
}

function closeBrowserModal() {
    if (window.android && typeof window.android.hideDapp === 'function') {
        window.android.hideDapp();
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
    var bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
    // 显示 dappContentArea 以便获取尺寸
    var area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'block';
}

function openBrowserFromDesktop(url) { openBrowserModal(url); }
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
