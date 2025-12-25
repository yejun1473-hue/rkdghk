// Weapon Tiers
const WEAPON_TIERS = [
    '낡은', '일반', '고급', '희귀', '영웅', '전설', '신화', '태초', '천공', '공허'
];

// Weapon Types
const WEAPON_TYPES = {
    SWORD: '검',
    STICK: '지팡이',
    DAGGER: '단검',
    BOW: '활',
    STAFF: '스태프',
    WAND: '완드'
};

// Generate weapon names for a specific type and tier
const generateWeaponNames = (type, tier) => {
    const prefix = WEAPON_TIERS[tier];
    const suffix = WEAPON_TYPES[type] || type;
    return Array.from({ length: 21 }, (_, i) => `${prefix} ${suffix} +${i}`);
};

// Generate all weapon names
export const WEAPON_NAMES = {
    SWORD: generateWeaponNames('SWORD', 0), // Default tier 0
    STICK: generateWeaponNames('STICK', 0), // Default tier 0
    
    // Generate all tiers for each weapon type
    ...Object.entries(WEAPON_TYPES).reduce((acc, [typeKey, typeName]) => {
        WEAPON_TIERS.forEach((tier, index) => {
            const tierKey = `${typeKey}_TIER_${index}`;
            acc[tierKey] = generateWeaponNames(typeKey, index);
        });
        return acc;
    }, {})
};

// Special weapon sets
export const SPECIAL_WEAPONS = {
    // Christmas event weapons
    CHRISTMAS: {
        SWORD: '크리스마스 검',
        STAFF: '산타의 지팡이',
        BOW: '루돌프의 활'
    },
    
    // Halloween event weapons
    HALLOWEEN: {
        SWORD: '호박 대검',
        WAND: '유령의 지팡이',
        DAGGER: '흡혈귀 송곳니'
    },
    
    // Summer event weapons
    SUMMER: {
        SWORD: '해변의 낫',
        STAFF: '파도의 지팡이',
        BOW: '태양의 활'
    }
};

// Hidden weapons that can be unlocked
// Format: { slug: { name: 'Display Name', condition: 'Condition to unlock', stats: { attack: number, magic: number } } }
export const HIDDEN_WEAPONS = {
    'bone': { 
        name: '제작자의 유골', 
        condition: '누적 파괴 10회',
        stats: { attack: 50, magic: 50 } 
    },
    'xmas_sword': { 
        name: '크리스마스 검', 
        condition: '12월 이벤트',
        stats: { attack: 100, magic: 30 }
    },
    'gingerbread': { 
        name: '진저브레드', 
        condition: '이벤트 보상',
        stats: { attack: 30, magic: 20 }
    },
    'flower_bouquet': { 
        name: '금방 시들 것 같은 할인 꽃다발', 
        condition: '이벤트 보상',
        stats: { attack: 10, magic: 40 }
    },
    'lightsaber': { 
        name: '작은 광선검', 
        condition: '특별 이벤트',
        stats: { attack: 150, magic: 50 }
    },
    'sausage': { 
        name: '빵에 낀 의문의 소시지', 
        condition: '히든 퀘스트',
        stats: { attack: 200, magic: 0 }
    },
    'eternal_ice': {
        name: '영원한 빙결',
        condition: '겨울 이벤트 보스 처치',
        stats: { attack: 80, magic: 120 }
    },
    'phoenix_feather': {
        name: '불사조의 깃털',
        condition: '부활 50회 달성',
        stats: { attack: 70, magic: 130 }
    }
};

// Weapon upgrade system
export const UPGRADE_SYSTEM = {
    // Success rates for each enhancement level (0-20)
    SUCCESS_RATES: [
        100, 95, 90, 85, 80,  // 0-4
        75, 70, 65, 60, 55,   // 5-9
        45, 40, 35, 30, 25,   // 10-14
        15, 10, 5, 3, 1, 0.5  // 15-19 (20 is max)
    ],
    
    // Downgrade rates (chance to go down 1 level on failure)
    DOWNGRADE_RATE: 50, // 50% chance to go down 1 level on failure
    
    // Break chance (chance to break the weapon completely on failure after +10)
    BREAK_RATES: [
        0, 0, 0, 0, 0,   // 0-4
        0, 0, 0, 0, 0,   // 5-9
        5, 10, 15, 20, 25, // 10-14
        30, 40, 50, 75, 90 // 15-19
    ],
    
    // Protection items that can be used
    PROTECTION_ITEMS: {
        'protection_scroll': {
            name: '보호 주문서',
            effect: 'Prevents weapon from breaking on failure',
            successRate: 100
        },
        'blessed_scroll': {
            name: '축복의 주문서',
            effect: 'Increases success rate by 15%',
            successRate: 15
        },
        'miracle_scroll': {
            name: '기적의 주문서',
            effect: 'Guarantees success for the next upgrade',
            successRate: 100
        }
    },
    
    // Get the success rate for a specific enhancement level
    getSuccessRate: function(level) {
        return this.SUCCESS_RATES[level] || 0;
    },
    
    // Get the break rate for a specific enhancement level
    getBreakRate: function(level) {
        return this.BREAK_RATES[level] || 0;
    },
    
    // Calculate the stats bonus based on enhancement level
    calculateStatsBonus: function(baseStats, level) {
        const multiplier = 1 + (level * 0.1); // 10% increase per level
        return {
            attack: Math.floor(baseStats.attack * multiplier),
            magic: Math.floor(baseStats.magic * multiplier)
        };
    }
};

// Export weapon types as separate constant
export { WEAPON_TYPES };

// Utility functions
export const WeaponUtils = {
    // Get a random weapon name by type
    getRandomWeapon: (type = null) => {
        const types = type ? [type] : Object.keys(WEAPON_NAMES);
        const selectedType = types[Math.floor(Math.random() * types.length)];
        const weapons = WEAPON_NAMES[selectedType];
        return {
            type: selectedType,
            name: weapons[Math.floor(Math.random() * weapons.length)],
            level: 0,
            stats: { attack: 10, magic: 5 } // Base stats
        };
    },
    
    // Get weapon stats by name and enhancement level
    getWeaponStats: (weaponName, enhancementLevel = 0) => {
        // This is a simplified example - in a real game, you'd have a more sophisticated system
        const baseAttack = 10 + (Math.random() * 20);
        const baseMagic = 5 + (Math.random() * 10);
        const multiplier = 1 + (enhancementLevel * 0.15); // 15% increase per level
        
        return {
            attack: Math.floor(baseAttack * multiplier),
            magic: Math.floor(baseMagic * multiplier),
            critical: 5 + (enhancementLevel * 0.5), // 0.5% crit per level
            attackSpeed: 1.0 - (enhancementLevel * 0.01) // Slight attack speed increase
        };
    },
    
    // Check if a weapon can be enhanced further
    canEnhance: (weapon) => {
        if (!weapon) return false;
        const maxLevel = 20; // Maximum enhancement level
        return (weapon.level || 0) < maxLevel;
    },
    
    // Simulate weapon enhancement
    enhanceWeapon: (weapon, useProtection = false) => {
        if (!WeaponUtils.canEnhance(weapon)) {
            return {
                success: false,
                message: 'Cannot enhance further',
                weapon: { ...weapon }
            };
        }
        
        const currentLevel = weapon.level || 0;
        const successRate = UPGRADE_SYSTEM.getSuccessRate(currentLevel);
        const breakRate = UPGRADE_SYSTEM.getBreakRate(currentLevel);
        const isSuccess = Math.random() * 100 < successRate;
        
        let result = { ...weapon };
        let message = '';
        
        if (isSuccess) {
            result.level = currentLevel + 1;
            message = `Enhancement to +${result.level} succeeded!`;
        } else {
            // Check if weapon breaks
            const willBreak = !useProtection && (Math.random() * 100 < breakRate);
            
            if (willBreak) {
                message = 'Enhancement failed! The weapon has been destroyed.';
                result = null; // Weapon is destroyed
            } else {
                // Check for downgrade
                const willDowngrade = currentLevel > 0 && (Math.random() * 100 < UPGRADE_SYSTEM.DOWNGRADE_RATE);
                
                if (willDowngrade) {
                    result.level = currentLevel - 1;
                    message = `Enhancement failed! Weapon downgraded to +${result.level}.`;
                } else {
                    message = 'Enhancement failed, but no downgrade occurred.';
                }
            }
        }
        
        return {
            success: isSuccess,
            message,
            weapon: result,
            isDestroyed: result === null
        };
    }
};
