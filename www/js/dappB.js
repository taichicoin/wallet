// ========== DApp 浏览器（前端精准坐标版） ==========
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

    // 延迟 350ms 等待动画结束，然后计算坐标并传原生
    setTimeout(() => {
        const rect = getTargetRect();
        if (!rect) {
            showToast('无法获取浏览器区域，请重试');
            showDesktopView();
            return;
        }

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
    }, 350);
}

// 精确计算目标区域（工具栏下方、底部标题上方）
function getTargetRect() {
    const content = document.querySelector('#browserModal .modal-content');
    if (!content) return null;

    const toolbar = content.querySelector('.browser-toolbar');
    const bottomTitle = document.getElementById('browserBottomTitle');

    const contentRect = content.getBoundingClientRect();
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    const bottomHeight = (bottomTitle && !bottomTitle.classList.contains('hidden')) ? bottomTitle.offsetHeight : 0;

    const style = window.getComputedStyle(content);
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;

    const areaTop = contentRect.top + toolbarHeight + padTop;
    const areaHeight = contentRect.height - toolbarHeight - padTop - bottomHeight - padBottom;

    if (areaHeight <= 0) return null;
    return {
        left: contentRect.left,
        top: areaTop,
        width: contentRect.width,
        height: areaHeight
    };
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
    const area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.remove('hidden');
}

function hideDesktopView() {
    document.getElementById('desktopView').style.display = 'none';
    const bottom = document.getElementById('browserBottomTitle');
    if (bottom) bottom.classList.add('hidden');
    const area = document.getElementById('dappContentArea');
    if (area) area.style.display = 'block';
}

function openBrowserFromDesktop(url) {
    openBrowserModal(url);
}
function openDapp(url) { openBrowserModal(url); }
function browserBack() {}
function browserForward() {}
