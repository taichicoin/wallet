// ========== 代币管理 ==========
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"];
let customTokens = JSON.parse(localStorage.getItem('customTokens') || '{}');

function renderTokenList(mainSymbol, mainDisplay, tokens) {
    const container = document.getElementById('tokenList');
    if (!container) return;

    const chain = chains.find(c => c.id === currentChainId);
    let mainIconHtml;
    if (chain && chain.logo) {
        mainIconHtml = `<img src="${chain.logo}" class="token-icon" style="object-fit:cover;" />`;
    } else {
        mainIconHtml = `<div class="token-icon">🔷</div>`;
    }

    let html = `
        <div class="token-item">
            <div class="token-info">
                ${mainIconHtml}
                <div>
                    <div class="token-name">${mainSymbol}</div>
                    <div class="token-symbol">主网币</div>
                </div>
            </div>
            <div class="token-balance">
                <div class="amount">${mainDisplay}</div>
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

    html += `
        <div style="margin-top:16px;text-align:center;">
            <button class="btn-outline" onclick="showImportTokenInput()" style="width:auto;padding:10px 20px;">📥 手动导入代币</button>
        </div>
    `;
    container.innerHTML = html;
}

async function getCustomTokenBalances() {
    if (!wallet || !provider) return [];
    if (!customTokens[currentChainId]) customTokens[currentChainId] = [];
    const results = [];
    for (const t of customTokens[currentChainId]) {
        try {
            const c = new ethers.Contract(t.address, ERC20_ABI, provider);
            const [bal, dec, sym] = await Promise.all([c.balanceOf(wallet.address), c.decimals(), c.symbol()]);
            results.push({ address: t.address, symbol: sym || t.symbol || 'TOKEN', decimals: dec || 18, displayBalance: formatBalance(bal, dec) });
        } catch (e) {
            results.push({ address: t.address, symbol: t.symbol || '?', decimals: 18, displayBalance: '查询失败' });
        }
    }
    return results;
}

function showImportTokenInput() {
    cancelImportToken();
    const div = document.createElement('div');
    div.id = 'customTokenInput'; div.style.marginTop = '12px';
    div.innerHTML = `<input type="text" id="newTokenAddress" placeholder="代币合约地址 (0x...)" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:8px;width:100%;"/><div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-primary" onclick="confirmImportToken()" style="flex:1;">添加</button><button class="btn-outline" onclick="cancelImportToken()" style="flex:1;">取消</button></div>`;
    document.getElementById('tokenList').appendChild(div);
}

async function confirmImportToken() {
    const addr = document.getElementById('newTokenAddress')?.value.trim();
    if (!addr || !ethers.utils.isAddress(addr)) return showToast('无效地址');
    if (!customTokens[currentChainId]) customTokens[currentChainId] = [];
    if (customTokens[currentChainId].some(t => t.address.toLowerCase() === addr.toLowerCase())) return showToast('已存在');

    // 尝试获取代币信息
    let symbol = '?';
    let decimals = 18;
    if (provider) {
        try {
            const contract = new ethers.Contract(addr, ERC20_ABI, provider);
            symbol = await contract.symbol();
        } catch (e) {}
        try {
            const contract = new ethers.Contract(addr, ERC20_ABI, provider);
            decimals = await contract.decimals();
        } catch (e) {}
    }
    customTokens[currentChainId].push({ address: addr, symbol, decimals });
    localStorage.setItem('customTokens', JSON.stringify(customTokens));
    showToast('已添加，刷新余额...');
    cancelImportToken();
    loadBalances();
}

function cancelImportToken() { const el = document.getElementById('customTokenInput'); if (el) el.remove(); }

// 获取已导入的代币列表（供转账选择）
function getImportedTokens() {
    if (!customTokens[currentChainId]) return [];
    return customTokens[currentChainId];
}
