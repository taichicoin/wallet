// ========== DApp 浏览器（关闭按钮版） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    if (!url) {
        modal.classList.remove('is-dapp-mode');
        showDesktopView();
        return;
    }

    modal.classList.add('is-dapp-mode');
    hideDesktopView();

    const toolbar = document.querySelector('#browserModal .browser-toolbar');
    if (!toolbar) {
        showToast('找不到地址栏');
        showDesktopView();
        return;
    }

    const rect = toolbar.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const top = Math.round(rect.bottom * dpr);
    const viewportBottom = Math.round(window.innerHeight * dpr);
    const height = viewportBottom - top;

    if (window.android && typeof window.android.showDapp === 'function') {
        window.android.showDapp(url, top, height);
        switchFabToClose();
    } else {
        showToast('原生浏览器不可用');
        showDesktopView();
    }
}

function closeBrowserModal() {
    if (window.android && typeof window.android.hideDapp === 'function') {
        window.android.hideDapp();
    }
    const modal = document.getElementById('browserModal');
    modal.classList.remove('active');
    modal.classList.remove('is-dapp-mode');
    showDesktopView();
    switchFabToBrowser();
}

function switchFabToClose() {
    const fab = document.querySelector('.fab');
    if (!fab) return;
    fab.innerHTML = '✕';
    fab.setAttribute('onclick', 'closeBrowserModal()');
    fab.style.background = 'var(--danger)';
}

function switchFabToBrowser() {
    const fab = document.querySelector('.fab');
    if (!fab) return;
    fab.innerHTML = '🌐';
    fab.setAttribute('onclick', 'openBrowserModal()');
    fab.style.background = 'var(--accent)';
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
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
