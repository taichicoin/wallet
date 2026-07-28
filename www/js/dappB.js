// ========== DApp 浏览器（弹窗内嵌入式 WebView） ==========
function openBrowserModal(url) {
    const contentArea = document.getElementById('dappContentArea');
    if (!contentArea) {
        showToast('浏览器区域未初始化');
        return;
    }
    const rect = contentArea.getBoundingClientRect();

    if (window.android && window.android.openEmbeddedDapp) {
        window.android.openEmbeddedDapp(
            url || 'https://pancakeswap.finance',
            Math.round(rect.left),
            Math.round(rect.top),
            Math.round(rect.width),
            Math.round(rect.height)
        );
    } else {
        showToast('原生浏览器不可用');
    }
}

function closeBrowserModal() {
    if (window.android && window.android.closeEmbeddedDapp) {
        window.android.closeEmbeddedDapp();
    }
    showDesktopView();
}

function navigateBrowser() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    openBrowserModal(url);
}

function openDapp(url) {
    openBrowserModal(url);
}

function showDesktopView() {
    document.getElementById('desktopView').style.display = 'flex';
    document.getElementById('dappContentArea').style.display = 'none';
    document.getElementById('browserBottomTitle').classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    document.getElementById('dappContentArea').style.display = 'block';
    document.getElementById('browserBottomTitle').classList.add('hidden');
}

function openBrowserFromDesktop(url) {
    hideDesktopView();
    openBrowserModal(url);
}

function browserBack() {}
function browserForward() {}
