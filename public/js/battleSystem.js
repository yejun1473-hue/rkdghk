// public/js/battleSystem.js
export class BattleSystem {
    static startBattle(player1, player2) {
        const battleLog = [];
        
        // 1. 승자 결정
        const specialEffects = this.getWeaponEffects(player1.weapon, player2.weapon);
        const winner = specialEffects.winner === 1 ? player1 : player2;
        const loser = winner === player1 ? player2 : player1;
        
        // 2. 전리품 계산 (50~150G 사이 랜덤)
        const goldReward = Math.floor(Math.random() * 101) + 50;
        
        // 3. 결과 메시지
        battleLog.push(`${winner.name} 이(가) ${loser.name} 과(와) 대결하여 승리`);
        
        return {
            winner: winner,
            gold: goldReward,
            log: battleLog
        };
    }

    static getWeaponEffects(weapon1, weapon2) {
        // 무기 조합에 따른 특수 효과 정의
        const effects = {
            '거슬리는 음파 검': {
                '압사시키는 몽둥이': {
                    effect: `『${weapon1}』 검사, 검을 들려 하자 『${weapon2}』의 진동이 시작됩니다. → 『${weapon2}』의 내부 압력으로 검사가 스스로 압사당해 버립니다.`,
                    winner: 1
                },
                '불타는 화염검': {
                    effect: `『${weapon1}』의 진동이 『${weapon2}』의 불꽃을 증폭시켜 폭발! → 『${weapon2}』 사용자가 기절했습니다.`,
                    winner: 1
                }
            },
            '압사시키는 몽둥이': {
                '얼음 파동검': {
                    effect: `『${weapon2}』의 한기가 『${weapon1}』의 압력을 얼려버렸다! → 압력이 폭발하며 『${weapon1}』 사용자가 날아갔습니다.`,
                    winner: 2
                }
            }
        };

        // 일치하는 효과가 있으면 반환, 없으면 기본 효과 반환
        if (effects[this.getBaseWeaponName(weapon1)]?.[this.getBaseWeaponName(weapon2)]) {
            return effects[this.getBaseWeaponName(weapon1)][this.getBaseWeaponName(weapon2)];
        } else if (effects[this.getBaseWeaponName(weapon2)]?.[this.getBaseWeaponName(weapon1)]) {
            const effect = effects[this.getBaseWeaponName(weapon2)][this.getBaseWeaponName(weapon1)];
            return {
                effect: effect.effect,
                winner: effect.winner === 1 ? 2 : 1
            };
        } else {
            // 기본 효과 (무작위 승패)
            const winner = Math.random() < 0.5 ? 1 : 2;
            const winnerWeapon = winner === 1 ? weapon1 : weapon2;
            const loserWeapon = winner === 1 ? weapon2 : weapon1;
            const defaultEffects = [
                `『${winnerWeapon}』의 기운이 『${loserWeapon}』을(를) 압도했습니다!`,
                `『${winnerWeapon}』의 위력에 『${loserWeapon}』 사용자가 제대로 대응하지 못했습니다.`
            ];
            return {
                effect: defaultEffects[Math.floor(Math.random() * defaultEffects.length)],
                winner: winner
            };
        }
    }

    static getBaseWeaponName(weaponName) {
        // [+숫자] 접두사 제거
        return weaponName.replace(/^\[\+\d+\]\s*/, '');
    }
}

// 사용 예시
export function runExampleBattle() {
    const player1 = {
        name: '플레이어1',
        weapon: '[+2] 거슬리는 음파 검'
    };

    const player2 = {
        name: '적',
        weapon: '[+1] 불타는 화염검'
    };

    const battle = new BattleSystem();
    return battle.startBattle(player1, player2);
}

// 예시 배틀 실행 (콘솔에서 확인 가능)
const exampleResult = runExampleBattle();
console.log('=== 배틀 결과 ===');
console.log(exampleResult.log[0]);  // Only show the result line
