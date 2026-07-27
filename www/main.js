// ========== 轻量 scrypt ==========
const SCRYPT_OPTIONS = { scrypt: { N: 16384 } };

// 自定义 Toast
function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return console.warn('toast missing');
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function customConfirm(msg, callback) {
    const result = window.confirm(msg);
    if (typeof result === 'boolean') callback(result);
    else { showToast('确认操作被阻止，视为取消', 2000); callback(false); }
}

// 多链配置
const chains = [
    { id: 1, name: "Ethereum", symbol: "ETH", rpcs: ["https://eth.llamarpc.com","https://rpc.ankr.com/eth","https://cloudflare-eth.com"] },
    { id: 56, name: "BNB Chain", symbol: "BNB", rpcs: ["https://bsc-dataseed.bnbchain.org","https://bsc-dataseed1.bnbchain.org","https://bsc-dataseed2.bnbchain.org","https://bsc-dataseed3.bnbchain.org","https://bsc-dataseed4.bnbchain.org","https://bsc-rpc.publicnode.com","https://rpc.ankr.com/bsc","https://1rpc.io/bnb","https://bsc.api.pocket.network","https://bsc-mainnet.public.blastapi.io","https://bsc-dataseed1.defibit.io","https://bsc-dataseed2.defibit.io","https://bsc-dataseed1.ninicoin.io","https://bsc-dataseed2.ninicoin.io"] },
    { id: 97, name: "BSC Testnet", symbol: "tBNB", rpcs: ["https://data-seed-prebsc-1-s1.binance.org:8545","https://data-seed-prebsc-2-s1.binance.org:8545","https://bsc-testnet.publicnode.com"] },
    { id: 137, name: "Polygon", symbol: "MATIC", rpcs: ["https://polygon-rpc.com","https://rpc-mainnet.maticvigil.com"] },
    { id: 42161, name: "Arbitrum One", symbol: "ETH", rpcs: ["https://arb1.arbitrum.io/rpc"] },
    { id: 10, name: "Optimism", symbol: "ETH", rpcs: ["https://mainnet.optimism.io"] },
    { id: 43114, name: "Avalanche C-Chain", symbol: "AVAX", rpcs: ["https://api.avax.network/ext/bc/C/rpc"] }
];

// 标准 ERC-20 ABI（仅 balanceOf + decimals + symbol）
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

let wallet = null;
let provider = null;
let currentChainId = 1;
let accounts = [];
let pendingUnlockIndex = null;
let lastGoodRpcCache = {};

// 手动导入的代币列表（按链ID存储）
let customTokens = JSON.parse(localStorage.getItem('customTokens') || '{}');
if (!customTokens[currentChainId]) customTokens[currentChainId] = [];

// ========== 本地存储 ==========
function loadAccounts() {
    const stored = localStorage.getItem('mywallet_accounts_enc');
    if (stored) {
        try { accounts = JSON.parse(stored); } catch(e) { accounts = []; }
    } else accounts = [];
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

// ========== 账户解锁/切换 ==========
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
}

function closeUnlockModal() {
    document.getElementById('unlockModal').classList.remove('active');
    pendingUnlockIndex = null;
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
        const decryptedWallet = await ethers.Wallet.fromEncryptedJson(acc.keystore, password);
        wallet = decryptedWallet;
        if (provider) wallet = wallet.connect(provider);
        updateUI();
        loadBalances();
        closeUnlockModal();
        showToast('解锁成功');
    } catch (e) {
        statusEl.style.display = 'block';
        statusEl.className = 'tx-status error';
        statusEl.innerText = '密码错误或数据损坏';
    }
}

// ========== 导入钱包 ==========
async function importWallet() {
    showToast('正在加密钱包...', 3000);
    const input = document.getElementById('secretInput').value.trim();
    const password = document.getElementById('encryptPassword').value;
    const confirm = document.getElementById('encryptPasswordConfirm').value;
    if (!input) { showToast('请输入助记词或私钥'); return; }
    if (!password || password.length < 6) { showToast('密码至少6位'); return; }
    if (password !== confirm) { showToast('两次密码不一致'); return; }

    let tempWallet;
    try {
        if (input.startsWith('0x') && input.length === 66) tempWallet = new ethers.Wallet(input);
        else tempWallet = ethers.Wallet.fromMnemonic(input);
    } catch (e) { showToast('无效的助记词或私钥'); return; }

    if (accounts.some(acc => acc.address.toLowerCase() === tempWallet.address.toLowerCase())) {
        showToast('该地址已存在，无法重复导入'); return;
    }
    try {
        const keystoreJson = await tempWallet.encrypt(password, SCRYPT_OPTIONS);
        accounts.push({ address: tempWallet.address, keystore: keystoreJson, type: 'keystore' });
        saveAccounts();
        document.getElementById('secretInput').value = '';
        document.getElementById('encryptPassword').value = '';
        document.getElementById('encryptPasswordConfirm').value = '';
        const newIndex = accounts.length - 1;
        document.getElementById('accountSelect').value = newIndex;
        showToast('钱包加密完成，请解锁使用');
        openUnlockModal(newIndex);
    } catch (e) {
        showToast('加密失败: ' + (e.reason || e.message));
    }
}

function deleteAccount() {
    const idx = document.getElementById('accountSelect').value;
    if (idx === '') return;
    customConfirm('确定删除该账户？', (confirmed) => {
        if (!confirmed) return;
        accounts.splice(parseInt(idx), 1);
        saveAccounts();
        wallet = null;
        updateUI();
        if (accounts.length > 0) {
            document.getElementById('accountSelect').value = 0;
            switchAccount();
        }
        showToast('账户已删除');
    });
}

// ========== 网络连接 ==========
async function connectToChain(chain) {
    const rpcList = chain.rpcs.slice();
    const cachedIndex = lastGoodRpcCache[chain.id];
    if (cachedIndex !== undefined && cachedIndex < rpcList.length) {
        const goodRpc = rpcList.splice(cachedIndex, 1)[0];
        rpcList.unshift(goodRpc);
    }
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), 12000));
    const racePromises = rpcList.map(rpc => {
        return new Promise(async (resolve) => {
            try {
                const prov = new ethers.providers.JsonRpcProvider(
                    { url: rpc, timeout: 5000 },
                    { chainId: chain.id, name: chain.name }
                );
                await prov.getBlockNumber();
                const originalIndex = chain.rpcs.indexOf(rpc);
                lastGoodRpcCache[chain.id] = originalIndex;
                resolve(prov);
            } catch (e) {}
        });
    });
    try {
        const winner = await Promise.race([...racePromises, timeout]);
        if (winner) return winner;
        throw new Error('连接失败');
    } catch (e) {
        delete lastGoodRpcCache[chain.id];
        throw e;
    }
}

async function switchChain(chainId) {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;
    showToast('正在连接网络...', 2000);
    try {
        provider = await connectToChain(chain);
        currentChainId = chain.id;
        if (wallet) wallet = wallet.connect(provider);
        updateNetworkUI();
        loadBalances();
        closeNetworkModal();
        showToast('网络已连接', 1500);
    } catch(e) {
        showToast('连接失败: ' + chain.name + ' 所有节点暂时不可用');
    }
}

// ========== 格式化余额（统一规则） ==========
function formatBalance(rawBalance, decimals = 18) {
    if (!rawBalance || rawBalance === '0' || ethers.BigNumber.from(rawBalance).isZero()) return '0';
    const balanceStr = ethers.utils.formatUnits(rawBalance, decimals);
    const parts = balanceStr.split('.');
    if (parts.length === 1) return balanceStr;
    const decimalPart = parts[1];
    let zeroCount = 0;
    for (const ch of decimalPart) {
        if (ch === '0') zeroCount++;
        else break;
    }
    if (zeroCount >= 7) return '0';
    const num = parseFloat(balanceStr);
    if (num === 0) return '0';
    return num.toFixed(6).replace(/\.?0+$/, '');
}

// ========== 加载余额（主网币 + 手动代币） ==========
async function loadBalances() {
    if (!wallet || !provider) return;
    const chain = chains.find(c => c.id === currentChainId);
    if (!chain) return;

    // 主网币余额
    let mainDisplay = '0';
    try {
        const mainBalanceRaw = await provider.getBalance(wallet.address);
        mainDisplay = formatBalance(mainBalanceRaw);
        document.getElementById('totalBalance').innerText = `${mainDisplay} ${chain.symbol}`;
        document.getElementById('fiatValue').innerText = `$0.00 USD`;
    } catch(e) {
        document.getElementById('totalBalance').innerText = '--';
    }

    // 查询手动添加的代币余额
    const tokenResults = [];
    const tokenList = customTokens[currentChainId] || [];
    for (const token of tokenList) {
        try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const [balance, decimals, symbol] = await Promise.all([
                contract.balanceOf(wallet.address),
                contract.decimals(),
                contract.symbol()
            ]);
            const display = formatBalance(balance, decimals);
            tokenResults.push({
                address: token.address,
                symbol: symbol || 'TOKEN',
                decimals: decimals || 18,
                displayBalance: display,
                rawBalance: balance
            });
        } catch (e) {
            console.warn('代币查询失败', token.address, e.message);
            // 如果失败，仍然显示占位符
            tokenResults.push({
                address: token.address,
                symbol: '?',
                decimals: 18,
                displayBalance: '查询失败'
            });
        }
    }

    renderTokenList(chain.symbol, mainDisplay, tokenResults);
}

function renderTokenList(mainSymbol, mainBalanceDisplay, tokens) {
    const container = document.getElementById('tokenList');
    if (!container) return;
    let html = `
        <div class="token-item">
            <div class="token-info">
                <div class="token-icon">🔷</div>
                <div>
                    <div class="token-name">${mainSymbol}</div>
                    <div class="token-symbol">主网币</div>
                </div>
            </div>
            <div class="token-balance">
                <div class="amount">${mainBalanceDisplay}</div>
                <div class="fiat">$0.00</div>
            </div>
        </div>
    `;
    tokens.forEach(token => {
        const iconLetter = (token.symbol || 'T')[0].toUpperCase();
        html += `
            <div class="token-item">
                <div class="token-info">
                    <div class="token-icon">${iconLetter}</div>
                    <div>
                        <div class="token-name">${token.symbol}</div>
                        <div class="token-symbol">${token.address.substring(0,8)}...</div>
                    </div>
                </div>
                <div class="token-balance">
                    <div class="amount">${token.displayBalance}</div>
                    <div class="fiat">$0.00</div>
                </div>
            </div>
        `;
    });
    // 添加“导入代币”按钮
    html += `
        <div style="margin-top:16px; text-align:center;">
            <button class="btn-outline" onclick="importToken()" style="width:auto; padding:10px 20px;">📥 手动导入代币</button>
        </div>
    `;
    container.innerHTML = html;
}

// ========== 手动导入代币 ==========
function importToken() {
    if (!wallet) { showToast('请先解锁钱包'); return; }
    const address = prompt('请输入代币合约地址（0x开头）');
    if (!address || !ethers.utils.isAddress(address)) {
        showToast('无效的合约地址');
        return;
    }
    // 检查是否已存在
    const exists = customTokens[currentChainId]?.some(t => t.address.toLowerCase() === address.toLowerCase());
    if (exists) {
        showToast('该代币已添加');
        return;
    }
    // 添加到列表并保存
    if (!customTokens[currentChainId]) customTokens[currentChainId] = [];
    customTokens[currentChainId].push({ address: address });
    localStorage.setItem('customTokens', JSON.stringify(customTokens));
    showToast('代币已添加，刷新余额中...');
    loadBalances();
}

// ========== UI 更新 ==========
function updateUI() {
    const addrEl = document.getElementById('topAddress');
    if (addrEl) {
        if (wallet) addrEl.innerText = wallet.address.substring(0,6)+'...'+wallet.address.slice(-4);
        else addrEl.innerText = '未导入';
    }
    updateNetworkUI();
}

function updateNetworkUI() {
    const chain = chains.find(c => c.id === currentChainId);
    const networkEl = document.getElementById('topNetwork');
    if (networkEl) networkEl.innerText = chain?.name || '未知';
    renderChainList();
}

function openNetworkModal() {
    const modal = document.getElementById('networkModal');
    if (modal) modal.classList.add('active');
    renderChainList();
}
function closeNetworkModal() { const modal = document.getElementById('networkModal'); if (modal) modal.classList.remove('active'); }

function renderChainList() {
    const container = document.getElementById('chainListContainer');
    if (!container) return;
    container.innerHTML = chains.map(chain => `
        <div class="chain-list-item ${chain.id === currentChainId ? 'active' : ''}" onclick="switchChain(${chain.id})">
            <div class="chain-icon">⛓️</div>
            <div>
                <div class="chain-name">${chain.name}</div>
                <div class="chain-symbol">${chain.symbol}</div>
            </div>
            ${chain.id === currentChainId ? '<span style="margin-left:auto; color:var(--green);">✔</span>' : ''}
        </div>
    `).join('');
}

// ========== 发送交易 ==========
function openSendModal() {
    if (!wallet) { showToast('请先解锁钱包'); return; }
    if (!provider) { showToast('请先选择网络'); return; }
    const modal = document.getElementById('sendModal');
    if (!modal) return;
    document.getElementById('sendTo').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendStatus').style.display = 'none';
    modal.classList.add('active');
}
function closeSendModal() { const modal = document.getElementById('sendModal'); if (modal) modal.classList.remove('active'); }

async function executeSend() {
    const statusEl = document.getElementById('sendStatus');
    statusEl.style.display = 'block';
    statusEl.className = 'tx-status pending';
    statusEl.innerText = '检查输入...';

    if (!wallet || !provider) {
        statusEl.className = 'tx-status error';
        statusEl.innerText = '钱包未连接';
        return;
    }
    const toAddress = document.getElementById('sendTo').value.trim();
    const amount = document.getElementById('sendAmount').value.trim();
    if (!ethers.utils.isAddress(toAddress)) {
        statusEl.className = 'tx-status error';
        statusEl.innerText = '无效的接收地址';
        return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        statusEl.className = 'tx-status error';
        statusEl.innerText = '请输入有效的金额';
        return;
    }
    if (wallet.provider !== provider) wallet = wallet.connect(provider);

    try {
        statusEl.innerText = '正在发送交易...';
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: ethers.utils.parseEther(amount)
        });
        statusEl.className = 'tx-status success';
        statusEl.innerText = '交易已广播！\n' + tx.hash;
        setTimeout(() => loadBalances(), 2000);
    } catch (e) {
        statusEl.className = 'tx-status error';
        statusEl.innerText = '发送失败: ' + (e.reason || e.message);
    }
}

function showReceiveModal() {
    if (wallet) showToast('你的地址:\n' + wallet.address, 4000);
    else showToast('请先解锁钱包');
}

function showImportSection() {}

// ========== 启动 ==========
function startApp() {
    loadAccounts();
    switchChain(1);
    const networkModal = document.getElementById('networkModal');
    const sendModal = document.getElementById('sendModal');
    const unlockModal = document.getElementById('unlockModal');
    if (networkModal) networkModal.addEventListener('click', e => { if (e.target === networkModal) closeNetworkModal(); });
    if (sendModal) sendModal.addEventListener('click', e => { if (e.target === sendModal) closeSendModal(); });
    if (unlockModal) unlockModal.addEventListener('click', e => { if (e.target === unlockModal) closeUnlockModal(); });
}
