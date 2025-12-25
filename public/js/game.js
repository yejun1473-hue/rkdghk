// Game State
const gameState = {
    user: null,
    weapons: [],
    selectedWeapon: null,
    notifications: []
};

// DOM Elements
const elements = {
    // User Info
    username: document.getElementById('username'),
    gold: document.getElementById('gold'),
    choco: document.getElementById('choco'),
    money: document.getElementById('money'),
    
    // Weapon Display
    weaponImage: document.getElementById('weaponImage'),
    currentWeaponImg: document.getElementById('currentWeaponImg'),
    weaponName: document.getElementById('weaponName'),
    weaponLevel: document.getElementById('weaponLevel'),
    weaponAttack: document.getElementById('weaponAttack'),
    weaponPrice: document.getElementById('weaponPrice'),
    
    // Enhance Info
    successRate: document.getElementById('successRate'),
    maintainRate: document.getElementById('maintainRate'),
    destroyRate: document.getElementById('destroyRate'),
    enhanceCost: document.getElementById('enhanceCost'),
    
    // Buttons
    enhanceBtn: document.getElementById('enhanceBtn'),
    sellBtn: document.getElementById('sellBtn'),
    
    // Inventory
    inventory: document.getElementById('inventory'),
    
    // Notifications
    notifications: document.getElementById('notifications'),
    
    // Modal
    loginModal: document.getElementById('loginModal'),
    usernameInput: document.getElementById('usernameInput'),
    personalKeyInput: document.getElementById('personalKey'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn')
};

// Enhancement rates (same as backend for consistency)
const ENHANCEMENT_RATES = {
    0: { success: 100, maintain: 0, destroy: 0, cost: 10 },
    1: { success: 95, maintain: 3, destroy: 2, cost: 20 },
    2: { success: 90, maintain: 7, destroy: 3, cost: 50 },
    3: { success: 85, maintain: 10, destroy: 5, cost: 100 },
    4: { success: 80, maintain: 10, destroy: 10, cost: 500 },
    5: { success: 65, maintain: 22, destroy: 13, cost: 1500 },
    6: { success: 60, maintain: 24, destroy: 16, cost: 5000 },
    7: { success: 55, maintain: 26, destroy: 19, cost: 10000 },
    8: { success: 50, maintain: 28, destroy: 22, cost: 50000 },
    9: { success: 45, maintain: 30, destroy: 25, cost: 65000 },
    10: { success: 38, maintain: 32, destroy: 30, cost: 82000 },
    11: { success: 32, maintain: 33, destroy: 35, cost: 101000 },
    12: { success: 27, maintain: 33, destroy: 40, cost: 150000 },
    13: { success: 22, maintain: 33, destroy: 45, cost: 250000 },
    14: { success: 18, maintain: 32, destroy: 50, cost: 500000 },
    15: { success: 15, maintain: 30, destroy: 55, cost: 750000 },
    16: { success: 12, maintain: 28, destroy: 60, cost: 1000000 },
    17: { success: 10, maintain: 25, destroy: 65, cost: 1250000 },
    18: { success: 8, maintain: 22, destroy: 70, cost: 2000000 },
    19: { success: 5, maintain: 20, destroy: 75, cost: 3000000 }
};

// Calculate weapon stats
function calculateWeaponStats(weapon) {
    const baseAttack = 10;
    const attack = baseAttack * Math.pow(1.5, weapon.level);
    
    // Base prices for each level
    const basePrices = [
        10, 30, 90, 250, 1000, 2500, 10000, 25000, 37500, 85500,
        100000, 300000, 500500, 1600500, 2750000, 4050500, 6500500, 10973000, 50082000, 1000000000
    ];
    
    const price = weapon.level > 0 ? basePrices[weapon.level - 1] : 0;
    const sellPrice = weapon.isHidden ? Math.floor(price * 4) : price;
    
    return {
        attack: Math.floor(attack),
        price: sellPrice
    };
}

// Update UI with weapon data
function updateWeaponUI(weapon) {
    if (!weapon) {
        elements.weaponName.textContent = '무기 없음';
        elements.weaponLevel.textContent = '+0';
        elements.weaponAttack.textContent = '0';
        elements.weaponPrice.textContent = '0';
        elements.enhanceBtn.disabled = true;
        elements.sellBtn.disabled = true;
        return;
    }

    const stats = calculateWeaponStats(weapon);
    const rates = ENHANCEMENT_RATES[weapon.level] || { success: 0, maintain: 0, destroy: 0, cost: 0 };
    
    elements.weaponName.textContent = weapon.name;
    elements.weaponLevel.textContent = `+${weapon.level}`;
    elements.weaponAttack.textContent = stats.attack;
    elements.weaponPrice.textContent = stats.price.toLocaleString();
    
    // Update enhancement info
    elements.successRate.textContent = `${rates.success}%`;
    elements.maintainRate.textContent = `${rates.maintain}%`;
    elements.destroyRate.textContent = `${rates.destroy}%`;
    elements.enhanceCost.textContent = rates.cost.toLocaleString();
    
    // Update weapon image based on level
    const weaponImage = `images/weapons/${weapon.isHidden ? 'hidden' : 'sword'}_${Math.min(weapon.level, 20)}.png`;
    elements.currentWeaponImg.src = weaponImage;
    elements.currentWeaponImg.alt = weapon.name;
    
    // Enable/disable buttons
    elements.enhanceBtn.disabled = false;
    elements.sellBtn.disabled = false;
    
    // Update selected state in inventory
    updateInventoryUI();
}

// Update inventory UI
function updateInventoryUI() {
    elements.inventory.innerHTML = '';
    
    // Add "New Weapon" button
    const newWeaponBtn = document.createElement('div');
    newWeaponBtn.className = 'inventory-item';
    newWeaponBtn.innerHTML = `
        <i class="material-icons">add_circle_outline</i>
        <span>새 무기</span>
    `;
    newWeaponBtn.onclick = () => createNewWeapon();
    elements.inventory.appendChild(newWeaponBtn);
    
    // Add weapons
    gameState.weapons.forEach(weapon => {
        const weaponElement = document.createElement('div');
        const stats = calculateWeaponStats(weapon);
        const isSelected = gameState.selectedWeapon && gameState.selectedWeapon.id === weapon.id;
        
        weaponElement.className = `inventory-item ${isSelected ? 'selected' : ''}`;
        weaponElement.innerHTML = `
            <img src="images/weapons/${weapon.isHidden ? 'hidden' : 'sword'}_${Math.min(weapon.level, 20)}.png" alt="${weapon.name}">
            <span class="item-level">+${weapon.level}</span>
            <span class="item-name">${weapon.name}</span>
        `;
        
        weaponElement.onclick = () => selectWeapon(weapon);
        elements.inventory.appendChild(weaponElement);
    });
}

// Update user info UI
function updateUserUI(user) {
    elements.username.textContent = user ? user.username : '게스트';
    elements.gold.textContent = user ? user.gold.toLocaleString() : '0';
    elements.choco.textContent = user ? user.choco.toLocaleString() : '0';
    elements.money.textContent = user ? user.money.toLocaleString() : '0';
}

// Add notification
function addNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    elements.notifications.insertBefore(notification, elements.notifications.firstChild);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Select weapon
function selectWeapon(weapon) {
    gameState.selectedWeapon = weapon;
    updateWeaponUI(weapon);
}

// Create new weapon
async function createNewWeapon() {
    try {
        const weapon = await api.createWeapon('기본 검');
        gameState.weapons.push(weapon);
        selectWeapon(weapon);
        updateInventoryUI();
        addNotification('새 무기를 획득했습니다!', 'success');
    } catch (error) {
        console.error('Failed to create weapon:', error);
        addNotification('무기 생성에 실패했습니다.', 'danger');
    }
}

// Enhance weapon
async function enhanceWeapon() {
    if (!gameState.selectedWeapon) return;
    
    try {
        const result = await api.enhanceWeapon(gameState.selectedWeapon.id);
        
        // Update weapon data
        const weaponIndex = gameState.weapons.findIndex(w => w.id === result.weapon.id);
        if (weaponIndex !== -1) {
            gameState.weapons[weaponIndex] = result.weapon;
            gameState.selectedWeapon = result.weapon;
        }
        
        // Update user data
        if (result.user) {
            gameState.user = result.user;
            updateUserUI(gameState.user);
        }
        
        // Update UI
        updateWeaponUI(result.weapon);
        updateInventoryUI();
        
        // Show result message
        let message = '';
        if (result.result === 'success') {
            message = `성공! ${result.weapon.name}이(가) +${result.weapon.level}강이 되었습니다!`;
            elements.weaponImage.classList.add('pulse');
            setTimeout(() => elements.weaponImage.classList.remove('pulse'), 1000);
        } else if (result.result === 'maintain') {
            message = '강화는 실패했지만 무기는 무사합니다.';
            elements.weaponImage.classList.add('shake');
            setTimeout(() => elements.weaponImage.classList.remove('shake'), 300);
        } else {
            message = '무기가 파괴되었습니다...';
            elements.weaponImage.classList.add('shake');
            setTimeout(() => elements.weaponImage.classList.remove('shake'), 300);
        }
        
        addNotification(message, result.result === 'success' ? 'success' : 'danger');
        
    } catch (error) {
        console.error('Enhancement failed:', error);
        addNotification('강화에 실패했습니다: ' + (error.message || '알 수 없는 오류'), 'danger');
    }
}

// Sell weapon
async function sellWeapon() {
    if (!gameState.selectedWeapon) return;
    
    if (!confirm('정말로 이 무기를 판매하시겠습니까?')) {
        return;
    }
    
    try {
        const result = await api.sellWeapon(gameState.selectedWeapon.id);
        
        // Remove weapon from inventory
        gameState.weapons = gameState.weapons.filter(w => w.id !== gameState.selectedWeapon.id);
        
        // Update user data
        if (result.user) {
            gameState.user = result.user;
            updateUserUI(gameState.user);
        }
        
        // Select first weapon or null if none left
        gameState.selectedWeapon = gameState.weapons.length > 0 ? gameState.weapons[0] : null;
        
        // Update UI
        updateWeaponUI(gameState.selectedWeapon);
        updateInventoryUI();
        
        addNotification(`무기를 ${result.goldEarned.toLocaleString()}G에 판매했습니다!`, 'success');
        
    } catch (error) {
        console.error('Sell failed:', error);
        addNotification('판매에 실패했습니다: ' + (error.message || '알 수 없는 오류'), 'danger');
    }
}

// Initialize game
async function initGame() {
    try {
        // Check if user is logged in
        const user = await api.getProfile();
        gameState.user = user;
        updateUserUI(user);
        
        // Load weapons
        const weapons = await api.getWeapons();
        gameState.weapons = weapons;
        
        // Select first weapon if available
        if (weapons.length > 0) {
            gameState.selectedWeapon = weapons[0];
            updateWeaponUI(gameState.selectedWeapon);
        } else {
            updateWeaponUI(null);
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Connect to notifications
        api.connectToNotifications(notification => {
            addNotification(notification.message, 'info');
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        // Show login modal if not logged in
        showLoginModal();
    }
}

// Show login modal
function showLoginModal() {
    elements.loginModal.style.display = 'flex';
}

// Hide login modal
function hideLoginModal() {
    elements.loginModal.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Enhance button
    elements.enhanceBtn.onclick = enhanceWeapon;
    
    // Sell button
    elements.sellBtn.onclick = sellWeapon;
    
    // Login button
    elements.loginBtn.onclick = async () => {
        const username = elements.usernameInput.value.trim();
        const code = document.getElementById('code').value.trim();
        
        if (!username || !code) {
            alert('사용자명과 코드를 모두 입력해주세요.');
            return;
        }
        
        try {
            const response = await api.login(username, code);
            if (response && response.token) {
                hideLoginModal();
                initGame();
            } else {
                throw new Error('로그인 응답이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('로그인에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        }
    };
    
    // Close modal when clicking outside
    elements.loginModal.onclick = (e) => {
        if (e.target === elements.loginModal) {
            hideLoginModal();
        }
    };
}

// Export functions for app.js
window.game = {
    init: initGame,
    showLoginModal: showLoginModal
};
