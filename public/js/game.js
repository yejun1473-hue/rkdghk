import { WEAPON_NAMES, WEAPON_TYPES } from './weaponNames.js';

// Game State
const gameState = {
    user: null,
    weapons: [],
    selectedWeapon: null,
    notifications: [],
    currentWeaponType: WEAPON_TYPES.SWORD // Default to sword type
};

// DOM Elements
const elements = {
    // Weapon Type Toggle
    toggleWeaponTypeBtn: document.getElementById('toggleWeaponType'),
    // User Info
    username: document.getElementById('username'),
    gold: document.getElementById('gold'),
    choco: document.getElementById('choco'),
    money: document.getElementById('money'),
    
    // Weapon Display
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
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('usernameInput'),
    codeInput: document.getElementById('codeInput'),
    loginBtn: document.getElementById('loginBtn')
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
        return;
    }
    
    elements.weaponName.textContent = weapon.name;
    elements.weaponLevel.textContent = weapon.level > 0 ? `+${weapon.level}` : '';
    elements.weaponAttack.textContent = weapon.attack;
    elements.weaponPrice.textContent = Math.floor(weapon.attack * 10);
    
    // Update enhancement rates
    const rates = ENHANCEMENT_RATES[weapon.level] || ENHANCEMENT_RATES[18];
    elements.successRate.textContent = `${rates.success}%`;
    elements.maintainRate.textContent = `${rates.maintain}%`;
    elements.destroyRate.textContent = `${rates.destroy}%`;
    elements.enhanceCost.textContent = rates.cost;
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
function createNewWeapon() {
    const newWeapon = {
        id: Date.now(),
        name: WEAPON_NAMES[gameState.currentWeaponType][0],
        level: 0,
        attack: 10,
        price: 0,
        type: gameState.currentWeaponType
    };
    
    gameState.weapons.push(newWeapon);
    gameState.selectedWeapon = newWeapon;
    updateWeaponUI(newWeapon);
    updateInventoryUI();
}

// Enhance weapon
function enhanceWeapon() {
    if (!gameState.selectedWeapon) return;
    
    const weapon = gameState.selectedWeapon;
    const rates = ENHANCEMENT_RATES[weapon.level] || ENHANCEMENT_RATES[18];
    
    try {
        // Check if user has enough gold
        if (gameState.user.gold < rates.cost) {
            addNotification('골드가 부족합니다!', 'error');
            return;
        }
        
        // Deduct gold
        gameState.user.gold -= rates.cost;
        updateUserUI(gameState.user);
        
        // Calculate result
        const result = Math.random() * 100;
        
        if (result <= rates.success) {
            // Success
            weapon.level++;
            weapon.attack = Math.floor(weapon.attack * 1.5);
            weapon.name = WEAPON_NAMES[weapon.type][Math.min(weapon.level, WEAPON_NAMES[weapon.type].length - 1)];
            message = `강화 성공! ${weapon.name} +${weapon.level}이 되었습니다.`;
            updateWeaponUI(weapon);
            addNotification(message, 'success');
        } else if (result <= rates.success + rates.maintain) {
            // Maintain
            message = '강화는 실패했지만, 무기가 유지되었습니다.';
            addNotification(message, 'warning');
        } else {
            // Destroy
            message = '강화에 실패하여 무기가 파괴되었습니다.';
            addNotification(message, 'error');
            const index = gameState.weapons.indexOf(weapon);
            gameState.weapons.splice(index, 1);
            gameState.selectedWeapon = gameState.weapons[0] || null;
            if (gameState.selectedWeapon) {
                updateWeaponUI(gameState.selectedWeapon);
            } else {
                // Reset weapon display
                elements.weaponName.textContent = '무기가 없습니다';
                elements.weaponLevel.textContent = '';
                elements.weaponAttack.textContent = '0';
                elements.weaponPrice.textContent = '0';
            }
        }
        
        updateInventoryUI();
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
            // Create a default weapon if none exist
            createNewWeapon();
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Connect to notifications
        if (api.connectToNotifications) {
            api.connectToNotifications(notification => {
                addNotification(notification.message, 'info');
            });
        }
        
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

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    
    const username = elements.usernameInput.value.trim();
    const code = elements.codeInput.value.trim();
    
    if (!username || !code) {
        alert('사용자명과 코드를 모두 입력해주세요.');
        return;
    }
    
    // Show loading state
    const loginBtnText = elements.loginBtn.innerHTML;
    elements.loginBtn.disabled = true;
    elements.loginBtn.innerHTML = '로그인 중...';
    
    try {
        const response = await api.login(username, code);
        
        if (response && response.token) {
            // Store user data
            localStorage.setItem('user', JSON.stringify({
                username: response.username || username,
                role: response.role || 'player',
                token: response.token
            }));
            
            // Update UI
            if (elements.username) {
                elements.username.textContent = response.username || username;
            }
            
            // Clear input fields
            elements.usernameInput.value = '';
            elements.codeInput.value = '';
            
            // Hide modal and initialize game
            hideLoginModal();
            await initGame();
            
            // Show welcome message
            addNotification(`${response.username || username}님, 환영합니다!`, 'success');
            
            // Refresh the page to ensure all components are properly initialized
            setTimeout(() => window.location.reload(), 500);
        } else {
            throw new Error('서버로부터 유효한 응답을 받지 못했습니다.');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        
        if (error.status === 401) {
            errorMessage = '사용자명 또는 코드가 올바르지 않습니다.';
        } else if (error.status === 400) {
            errorMessage = '잘못된 요청입니다. 입력값을 확인해주세요.';
        } else if (error.status === 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (!navigator.onLine) {
            errorMessage = '인터넷 연결을 확인해주세요.';
        }
        
        alert(errorMessage);
    } finally {
        // Reset button state
        elements.loginBtn.disabled = false;
        elements.loginBtn.innerHTML = loginBtnText;
    }
}

// Toggle weapon type
function toggleWeaponType() {
    gameState.currentWeaponType = gameState.currentWeaponType === WEAPON_TYPES.SWORD 
        ? WEAPON_TYPES.STICK 
        : WEAPON_TYPES.SWORD;
    
    // Update button text
    elements.toggleWeaponTypeBtn.textContent = `무기 전환: ${gameState.currentWeaponType === WEAPON_TYPES.SWORD ? '검' : '막대기'}`;
    
    // If no weapons, create a new one of the selected type
    if (gameState.weapons.length === 0) {
        createNewWeapon();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Enhance button
    if (elements.enhanceBtn) {
        elements.enhanceBtn.addEventListener('click', enhanceWeapon);
    }
    
    // Sell button
    if (elements.sellBtn) {
        elements.sellBtn.addEventListener('click', sellWeapon);
    }
    
    // Toggle weapon type
    if (elements.toggleWeaponTypeBtn) {
        elements.toggleWeaponTypeBtn.addEventListener('click', toggleWeaponType);
    }
    
    // Login form - Add proper event listener
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Close modal when clicking outside
    if (elements.loginModal) {
        elements.loginModal.addEventListener('click', (e) => {
            if (e.target === elements.loginModal) {
                hideLoginModal();
            }
        });
    }
    
    // Add click event to login button (as a fallback)
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogin(e);
        });
    }
}

// Export functions for app.js
window.game = {
    init: initGame,
    showLoginModal: showLoginModal
};
