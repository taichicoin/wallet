// ========== DApp 浏览器 ==========
window._browserHistory = []; window._browserHistoryIndex = -1;

function openBrowserModal(url) {
    const modal = document.getElementById('browserModal');
    const frame = document.getElementById('browserFrame');
    const input = document.getElementById('browserUrl');
    if (!url) url = input.value || 'https://pancakeswap.finance';
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    frame.src = url; input.value = url;
    modal.classList.add('active');
    if (window._browserHistoryIndex === -1 || window._browserHistory[window._browserHistoryIndex] !== url) {
        window._browserHistory = window._browserHistory.slice(0, window._browserHistoryIndex + 1);
        window._browserHistory.push(url); window._browserHistoryIndex++;
    }
}

function closeBrowserModal() { document.getElementById('browserModal').classList.remove('active'); }
function navigateBrowser() { const url = document.getElementById('browserUrl').value.trim(); if (url) openBrowserModal(url); }
function browserBack() {
    if (window._browserHistoryIndex > 0) {
        window._browserHistoryIndex--;
        const url = window._browserHistory[window._browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrl').value = url;
    }
}
function browserForward() {
    if (window._browserHistoryIndex < window._browserHistory.length - 1) {
        window._browserHistoryIndex++;
        const url = window._browserHistory[window._browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrl').value = url;
    }
}
