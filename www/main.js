// ========== 轻量 scrypt 配置 ==========
const SCRYPT_OPTIONS = { scrypt: { N: 16384 } };

// ========== 区块浏览器 API 配置（需自行申请免费 Key）==========
// BscScan: https://bscscan.com/myapikey
// Etherscan: https://etherscan.io/myapikey
// Polygonscan: https://polygonscan.com/myapikey
const EXPLORER_API_KEYS = {
    1: "YOUR_ETHERSCAN_API_KEY",      // Ethereum
    56: "YOUR_BSCSCAN_API_KEY",       // BNB Chain
    137: "YOUR_POLYGONSCAN_API_KEY",  // Polygon
    // 其他链可自行添加
};

// ========== 自定义 Toast ==========
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

// ========== 多链配置（补充了 API 端点） ==========
const chains = [
    { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io", rpcs: ["https://eth.llamarpc.com","https://rpc.ankr.com/eth","https://cloudflare-eth.com"], api: "https://api.etherscan.io/api" },
    { id: 56, name: "BNB Chain", symbol: "BNB", explorer: "https://bscscan.com", rpcs: ["https://bsc-dataseed.bnbchain.org","https://bsc-dataseed1.bnbchain.org","https://bsc-dataseed2.bnbchain.org","https://bsc-dataseed3.bnbchain.org","https://bsc-dataseed4.bnbchain.org","https://bsc-rpc.publicnode.com","https://rpc.ankr.com/bsc","https://1rpc.io/bnb","https://bsc.api.pocket.network","https://bsc-mainnet.public.blastapi.io","https://bsc-dataseed1.defibit.io","https://bsc-dataseed2.defibit.io","https://bsc-dataseed1.ninicoin.io","https://bsc-dataseed2.ninicoin.io"], api: "https://api.bscscan.com/api" },
    { id: 97, name: "BSC Testnet", symbol: "tBNB", explorer: "https://testnet.bscscan.com", rpcs: ["https://data-seed-prebsc-1-s1.binance.org:8545","https://data-seed-prebsc-2-s1.binance.org:8545","https://bsc-testnet.publicnode.com"], api: "https://api-testnet.bscscan.com/api" },
    { id: 137, name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com", rpcs: ["https://polygon-rpc.com","https://rpc-mainnet.maticvigil.com"], api: "https://api.polygonscan.com/api" },
    { id: 42161, name: "Arbitrum One", symbol: "ETH", explorer: "https://arbiscan.io", rpcs: ["https://arb1.arbitrum.io/rpc"] },
    { id: 10, name: "Optimism", symbol: "ETH", explorer: "https://optimistic.etherscan.io", rpcs: ["https://mainnet.optimism.io"] },
    { id: 43114, name: "Avalanche C-Chain", symbol: "AVAX", explorer: "https://snowtrace.io", rpcs: ["https://api.avax.network/ext/bc/C/rpc"] }
];

// ========== 全局状态 ==========
let wallet = null;
let provider = null;
let currentChainId = 1;
let accounts = [];
let pendingUnlockIndex = null;
let lastGoodRpcCache = {};

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

// ========== 导入钱包（轻量 scrypt） ==========
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
        if (input.startsWith('0x') && input.length === 66) {
            tempWallet = new ethers.Wallet(input);
        } else {
            tempWallet = ethers.Wallet.fromMnemonic(input);
        }
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

// ========== 网络连接（并行竞速） ==========
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

// ========== 余额格式化工夫 ==========
function formatTokenBalance(rawBalance, decimals = 18) {
    const balanceStr = ethers.utils.formatUnits(rawBalance, decimals);
    const parts = balanceStr.split('.');
    if (parts.length === 1) return balanceStr; // 无小数部分
    const decimalPart = parts[1];
    // 计算小数点后连续0的个数
    let zeroCount = 0;
    for (const ch of decimalPart) {
        if (ch === '0') zeroCount++;
        else break;
    }
    // 规则：超过6个连续的0（即 >=7 个0），显示为0
    if (zeroCount >= 7) {
        return '0';
    }
    // 否则保留最多6位小数显示
    const balanceNum = parseFloat(balanceStr);
    if (balanceNum === 0) return '0';
    return balanceNum.toFixed(6).replace(/\.?0+$/, '');
}

// ========== 代币余额查询 ==========
async function fetchTokenBalances(address, chain) {
    if (!chain.api) {
        console.log('当前链未配置 API，无法查询代币');
        return [];
    }
    const apiKey = EXPLORER_API_KEYS[chain.id] || '';
    const url = `${chain.api}?module=account&action=tokenbalance&address=${address}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== '1') {
            // 可能因为 API Key 无效或无代币
            return [];
        }
        // 返回代币列表，包含合约地址、代币名称、符号、精度、余额
        return data.result.map(token => ({
            contract: token.contractAddress,
            name: token.tokenName,
            symbol: token.tokenSymbol,
            decimals: parseInt(token.tokenDecimal),
            rawBalance: token.balance
        }));
    } catch (e) {
        console.error('获取代币列表失败:', e);
        return [];
    }
}

// ========== 余额与资产 ==========
async function loadBalances() {
    if (!wallet || !provider) return;
    const chain = chains.find(c => c.id === currentChainId);
    if (!chain) return;

    const address = wallet.address;

    // 1. 主链币余额
    try {
        const rawBalance = await provider.getBalance(address);
        const formatted = ethers.utils.formatEther(rawBalance);
        document.getElementById('totalBalance').innerText = `${parseFloat(formatted).toFixed(4)} ${chain.symbol}`;
        document.getElementById('fiatValue').innerText = `$0.00 USD`;
    } catch(e) {
        document.getElementById('totalBalance').innerText = '--';
    }

    // 2. 代币余额
    let tokens = [];
    try {
        const rawTokens = await fetchTokenBalances(address, chain);
        tokens = rawTokens.filter(t => !ethers.BigNumber.from(t.rawBalance).isZero())
                          .map(t => ({
                              ...t,
                              displayBalance: formatTokenBalance(t.rawBalance, t.decimals)
                          }));
    } catch(e) { console.error('代币查询失败', e); }

    // 渲染资产列表
    renderTokenList(chain.symbol, ethers.utils.formatEther(await provider.getBalance(address)), tokens);
}

function renderTokenList(mainSymbol, mainBalance, tokens) {
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
                <div class="amount">${parseFloat(mainBalance).toFixed(4)}</div>
                <div class="fiat">$0.00</div>
            </div>
        </div>
    `;

    tokens.forEach(token => {
        html += `
            <div class="token-item">
                <div class="token-info">
                    <div class="token-icon">🪙</div>
                    <div>
                        <div class="token-name">${token.name || '未知代币'}</div>
                        <div class="token-symbol">${token.symbol}</div>
                    </div>
                </div>
                <div class="token-balance">
                    <div class="amount">${token.displayBalance}</div>
                    <div class="fiat">$0.00</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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
