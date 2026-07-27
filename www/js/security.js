// ========== 应用安全锁模块 ==========
const SECURITY_KEYS = {
    enabled: 'app_lock_enabled',
    passwordHash: 'app_lock_pw_hash'
};

let securityEnabled = false;
let securityPasswordHash = '';

// 初始化：检查是否启用安全锁
function initSecurity() {
    const stored = localStorage.getItem(SECURITY_KEYS.enabled);
    securityEnabled = stored === 'true';
    securityPasswordHash = localStorage.getItem(SECURITY_KEYS.passwordHash) || '';

    if (securityEnabled && securityPasswordHash) {
        showSecurityUnlock();
    } else {
        showMainApp();
    }
}

// 显示启动验证弹窗
function showSecurityUnlock() {
    document.getElementById('securityOverlay').classList.add('active');
    document.getElementById('securityUnlockPassword').value = '';
    document.getElementById('securityUnlockError').style.display = 'none';
}

// 隐藏启动验证，显示主应用
function showMainApp() {
    document.getElementById('securityOverlay').classList.remove('active');
    document.querySelector('.container').style.display = '';
    document.querySelector('.fab').style.display = '';
}

// 验证密码并进入
function verifySecurityPassword() {
    const input = document.getElementById('securityUnlockPassword').value;
    if (!input) return;

    const hash = ethers.utils.id(input); // keccak256 简单哈希
    if (hash === securityPasswordHash) {
        showMainApp();
    } else {
        document.getElementById('securityUnlockError').style.display = 'block';
    }
}

// ========== 设置页面功能 ==========
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
    showToast('安全锁已启用');
    // 清空输入
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
}

function disableSecurityPassword() {
    // 需要输入旧密码确认
    const oldPwd = document.getElementById('securityOldPassword').value;
    if (!oldPwd) { showToast('请输入当前密码'); return; }
    if (ethers.utils.id(oldPwd) !== securityPasswordHash) {
        showToast('密码错误');
        return;
    }
    securityEnabled = false;
    securityPasswordHash = '';
    localStorage.setItem(SECURITY_KEYS.enabled, 'false');
    localStorage.setItem(SECURITY_KEYS.passwordHash, '');
    document.getElementById('securityEnableCheck').checked = false;
    document.getElementById('securityOldPassword').value = '';
    showToast('安全锁已关闭');
}

function changeSecurityPassword() {
    const oldPwd = document.getElementById('securityOldPassword').value;
    const newPwd = document.getElementById('securityNewPassword').value;
    const confirmPwd = document.getElementById('securityConfirmPassword').value;
    if (!oldPwd) { showToast('请输入当前密码'); return; }
    if (ethers.utils.id(oldPwd) !== securityPasswordHash) {
        showToast('旧密码错误');
        return;
    }
    if (!newPwd || newPwd.length < 4) {
        showToast('新密码至少4位');
        return;
    }
    if (newPwd !== confirmPwd) {
        showToast('两次密码不一致');
        return;
    }
    securityPasswordHash = ethers.utils.id(newPwd);
    localStorage.setItem(SECURITY_KEYS.passwordHash, securityPasswordHash);
    showToast('密码修改成功');
    document.getElementById('securityOldPassword').value = '';
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
}

// 设置页面开关状态同步
function syncSecurityUI() {
    const checkbox = document.getElementById('securityEnableCheck');
    if (checkbox) checkbox.checked = securityEnabled;
    // 显示/隐藏密码输入区域
    const pwdSection = document.getElementById('securityPasswordSection');
    if (pwdSection) pwdSection.style.display = securityEnabled ? 'block' : 'none';
}

// 覆盖原来的 showToast（如果 main.js 中有定义，就用 main.js 的，否则自己定义）
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
