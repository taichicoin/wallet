// ========== 多链配置 ==========
const chains = [
    { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io", rpcs: ["https://eth.llamarpc.com","https://rpc.ankr.com/eth"] },
    { id: 56, name: "BNB Chain", symbol: "BNB", explorer: "https://bscscan.com", rpcs: ["https://bsc-dataseed.binance.org","https://bsc-dataseed1.defibit.io"] },
    { id: 97, name: "BSC Testnet", symbol: "tBNB", explorer: "https://testnet.bscscan.com", rpcs: ["https://data-seed-prebsc-1-s1.binance.org:8545","https://bsc-testnet.publicnode.com"] },
    { id: 137, name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com", rpcs: ["https://polygon-rpc.com","https://rpc-mainnet.maticvigil.com"] },
    { id: 42161, name: "Arbitrum", symbol: "ETH", explorer: "https://arbiscan.io", rpcs: ["https://arb1.arbitrum.io/rpc"] },
    { id: 10, name: "Optimism", symbol: "ETH", explorer: "https://optimistic.etherscan.io", rpcs: ["https://mainnet.optimism.io"] },
    { id: 43114, name: "Avalanche", symbol: "AVAX", explorer: "https://snowtrace.io", rpcs: ["https://api.avax.network/ext/bc/C/rpc"] }
];

// ========== 全局状态 ==========
let wallet = null;
let provider = null;
let currentChainId = 1;
let accounts = [];
let pendingUnlockIndex = null; // 待解锁的账户索引

// ========== 本地存储操作 ==========
function loadAccounts() {
    const stored = localStorage.getItem('mywallet_accounts_enc');
    if (stored) {
        try { accounts = JSON.parse(stored); } catch(e) { accounts = []; }
    } else {
        accounts = [];
    }
    updateAccountSelect();
    // 不自动解锁，等待用户选择
}

function saveAccounts() {
    localStorage.setItem('mywallet_accounts_enc', JSON.stringify(accounts));
    updateAccountSelect();
}

function updateAccountSelect() {
    const select = document.getElementById('accountSelect');
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
    if (idx === '') {
        wallet = null;
        updateUI();
        return;
    }
    const acc = accounts[parseInt(idx)];
    // 弹出解锁窗口
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

    const acc = accounts[pendingUnlockIndex];
    try {
        const decryptedWallet = await ethers.Wallet.fromEncryptedJson(acc.keystore, password);
        wallet = decryptedWallet;
        if (provider) wallet = wallet.connect(provider);
        updateUI();
        loadBalances();
        closeUnlockModal();
    } catch (e) {
        statusEl.style.display = 'block';
        statusEl.className = 'tx-status error';
        statusEl.innerText = '密码错误或数据损坏';
    }
}

// ========== 导入钱包（加密存储） ==========
async function importWallet() {
    const input = document.getElementById('secretInput').value.trim();
    const password = document.getElementById('encryptPassword').value;
    const confirm = document.getElementById('encryptPasswordConfirm').value;

    if (!input) return alert('请输入助记词或私钥');
    if (!password || password.length < 6) return alert('密码至少6位');
    if (password !== confirm) return alert('两次密码不一致');

    // 创建临时钱包（不保存明文）
    let tempWallet;
    try {
        if (input.startsWith('0x') && input.length === 66) {
            tempWallet = new ethers.Wallet(input);
        } else {
            tempWallet = ethers.Wallet.fromMnemonic(input);
        }
    } catch (e) {
        return alert('无效的助记词或私钥');
    }

    // 检查地址是否已存在
    if (accounts.some(a => a.address === tempWallet.address)) {
        return alert('该地址已存在');
    }

    // 加密生成 keystore
    const keystoreJson = await tempWallet.encrypt(password);
    accounts.push({
        address: tempWallet.address,
        keystore: keystoreJson,
        type: 'keystore'
    });
    saveAccounts();

    // 清空表单
    document.getElementById('secretInput').value = '';
    document.getElementById('encryptPassword').value = '';
    document.getElementById('encryptPasswordConfirm').value = '';

    // 自动选中新账户（需解锁）
    const newIndex = accounts.length - 1;
    document.getElementById('accountSelect').value = newIndex;
    // 直接弹出解锁窗口让用户立即使用
    openUnlockModal(newIndex);
}

// ========== 删除账户 ==========
function deleteAccount() {
    const idx = document.getElementById('accountSelect').value;
    if (idx === '') return;
    if (!confirm('确定删除该账户？')) return;
    accounts.splice(parseInt(idx), 1);
    saveAccounts();
    wallet = null;
    updateUI();
    if (accounts.length > 0) {
        document.getElementById('accountSelect').value = 0;
        switchAccount();
    }
}

// ========== 网络连接 ==========
async function connectToChain(chain) {
    for (const rpc of chain.rpcs) {
        try {
            const prov = new ethers.providers.JsonRpcProvider(
                { url: rpc, timeout: 10000 },
                { chainId: chain.id, name: chain.name }
            );
            await prov.getBlockNumber();
            return prov;
        } catch(e) { console.warn('RPC失败:', rpc, e.message); }
    }
    throw new Error('所有节点不可用');
}

async function switchChain(chainId) {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;
    try {
        provider = await connectToChain(chain);
        currentChainId = chain.id;
        if (wallet) wallet = wallet.connect(provider);
        updateNetworkUI();
        loadBalances();
        closeNetworkModal();
    } catch(e) { alert('网络切换失败: '+e.message); }
}

// ========== 余额与资产 ==========
async function loadBalances() {
    if (!wallet || !provider) return;
    const chain = chains.find(c => c.id === currentChainId);
    const symbol = chain?.symbol || 'ETH';
    try {
        const balance = await provider.getBalance(wallet.address);
        const formatted = ethers.utils.formatEther(balance);
        document.getElementById('totalBalance').innerText = `${parseFloat(formatted).toFixed(4)} ${symbol}`;
        document.getElementById('fiatValue').innerText = `$0.00 USD`;
        renderTokenList(symbol, formatted);
    } catch(e) {
        document.getElementById('totalBalance').innerText = '--';
    }
}

function renderTokenList(mainSymbol, mainBalance) {
    document.getElementById('tokenList').innerHTML = `
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
}

// ========== UI 更新 ==========
function updateUI() {
    const addrEl = document.getElementById('topAddress');
    if (wallet) {
        addrEl.innerText = wallet.address.substring(0,6)+'...'+wallet.address.slice(-4);
    } else {
        addrEl.innerText = '未导入';
    }
    updateNetworkUI();
}

function updateNetworkUI() {
    const chain = chains.find(c => c.id === currentChainId);
    document.getElementById('topNetwork').innerText = chain?.name || '未知';
    renderChainList();
}

// ========== 网络弹窗 ==========
function openNetworkModal() {
    document.getElementById('networkModal').classList.add('active');
    renderChainList();
}
function closeNetworkModal() { document.getElementById('networkModal').classList.remove('active'); }

function renderChainList() {
    document.getElementById('chainListContainer').innerHTML = chains.map(chain => `
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

// ========== 发送功能 ==========
function openSendModal() {
    if (!wallet) return alert('请先解锁钱包');
    if (!provider) return alert('请先选择网络');
    document.getElementById('sendTo').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendStatus').style.display = 'none';
    document.getElementById('sendModal').classList.add('active');
}
function closeSendModal() { document.getElementById('sendModal').classList.remove('active'); }

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

    if (wallet.provider !== provider) {
        wallet = wallet.connect(provider);
    }

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
    if (wallet) alert('你的地址:\n' + wallet.address);
    else alert('请先解锁钱包');
}

function showImportSection() {
    const sec = document.getElementById('importSection');
    sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}

// ========== 启动 ==========
window.onload = () => {
    loadAccounts();
    switchChain(1); // 默认连接以太坊
    document.getElementById('networkModal').addEventListener('click', function(e) {
        if (e.target === this) closeNetworkModal();
    });
    document.getElementById('sendModal').addEventListener('click', function(e) {
        if (e.target === this) closeSendModal();
    });
    document.getElementById('unlockModal').addEventListener('click', function(e) {
        if (e.target === this) closeUnlockModal();
    });
};
