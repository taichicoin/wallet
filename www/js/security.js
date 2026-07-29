// ========== 应用锁模块 + 主题切换 + 指纹解锁 ==========
const SECURITY_KEYS = {
    enabled: 'app_lock_enabled',
    passwordHash: 'app_lock_pw_hash',
    biometricEnabled: 'biometric_enabled'
};

let securityEnabled = false;
let securityPasswordHash = '';
let biometricEnabled = localStorage.getItem(SECURITY_KEYS.biometricEnabled) === 'true';

// ========== 初始化安全锁 ==========
function initSecurity() {
    const stored = localStorage.getItem(SECURITY_KEYS.enabled);
    securityEnabled = stored === 'true';
    securityPasswordHash = localStorage.getItem(SECURITY_KEYS.passwordHash) || '';
    biometricEnabled = localStorage.getItem(SECURITY_KEYS.biometricEnabled) === 'true';

    if (securityEnabled && securityPasswordHash) {
        document.getElementById('securityOverlay').classList.remove('hidden');
        document.getElementById('securityUnlockPassword').value = '';
        document.getElementById('securityUnlockError').style.display = 'none';
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.fab').style.display = 'none';

        updateUnlockButtonState();
    } else {
        showMainApp();
    }
    syncSecurityUI();
}

// ========== 解锁按钮状态切换 ==========
function updateUnlockButtonState() {
    const passwordInput = document.getElementById('securityUnlockPassword');
    const unlockBtn = document.getElementById('unlockActionBtn');
    if (!passwordInput || !unlockBtn) return;

    if (passwordInput.value.trim().length > 0) {
        // 有输入内容 → 密码解锁
        unlockBtn.textContent = '解锁';
        unlockBtn.onclick = verifySecurityPassword;
        unlockBtn.className = 'btn-primary';
    } else {
        // 无输入内容 → 指纹解锁（如果开启了指纹）
        if (biometricEnabled) {
            unlockBtn.textContent = '🔐 指纹解锁';
            unlockBtn.onclick = startBiometricUnlock;
            unlockBtn.className = 'btn-outline';
        } else {
            unlockBtn.textContent = '解锁';
            unlockBtn.onclick = verifySecurityPassword;
            unlockBtn.className = 'btn-primary';
        }
    }
}

// ========== 密码验证 ==========
function verifySecurityPassword() {
    const input = document.getElementById('securityUnlockPassword').value;
    if (!input) return;
    const hash = ethers.utils.id(input);
    if (hash === securityPasswordHash) {
        showMainApp();
    } else {
        document.getElementById('securityUnlockError').style.display = 'block';
        document.getElementById('securityUnlockError').innerText = '密码错误';
    }
}

// ========== 指纹解锁 ==========
function startBiometricUnlock() {
    if (window.android && typeof window.android.biometricAuth === 'function') {
        window.android.biometricAuth();
    } else {
        showToast('当前设备不支持指纹解锁');
    }
}

// 原生回调结果
window.__onBiometricResult = function(success, errorMsg) {
    if (success) {
        showMainApp();
    } else {
        document.getElementById('securityUnlockError').style.display = 'block';
        document.getElementById('securityUnlockError').innerText = errorMsg || '指纹验证失败';
    }
};

// ========== 显示主界面 ==========
function showMainApp() {
    document.getElementById('securityOverlay').classList.add('hidden');
    document.querySelector('.container').style.display = '';
    document.querySelector('.fab').style.display = '';
    if (typeof startApp === 'function' && !window._walletStarted) {
        startApp();
        window._walletStarted = true;
    }
}

// ========== 设置相关 ==========
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
        document.getElementById('securityNewPassword').value = '';
        document.getElementById('securityConfirmPassword').value = '';
    } else {
        section.style.display = 'none';
    }
}

function enableSecurityPassword() {
    const newPwd = document.getElementById('securityNewPassword').value;
    const confirmPwd = document.getElementById('securityConfirmPassword').value;
    if (!newPwd || newPwd.length < 4) { showToast('密码至少4位'); return; }
    if (newPwd !== confirmPwd) { showToast('两次密码不一致'); return; }

    securityEnabled = true;
    securityPasswordHash = ethers.utils.id(newPwd);
    localStorage.setItem(SECURITY_KEYS.enabled, 'true');
    localStorage.setItem(SECURITY_KEYS.passwordHash, securityPasswordHash);
    document.getElementById('appLockStatus').innerText = '已启用';
    showToast('应用锁已启用');
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    document.getElementById('securityOldPassword').value = '';
    document.getElementById('securityPasswordSection').style.display = 'none';
}

function disableSecurityPassword() {
    const oldPwd = document.getElementById('securityOldPassword').value;
    if (!oldPwd) { showToast('请输入当前密码'); return; }
    if (ethers.utils.id(oldPwd) !== securityPasswordHash) { showToast('密码错误'); return; }
    securityEnabled = false;
    securityPasswordHash = '';
    biometricEnabled = false;
    localStorage.setItem(SECURITY_KEYS.enabled, 'false');
    localStorage.setItem(SECURITY_KEYS.passwordHash, '');
    localStorage.setItem(SECURITY_KEYS.biometricEnabled, 'false');
    document.getElementById('appLockStatus').innerText = '未启用';
    document.getElementById('securityOldPassword').value = '';
    document.getElementById('securityNewPassword').value = '';
    document.getElementById('securityConfirmPassword').value = '';
    document.getElementById('securityPasswordSection').style.display = 'none';
    const bioCheck = document.getElementById('biometricCheck');
    if (bioCheck) bioCheck.checked = false;
    showToast('应用锁已关闭');
}

// ========== 指纹开关（需先验证指纹） ==========
function toggleBiometricEnable(enabled) {
    if (enabled) {
        if (window.android && typeof window.android.biometricAuth === 'function') {
            window.__biometricSetupCallback = function(success) {
                if (success) {
                    biometricEnabled = true;
                    localStorage.setItem(SECURITY_KEYS.biometricEnabled, 'true');
                    showToast('指纹解锁已开启');
                } else {
                    document.getElementById('biometricCheck').checked = false;
                    showToast('指纹验证失败，未开启');
                }
            };
            const originalCallback = window.__onBiometricResult;
            window.__onBiometricResult = function(success, msg) {
                if (window.__biometricSetupCallback) {
                    window.__biometricSetupCallback(success);
                    window.__biometricSetupCallback = null;
                }
                window.__onBiometricResult = originalCallback;
            };
            window.android.biometricAuth();
        } else {
            showToast('当前设备不支持指纹');
            document.getElementById('biometricCheck').checked = false;
        }
    } else {
        biometricEnabled = false;
        localStorage.setItem(SECURITY_KEYS.biometricEnabled, 'false');
        showToast('指纹解锁已关闭');
    }
}

// ========== 同步UI ==========
function syncSecurityUI() {
    const statusEl = document.getElementById('appLockStatus');
    if (statusEl) statusEl.innerText = securityEnabled ? '已启用' : '未启用';
    const section = document.getElementById('securityPasswordSection');
    if (section) section.style.display = 'none';
    const bioCheck = document.getElementById('biometricCheck');
    if (bioCheck) bioCheck.checked = biometricEnabled;
}

// ========== 主题切换 ==========
function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeModeText').innerText = isLight ? '浅色' : '暗黑';
}

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
