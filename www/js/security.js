// ========== 应用锁模块 ==========
const SECURITY_KEYS = {
    enabled: 'app_lock_enabled',
    passwordHash: 'app_lock_pw_hash'
};

let securityEnabled = false;
let securityPasswordHash = '';

// 初始化：检查是否需要显示锁屏
function initSecurity() {
    const stored = localStorage.getItem(SECURITY_KEYS.enabled);
    securityEnabled = stored === 'true';
    securityPasswordHash = localStorage.getItem(SECURITY_KEYS.passwordHash) || '';

    if (securityEnabled && securityPasswordHash) {
        // 启用且密码存在，显示锁屏
        document.getElementById('securityOverlay').classList.remove('hidden');
        document.getElementById('securityUnlockPassword').value = '';
        document.getElementById('securityUnlockError').style.display = 'none';
        // 隐藏主界面
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.fab').style.display = 'none';
    } else {
        // 未启用或密码不存在，直接进入主界面
        showMainApp();
    }
    // 同步设置界面（安全设置中的复选框状态等）
    syncSecurityUI();
}

// 验证应用密码并解锁
function verifySecurityPassword() {
    const input = document.getElementById('securityUnlockPassword').value;
    if (!input) return;
    if (typeof ethers === 'undefined') {
        alert('库未加载');
        return;
    }
    const hash = ethers.utils.id(input);
    if (hash === securityPasswordHash) {
        showMainApp();
    } else {
        document.getElementById('securityUnlockError').style.display = 'block';
    }
}

// 隐藏锁屏，显示主应用并启动钱包功能
function showMainApp() {
    document.getElementById('securityOverlay').classList.add('hidden');
    document.querySelector('.container').style.display = '';
    document.querySelector('.fab').style.display = '';
    if (typeof startApp === 'function' && !window._walletStarted) {
        startApp();
        window._walletStarted = true;
    }
}

// 打开设置（显示导入区域并滚动到安全设置）
function openSettings() {
    const sec = document.getElementById('importSection');
    sec.style.display = 'block';
    // 稍微滚动到安全设置区域
    const securityTitle = sec.querySelector('h4:nth-of-type(3)'); // 第三个 h4 是安全设置
    if (securityTitle) {
        securityTitle.scrollIntoView({ behavior: 'smooth' });
    }
    // 同步安全 UI
    syncSecurityUI();
}

// 设置页面：启用/修改密码
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
    document.getElementById('securityEnableCheck').checked = true;
    document.getElementById('securityPasswordSection').style.display = 'block';
    showToast('安全锁已启用');
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    document.getElementById('securityOldPassword').value = '';
}

// 关闭应用锁（需验证旧密码）
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
    document.getElementById('securityEnableCheck').checked = false;
    document.getElementById('securityPasswordSection').style.display = 'none';
    document.getElementById('securityOldPassword').value = '';
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    showToast('安全锁已关闭');
}

// 复选框切换
function toggleSecurityEnable(enabled) {
    const pwdSection = document.getElementById('securityPasswordSection');
    if (enabled) {
        pwdSection.style.display = 'block';
        if (securityPasswordHash) {
            document.getElementById('securityOldPassword').placeholder = '当前密码（必填）';
        } else {
            document.getElementById('securityOldPassword').placeholder = '首次设置无需旧密码';
        }
    } else {
        // 关闭时，如果已经有密码，需要先验证旧密码
        if (securityPasswordHash) {
            pwdSection.style.display = 'block';
            showToast('请先验证当前密码后再关闭');
            document.getElementById('securityOldPassword').placeholder = '当前密码（必填）';
        } else {
            pwdSection.style.display = 'none';
            securityEnabled = false;
            localStorage.setItem(SECURITY_KEYS.enabled, 'false');
        }
    }
}

// 同步设置界面
function syncSecurityUI() {
    const checkbox = document.getElementById('securityEnableCheck');
    const pwdSection = document.getElementById('securityPasswordSection');
    if (checkbox) checkbox.checked = securityEnabled;
    if (pwdSection) {
        pwdSection.style.display = securityEnabled ? 'block' : 'none';
        if (securityEnabled && securityPasswordHash) {
            document.getElementById('securityOldPassword').placeholder = '当前密码（修改/关闭时必填）';
        }
    }
}

// 确保 showToast 存在
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
