// 自定义 Toast
function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return console.warn('toast missing');
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// 自定义确认框
function customConfirm(msg, callback) {
    const result = window.confirm(msg);
    if (typeof result === 'boolean') {
        callback(result);
    } else {
        showToast('确认操作被阻止，视为取消', 2000);
        callback(false);
    }
}

// 多链配置
const chains = [
    {
        id: 1,
        name: "Ethereum",
        symbol: "ETH",
        explorer: "https://etherscan.io",
        rpcs: [
            "https://eth.llamarpc.com",
            "https://rpc.ankr.com/eth",
            "https://cloudflare-eth.com"
        ]
    },
    {
        id: 56,
        name: "BNB Chain",
        symbol: "BNB",
        explorer: "https://bscscan.com",
        rpcs: [
            // ChainList 提供的公开 RPC 列表（2025年7月）
            "https://bsc-rpc.keccak.io",
            "https://bsc-rpc.publicnode.com",
            "https://bsc.api.pocket.network",
            "https://0.48.club",
            "https://bsc.rpc.blxrbdn.com",
            "https://bsc.blockrazor.xyz",
            "https://api.zan.top/bsc-mainnet",
            "https://bsc.meowrpc.com",
            "https://public-bsc.nownodes.io",
            "https://bsc-mainnet.public.blastapi.io",
            "https://rpc-bsc.48.club",
            "https://bsc.drpc.org",
            "https://bsc-dataseed1.ninicoin.io",
            "https://bsc-dataseed1.defibit.io",
            "https://bsc-dataseed3.defibit.io",
            "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3",
            "https://bsc-dataseed2.ninicoin.io",
            "https://bsc-dataseed2.defibit.io",
            "https://bsc-dataseed4.defibit.io",
            "https://bsc-dataseed3.ninicoin.io",
            "https://bsc-dataseed4.ninicoin.io",
            "https://bsc-mainnet.gateway.tatum.io",
            "https://bnb.api.onfinality.io/public",
            "https://bsc-dataseed.bnbchain.org",
            "https://bsc-dataseed1.bnbchain.org",
            "https://bsc-dataseed4.bnbchain.org",
            "https://bsc-dataseed2.bnbchain.org",
            "https://bsc-dataseed3.bnbchain.org",
            "https://bsc.rpc.sentio.xyz",
            "https://binance.nodereal.io",
            "https://rpc.owlracle.info/bsc/70d38ce1826c4a60bb2a8e05a6c8b20f",
            "https://1rpc.io/bnb",
            "https://bsc-rpc-public.chainpulse.cc",
            "https://gw-aql.tomo.services/v1/bnbchain/aql_live_2dba7f55b5cf0f356538a727da2079fe",
            "https://rpc.swiftnodes.io/rpc/bsc",
            "https://api-bsc-mainnet-full.n.dwellir.com/2ccf18bf-2916-4198-8856-42172854353c",
            "https://public-bsc-mainnet.fastnode.io",
            "https://rpc.poolz.finance/bsc",
            "https://bsc.therpc.io",
            "https://endpoints.omniatech.io/v1/bsc/mainnet/public",
            "https://bsc-mainnet.4everland.org/v1/37fa9972c1b1cd5fab542c7bdd4cde2f",
            "https://public.stackup.sh/api/v1/node/bsc-mainnet",
            "https://rpc.polysplit.cloud/v1/chain/56",
            "https://services.tokenview.io/vipapi/nodeservice/bsc?apikey=gVFJX5OyPdc2kHH7youg",
            "https://bsc.blockpi.network/v1/rpc/private",
            "https://nodes.vefinetwork.org/smartchain",
            "https://bsc-mainnet.rpcfast.com?api_key=xbhWBI1Wkguk8SNMu1bvvLurPGLXmgwYeC4S6g2H7WdwFigZSmPWVZRxrskEQwIf",
            "https://bsc.rpcgator.com",
            "https://bscrpc.com",
            "https://go.getblock.io/cc778cdbdf5c4b028ec9456e0e6c0cf3",
            "https://binance-smart-chain-public.nodies.app",
            "https://bsc-dataseed6.dict.life",
            "https://bsc.campioneinfrastructure.com",
            "https://rpc.nodeflare.app/bnb/public"
        ]
    },
    {
        id: 97,
        name: "BSC Testnet",
        symbol: "tBNB",
        explorer: "https://testnet.bscscan.com",
        rpcs: [
            "https://data-seed-prebsc-1-s1.binance.org:8545",
            "https://bsc-testnet.publicnode.com"
        ]
    },
    {
        id: 137,
        name: "Polygon",
        symbol: "MATIC",
        explorer: "https://polygonscan.com",
        rpcs: [
            "https://polygon-rpc.com",
            "https://rpc-mainnet.maticvigil.com",
            "https://polygon-mainnet.g.alchemy.com/v2/demo"
        ]
    },
    {
        id: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        explorer: "https://arbiscan.io",
        rpcs: [
            "https://arb1.arbitrum.io/rpc"
        ]
    },
    {
        id: 10,
        name: "Optimism",
        symbol: "ETH",
        explorer: "https://optimistic.etherscan.io",
        rpcs: [
            "https://mainnet.optimism.io"
        ]
    },
    {
        id: 43114,
        name: "Avalanche C-Chain",
        symbol: "AVAX",
        explorer: "https://snowtrace.io",
        rpcs: [
            "https://api.avax.network/ext/bc/C/rpc"
        ]
    }
];

let wallet = null;
let provider = null;
let currentChainId = 1;
let accounts = [];
let pendingUnlockIndex = null;

// ========== 本地存储 ==========
function loadAccounts() {
    const stored = localStorage.getItem('mywallet_accounts_enc');
    if (stored) {
        try { accounts = JSON.parse(stored); } catch(e) { accounts = []; }
    } else {
        accounts = [];
    }
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
    if (idx === '') {
        wallet = null;
        updateUI();
        return;
    }
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
    console.log('importWallet called');
    showToast('正在加密钱包，可能需要几秒...', 3000);

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
    } catch (e) {
        showToast('无效的助记词或私钥');
        return;
    }

    const existing = accounts.find(acc => acc.address.toLowerCase() === tempWallet.address.toLowerCase());
    if (existing) {
        showToast('该地址已存在，无法重复导入');
        return;
    }

    try {
        const keystoreJson = await tempWallet.encrypt(password);
        accounts.push({
            address: tempWallet.address,
            keystore: keystoreJson,
            type: 'keystore'
        });
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

// 删除账户
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

// ========== 网络连接（并行竞速，选择最快节点） ==========
async function connectToChain(chain) {
    // 并行请求所有节点，取最先成功的
    const racePromises = chain.rpcs.map(rpc => {
        return new Promise((resolve, reject) => {
            try {
                const prov = new ethers.providers.JsonRpcProvider(
                    { url: rpc, timeout: 5000 },
                    { chainId: chain.id, name: chain.name }
                );
                // 立刻异步测试连通性
                prov.getBlockNumber().then(() => resolve(prov)).catch(reject);
            } catch (e) {
                reject(e);
            }
        });
    });

    // 加一个总超时，15秒内必须有一个成功
    const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('所有节点超时')), 15000)
    );

    try {
        const provider = await Promise.race([...racePromises, timeout]);
        console.log('已连接到节点:', provider.connection.url);
        return provider;
    } catch (e) {
        throw new Error('无法连接到 ' + chain.name);
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
        showToast('连接失败: ' + e.message);
    }
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
    const tokenList = document.getElementById('tokenList');
    if (!tokenList) return;
    tokenList.innerHTML = `
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
    if (addrEl) {
        if (wallet) {
            addrEl.innerText = wallet.address.substring(0,6)+'...'+wallet.address.slice(-4);
        } else {
            addrEl.innerText = '未导入';
        }
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
function closeNetworkModal() {
    const modal = document.getElementById('networkModal');
    if (modal) modal.classList.remove('active');
}

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
function closeSendModal() {
    const modal = document.getElementById('sendModal');
    if (modal) modal.classList.remove('active');
}

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
    if (wallet) showToast('你的地址:\n' + wallet.address, 4000);
    else showToast('请先解锁钱包');
}

// 旧版兼容
function showImportSection() {
    // 现在使用弹窗，可保留空实现
}

// ========== 启动函数 ==========
function startApp() {
    loadAccounts();
    switchChain(1);
    const networkModal = document.getElementById('networkModal');
    const sendModal = document.getElementById('sendModal');
    const unlockModal = document.getElementById('unlockModal');

    if (networkModal) {
        networkModal.addEventListener('click', function(e) {
            if (e.target === this) closeNetworkModal();
        });
    }
    if (sendModal) {
        sendModal.addEventListener('click', function(e) {
            if (e.target === this) closeSendModal();
        });
    }
    if (unlockModal) {
        unlockModal.addEventListener('click', function(e) {
            if (e.target === this) closeUnlockModal();
        });
    }
}
