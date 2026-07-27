// ========== 应用锁模块 + 主题切换 ==========
const SECURITY_KEYS = {
    enabled: 'app_lock_enabled',
    passwordHash: 'app_lock_pw_hash'
};

let securityEnabled = false;
let securityPasswordHash = '';

// 初始化安全锁
function initSecurity() {
    const stored = localStorage.getItem(SECURITY_KEYS.enabled);
    securityEnabled = stored === 'true';
    securityPasswordHash = localStorage.getItem(SECURITY_KEYS.passwordHash) || '';

    if (securityEnabled && securityPasswordHash) {
        document.getElementById('securityOverlay').classList.remove('hidden');
        document.getElementById('securityUnlockPassword').value = '';
        document.getElementById('securityUnlockError').style.display = 'none';
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.fab').style.display = 'none';
    } else {
        showMainApp();
    }
    syncSecurityUI();
}

// 验证解锁
function verifySecurityPassword() {
    const input = document.getElementById('securityUnlockPassword').value;
    if (!input) return;
    const hash = ethers.utils.id(input);
    if (hash === securityPasswordHash) {
        showMainApp();
    } else {
        document.getElementById('securityUnlockError').style.display = 'block';
    }
}

function showMainApp() {
    document.getElementById('securityOverlay').classList.add('hidden');
    document.querySelector('.container').style.display = '';
    document.querySelector('.fab').style.display = '';
    if (typeof startApp === 'function' && !window._walletStarted) {
        startApp();
        window._walletStarted = true;
    }
}

// 打开设置页面
function openSettings() {
    const sec = document.getElementById('importSection');
    sec.style.display = 'block';
    // 滚动到通用设置部分
    const target = sec.querySelector('h4:nth-of-type(3)');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    syncSecurityUI();
}

// 展开/收起应用锁密码区域
function toggleSecuritySettings() {
    const section = document.getElementById('securityPasswordSection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        if (securityPasswordHash) {
            document.getElementById('securityOldPassword').placeholder = '当前密码（必填）';
        } else {
            document.getElementById('securityOldPassword').placeholder = '首次设置无需旧密码';
            document.getElementById('securityOldPassword').value = '';
        }
        // 清空新密码框
        document.getElementById('securityNewPassword').value = '';
        document.getElementById('securityConfirmPassword').value = '';
    } else {
        section.style.display = 'none';
    }
}

// 启用/修改密码
function enableSecurityPassword() {
    const newPwd = document.getElementById('securityNewPassword').value;
    const confirmPwd = document.getElementById('securityConfirmPassword').value;
    if (!newPwd || newPwd.length < 4) {
        showToast('密码至少4位');
        return;
    }
    if (newPwd !== confirmPwd) {
        showToast('两次密码不一致');
        return;
    }

    securityEnabled = true;
    securityPasswordHash = ethers.utils.id(newPwd);
    localStorage.setItem(SECURITY_KEYS.enabled, 'true');
    localStorage.setItem(SECURITY_KEYS.passwordHash, securityPasswordHash);
    document.getElementById('securityEnableCheck')?.setAttribute('checked', 'checked');
    document.getElementById('appLockStatus').innerText = '已启用';
    showToast('应用锁已启用');
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    document.getElementById('securityOldPassword').value = '';
    // 收起密码区域
    document.getElementById('securityPasswordSection').style.display = 'none';
}

// 关闭应用锁
function disableSecurityPassword() {
    const oldPwd = document.getElementById('securityOldPassword').value;
    if (!oldPwd) {
        showToast('请输入当前密码');
        return;
    }
    if (ethers.utils.id(oldPwd) !== securityPasswordHash) {
        showToast('密码错误');
        return;
    }
    securityEnabled = false;
    securityPasswordHash = '';
    localStorage.setItem(SECURITY_KEYS.enabled, 'false');
    localStorage.setItem(SECURITY_KEYS.passwordHash, '');
    document.getElementById('securityEnableCheck')?.removeAttribute('checked');
    document.getElementById('appLockStatus').innerText = '未启用';
    document.getElementById('securityOldPassword').value = '';
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    document.getElementById('securityPasswordSection').style.display = 'none';
    showToast('应用锁已关闭');
}

// 同步UI状态
function syncSecurityUI() {
    const statusEl = document.getElementById('appLockStatus');
    if (statusEl) statusEl.innerText = securityEnabled ? '已启用' : '未启用';
    const section = document.getElementById('securityPasswordSection');
    if (section) section.style.display = 'none'; // 默认隐藏密码区
}

// ========== 主题切换 ==========
function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeModeText').innerText = isLight ? '浅色' : '暗黑';
}

// 备用的showToast
if (typeof showToast !== 'function') {
    window.showToast = function(msg, duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.innerText = msg;
        toast.style.display = 'block';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, duration);
    };
}
