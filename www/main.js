// ========== 轻量 scrypt ==========
const SCRYPT_OPTIONS = { scrypt: { N: 16384 } };

// 多链配置（只添加 logo 字段）
const chains = [
    { id: 1, name: "Ethereum", symbol: "ETH", logo: "imagine/eth.jpg", rpcs: ["https://eth.llamarpc.com","https://rpc.ankr.com/eth","https://cloudflare-eth.com"] },
    { id: 56, name: "BNB Chain", symbol: "BNB", logo: "imagine/bnb.jpg", rpcs: ["https://bsc-dataseed.bnbchain.org","https://bsc-dataseed1.bnbchain.org","https://bsc-dataseed2.bnbchain.org","https://bsc-dataseed3.bnbchain.org","https://bsc-dataseed4.bnbchain.org","https://bsc-rpc.publicnode.com","https://rpc.ankr.com/bsc","https://1rpc.io/bnb","https://bsc.api.pocket.network","https://bsc-mainnet.public.blastapi.io","https://bsc-dataseed1.defibit.io","https://bsc-dataseed2.defibit.io","https://bsc-dataseed1.ninicoin.io","https://bsc-dataseed2.ninicoin.io"] },
    { id: 97, name: "BSC Testnet", symbol: "tBNB", logo: "imagine/bnb.jpg", rpcs: ["https://data-seed-prebsc-1-s1.binance.org:8545","https://bsc-testnet.publicnode.com"] },
    { id: 137, name: "Polygon", symbol: "MATIC", logo: "", rpcs: ["https://polygon-rpc.com","https://rpc-mainnet.maticvigil.com"] },
    { id: 42161, name: "Arbitrum One", symbol: "ETH", logo: "", rpcs: ["https://arb1.arbitrum.io/rpc"] },
    { id: 10, name: "Optimism", symbol: "ETH", logo: "", rpcs: ["https://mainnet.optimism.io"] },
    { id: 43114, name: "Avalanche C-Chain", symbol: "AVAX", logo: "", rpcs: ["https://api.avax.network/ext/bc/C/rpc"] }
];

let wallet = null;
let provider = null;
let currentChainId = 1;
let accounts = [];
let pendingUnlockIndex = null;
let lastGoodRpcCache = {};

// ========== Toast 公共函数 ==========
function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ========== 本地账户存储 ==========
function loadAccounts() {
    const stored = localStorage.getItem('mywallet_accounts_enc');
    if (stored) { try { accounts = JSON.parse(stored); } catch(e) { accounts = []; } } else accounts = [];
    updateAccountSelect();
}

function saveAccounts() {
    localStorage.setItem('mywallet_accounts_enc', JSON.stringify(accounts));
    updateAccountSelect();
}

function updateAccountSelect() {
    const select = document.getElementById('accountSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- 选择账户 --</option>';
    accounts.forEach((acc, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.text = `${acc.address.substring(0,8)}... (keystore)`;
        select.appendChild(option);
    });
}

// ========== 账户解锁（支付密码）支持指纹 ==========
function switchAccount() {
    const idx = document.getElementById('accountSelect').value;
    if (idx === '') { wallet = null; updateUI(); return; }
    openUnlockModal(parseInt(idx));
}

function openUnlockModal(index) {
    pendingUnlockIndex = index;
    document.getElementById('unlockPassword').value = '';
    document.getElementById('unlockStatus').style.display = 'none';
    document.getElementById('unlockModal').classList.add('active');
    updatePayUnlockButton();
}

function closeUnlockModal() {
    document.getElementById('unlockModal').classList.remove('active');
    pendingUnlockIndex = null;
}

// 支付密码弹窗按钮状态切换
function updatePayUnlockButton() {
    const passwordInput = document.getElementById('unlockPassword');
    const unlockBtn = document.getElementById('payUnlockActionBtn');
    if (!passwordInput || !unlockBtn) return;

    if (passwordInput.value.trim().length > 0) {
        unlockBtn.textContent = '解锁';
        unlockBtn.onclick = executeUnlock;
        unlockBtn.className = 'btn-primary';
    } else {
        const bioEnabled = localStorage.getItem('biometric_enabled') === 'true';
        if (bioEnabled) {
            unlockBtn.textContent = '🔐 指纹解锁';
            unlockBtn.onclick = startPayBiometric;
            unlockBtn.className = 'btn-outline';
        } else {
            unlockBtn.textContent = '解锁';
            unlockBtn.onclick = executeUnlock;
            unlockBtn.className = 'btn-primary';
        }
    }
}

// 支付指纹验证
function startPayBiometric() {
    if (!window.android || typeof window.android.biometricAuth !== 'function') {
        showToast('当前设备不支持指纹解锁');
        return;
    }
    // 保存原始回调
    const originalCallback = window.__onBiometricResult;
    window.__biometricContext = 'pay';
    // 替换全局回调
    window.__onBiometricResult = function(success, errorMsg) {
        if (window.__biometricContext === 'pay') {
            if (success) {
                const savedPwd = localStorage.getItem('wallet_pay_pwd');
                if (savedPwd) {
                    document.getElementById('unlockPassword').value = savedPwd;
                    window.__biometricContext = null;
                    window.__onBiometricResult = originalCallback;
                    executeUnlock();
                } else {
                    document.getElementById('unlockStatus').style.display = 'block';
                    document.getElementById('unlockStatus').className = 'tx-status error';
                    document.getElementById('unlockStatus').innerText = '未找到保存的密码，请先手动输入一次';
                    window.__biometricContext = null;
                    window.__onBiometricResult = originalCallback;
                }
            } else {
                document.getElementById('unlockStatus').style.display = 'block';
                document.getElementById('unlockStatus').className = 'tx-status error';
                document.getElementById('unlockStatus').innerText = errorMsg || '指纹验证失败';
                window.__biometricContext = null;
                window.__onBiometricResult = originalCallback;
            }
        }
    };
    window.android.biometricAuth();
}

async function executeUnlock() {
    const statusEl = document.getElementById('unlockStatus');
    const password = document.getElementById('unlockPassword').value;
    if (!password) {
        statusEl.style.display = 'block';
        statusEl.className = 'tx-status error';
        statusEl.innerText = '请输入密码';
        return;
    }
    showToast('正在解锁...', 2000);
    const acc = accounts[pendingUnlockIndex];
    try {
        wallet = await ethers.Wallet.fromEncryptedJson(acc.keystore, password);
        if (provider) wallet = wallet.connect(provider);
        updateUI();
        loadBalances();
        closeUnlockModal();
        showToast('解锁成功');
        // 保存支付密码（明文，未来可升级加密存储）
        if (localStorage.getItem('biometric_enabled') === 'true') {
            localStorage.setItem('wallet_pay_pwd', password);
        }
    } catch (e) {
        statusEl.style.display = 'block';
        statusEl.className = 'tx-status error';
        statusEl.innerText = '密码错误或数据损坏';
    }
}

// ========== 导入钱包 ==========
async function importWallet() {
    showToast('正在加密...', 3000);
    const input = document.getElementById('secretInput').value.trim();
    const pwd = document.getElementById('encryptPassword').value;
    const confirm = document.getElementById('encryptPasswordConfirm').value;
    if (!input) return showToast('请输入助记词或私钥');
    if (!pwd || pwd.length < 6) return showToast('密码至少6位');
    if (pwd !== confirm) return showToast('两次密码不一致');

    let temp;
    try { temp = input.startsWith('0x') && input.length === 66 ? new ethers.Wallet(input) : ethers.Wallet.fromMnemonic(input); }
    catch (e) { return showToast('无效的助记词或私钥'); }
    if (accounts.some(a => a.address.toLowerCase() === temp.address.toLowerCase())) return showToast('地址已存在');

    try {
        const keystoreJson = await temp.encrypt(pwd, SCRYPT_OPTIONS);
        accounts.push({ address: temp.address, keystore: keystoreJson, type: 'keystore' });
        saveAccounts();
        ['secretInput','encryptPassword','encryptPasswordConfirm'].forEach(id => document.getElementById(id).value = '');
        const newIndex = accounts.length - 1;
        document.getElementById('accountSelect').value = newIndex;
        showToast('导入成功，请解锁');
        openUnlockModal(newIndex);
    } catch (e) { showToast('加密失败: ' + e.message); }
}

function deleteAccount() {
    const idx = document.getElementById('accountSelect').value;
    if (idx === '') return;
    if (!confirm('确定删除该账户？')) return;
    accounts.splice(parseInt(idx), 1);
    saveAccounts();
    wallet = null;
    updateUI();
    if (accounts.length > 0) { document.getElementById('accountSelect').value = 0; switchAccount(); }
    showToast('账户已删除');
}

// ========== 网络 ==========
async function connectToChain(chain) {
    const rpcList = chain.rpcs.slice();
    const cached = lastGoodRpcCache[chain.id];
    if (cached !== undefined) rpcList.unshift(rpcList.splice(cached, 1)[0]);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), 12000));
    const races = rpcList.map(rpc => new Promise(async resolve => {
        try {
            const prov = new ethers.providers.JsonRpcProvider({ url: rpc, timeout: 5000 }, { chainId: chain.id, name: chain.name });
            await prov.getBlockNumber();
            lastGoodRpcCache[chain.id] = chain.rpcs.indexOf(rpc);
            resolve(prov);
        } catch (e) {}
    }));
    try { return await Promise.race([...races, timeout]); } catch (e) { throw new Error('所有节点不可用'); }
}

async function switchChain(chainId) {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;
    showToast('切换网络中...', 2000);
    try {
        provider = await connectToChain(chain);
        currentChainId = chain.id;
        if (wallet) wallet = wallet.connect(provider);
        updateNetworkUI();
        loadBalances();
        closeNetworkModal();
        showToast('网络已连接', 1500);
        if (window.android && window.android.updateChainId) {
            window.android.updateChainId(chain.id);
        }
    } catch(e) { showToast('连接失败'); }
}

// ========== 余额 ==========
async function loadBalances() {
    if (!wallet || !provider) return;
    const chain = chains.find(c => c.id === currentChainId);
    let mainDisplay = '0';
    try {
        const raw = await provider.getBalance(wallet.address);
        mainDisplay = formatBalance(raw);
        document.getElementById('totalBalance').innerText = `${mainDisplay} ${chain.symbol}`;
        document.getElementById('fiatValue').innerText = '$0.00 USD';
    } catch(e) { document.getElementById('totalBalance').innerText = '--'; }

    if (typeof renderTokenList === 'function') {
        const tokenResults = typeof getCustomTokenBalances === 'function' ? await getCustomTokenBalances() : [];
        renderTokenList(chain.symbol, mainDisplay, tokenResults);
    }
}

function formatBalance(rawBalance, decimals = 18) {
    if (!rawBalance || rawBalance === '0' || ethers.BigNumber.from(rawBalance).isZero()) return '0';
    const str = ethers.utils.formatUnits(rawBalance, decimals);
    const parts = str.split('.');
    if (parts.length === 1) return str;
    let zeros = 0;
    for (const c of parts[1]) { if (c === '0') zeros++; else break; }
    if (zeros >= 7) return '0';
    const num = parseFloat(str);
    return num === 0 ? '0' : num.toFixed(6).replace(/\.?0+$/, '');
}

// ========== UI ==========
function updateUI() {
    const el = document.getElementById('topAddress');
    if (el) el.innerText = wallet ? wallet.address.substring(0,6)+'...'+wallet.address.slice(-4) : '未导入';
    updateNetworkUI();
}

function updateNetworkUI() {
    const chain = chains.find(c => c.id === currentChainId);
    if (!chain) return;
    document.getElementById('topNetwork').innerText = chain.name;
    const logoImg = document.getElementById('networkLogo');
    if (logoImg) {
        if (chain.logo) {
            logoImg.src = chain.logo;
            logoImg.style.display = 'block';
        } else {
            logoImg.style.display = 'none';
        }
    }
    renderChainList();
}

function openNetworkModal() { document.getElementById('networkModal').classList.add('active'); renderChainList(); }
function closeNetworkModal() { document.getElementById('networkModal').classList.remove('active'); }

function renderChainList() {
    const container = document.getElementById('chainListContainer');
    if (!container) return;
    container.innerHTML = chains.map(c => {
        const iconHtml = c.logo
            ? `<img src="${c.logo}" class="chain-icon" style="object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
            : '';
        const fallbackHtml = c.logo
            ? `<div class="chain-icon" style="display:none; background:#333; align-items:center; justify-content:center;">${c.symbol[0]}</div>`
            : `<div class="chain-icon" style="background:#333; display:flex; align-items:center; justify-content:center;">${c.symbol[0]}</div>`;
        return `
            <div class="chain-list-item ${c.id === currentChainId ? 'active' : ''}" onclick="switchChain(${c.id})">
                ${iconHtml}${fallbackHtml}
                <div>
                    <div class="chain-name">${c.name}</div>
                    <div class="chain-symbol">${c.symbol}</div>
                </div>
                ${c.id === currentChainId ? '<span style="margin-left:auto;color:var(--green);">✔</span>' : ''}
            </div>`;
    }).join('');
}

// ========== 发送 ==========
function openSendModal() {
    if (!wallet) return showToast('请先解锁');
    document.getElementById('sendModal').classList.add('active');
}
function closeSendModal() { document.getElementById('sendModal').classList.remove('active'); }

async function executeSend() {
    const status = document.getElementById('sendStatus');
    status.style.display = 'block'; status.className = 'tx-status pending'; status.innerText = '检查输入...';
    if (!wallet || !provider) { status.className = 'tx-status error'; status.innerText = '钱包未连接'; return; }
    const to = document.getElementById('sendTo').value.trim();
    const amt = document.getElementById('sendAmount').value.trim();
    if (!ethers.utils.isAddress(to)) { status.className = 'tx-status error'; status.innerText = '无效地址'; return; }
    if (!amt || isNaN(amt) || Number(amt) <= 0) { status.className = 'tx-status error'; status.innerText = '金额无效'; return; }
    if (wallet.provider !== provider) wallet = wallet.connect(provider);
    try {
        status.innerText = '发送中...';
        const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(amt) });
        status.className = 'tx-status success'; status.innerText = '成功！\n' + tx.hash;
        setTimeout(() => loadBalances(), 2000);
    } catch (e) { status.className = 'tx-status error'; status.innerText = '失败: ' + (e.reason || e.message); }
}

function showReceiveModal() { if (wallet) showToast(wallet.address, 4000); else showToast('请先解锁'); }

// ========== 启动 ==========
function startApp() {
    loadAccounts();
    switchChain(1);
    ['networkModal','sendModal','unlockModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
    });
}

// ========== DApp 钱包桥接（原生浏览器调用） ==========
window.__walletAPI = {
    getChainId: () => {
        return currentChainId.toString();
    },
    handle: function(method, paramsJson, callbackId) {
        const params = JSON.parse(paramsJson);
        const respond = (error, result) => {
            if (window.android && window.android.returnResult) {
                window.android.returnResult(callbackId, JSON.stringify(error), JSON.stringify(result));
            }
        };

        (async () => {
            try {
                if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                    if (!wallet) throw new Error('钱包未解锁');
                    respond(null, [wallet.address]);
                } else if (method === 'eth_chainId') {
                    respond(null, '0x' + currentChainId.toString(16));
                } else if (method === 'eth_sendTransaction') {
                    if (!wallet) throw new Error('钱包未解锁');
                    const tx = await wallet.sendTransaction(params[0]);
                    respond(null, tx.hash);
                } else if (method === 'eth_signTransaction') {
                    if (!wallet) throw new Error('钱包未解锁');
                    const signedTx = await wallet.signTransaction(params[0]);
                    respond(null, signedTx);
                } else if (method === 'personal_sign') {
                    if (!wallet) throw new Error('钱包未解锁');
                    const sig = await wallet.signMessage(params[0]);
                    respond(null, sig);
                } else if (method === 'eth_sign') {
                    if (!wallet) throw new Error('钱包未解锁');
                    const sig = await wallet.signMessage(ethers.utils.arrayify(params[1]));
                    respond(null, sig);
                } else if (method === 'wallet_switchEthereumChain') {
                    const chainId = parseInt(params[0].chainId);
                    await switchChain(chainId);
                    respond(null, null);
                } else if (method === 'wallet_addEthereumChain') {
                    respond(null, null);
                } else {
                    throw new Error('不支持的方法: ' + method);
                }
            } catch (e) {
                respond(e.message || '未知错误', null);
            }
        })();
    }
};
