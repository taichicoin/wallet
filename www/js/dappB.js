// ========== DApp 浏览器（地址栏底部精确定位 + 钱包状态提示） ==========
function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }

    if (!url) {
        // 桌面模式
        modal.classList.remove('is-dapp-mode');
        showDesktopView();
        return;
    }

    // ===== 关键检查：钱包是否解锁 =====
    if (typeof wallet === 'undefined' || !wallet) {
        // 显示 Toast 提示，但仍然允许打开 DApp（用户可之后解锁）
        if (typeof showToast === 'function') {
            showToast('⚠️ 钱包未解锁，DApp 将无法连接', 2500);
        }
    }

    // DApp 模式：激活状态，彻底隐藏底部占位
    modal.classList.add('is-dapp-mode');
    hideDesktopView();

    // 计算地址栏底部坐标 + WebView 精确高度
    const toolbar = document.querySelector('#browserModal .browser-toolbar');
    if (!toolbar) {
        if (typeof showToast === 'function') showToast('找不到地址栏');
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
    } else {
        if (typeof showToast === 'function') showToast('原生浏览器不可用');
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

    // 更新钱包连接状态指示器
    updateWalletStatus();
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

// ========== 钱包状态指示器（桌面视图底部） ==========
function updateWalletStatus() {
    const container = document.getElementById('desktopView');
    if (!container) return;

    // 移除旧指示器
    const old = document.getElementById('walletIndicator');
    if (old) old.remove();

    const div = document.createElement('div');
    div.id = 'walletIndicator';
    div.style.cssText = 'width:100%; padding:10px 0; margin-top:10px; text-align:center; border-top:1px solid var(--border);';

    if (typeof wallet !== 'undefined' && wallet) {
        const short = wallet.address.substring(0,6) + '...' + wallet.address.slice(-4);
        div.innerHTML = `<span style="color:var(--sub); font-size:13px;">已连接钱包：</span><span style="font-size:14px;">${short}</span>`;
    } else {
        // 显示解锁按钮
        div.innerHTML = `<span style="color:var(--danger); font-size:13px;">⚠️ 钱包未解锁，无法连接 DApp</span>
            <button class="btn-outline" onclick="unlockWalletFromDapp()" style="margin-top:8px;width:auto;padding:6px 16px;display:inline-block;">🔓 立即解锁</button>`;
    }

    container.appendChild(div);
}

// 新增：从 DApp 界面直接触发钱包解锁
function unlockWalletFromDapp() {
    // 检查是否有已导入的账户
    if (typeof accounts === 'undefined' || !accounts || accounts.length === 0) {
        if (typeof showToast === 'function') {
            showToast('请先在设置中导入钱包');
        }
        return;
    }

    // 获取账户选择下拉框中第一个有效的账户索引
    const select = document.getElementById('accountSelect');
    let idx = 0;
    if (select && select.selectedIndex > 0) {
        idx = parseInt(select.value);
    } else {
        idx = 0; // 默认第一个账户
    }

    // 打开解锁弹窗（该函数在 main.js 中定义，全局可用）
    if (typeof openUnlockModal === 'function') {
        openUnlockModal(idx);
    } else {
        if (typeof showToast === 'function') {
            showToast('解锁功能暂不可用');
        }
    }
}
