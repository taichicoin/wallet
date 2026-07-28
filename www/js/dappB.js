// ========== DApp 浏览器（固定布局，永不失效） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;
    if (!modal.classList.contains('active')) modal.classList.add('active');

    if (!url) {
        showDesktopView();
        return;
    }

    hideDesktopView();

    // 直接通知原生，原生自己知道该放哪里
    if (window.android && typeof window.android.showDapp === 'function') {
        window.android.showDapp(url);
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
