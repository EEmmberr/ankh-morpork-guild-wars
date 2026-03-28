// Ankh-Morpork: Guild Wars - Game Engine
// Prototype v0.1

// Game State
const game = {
    currentPlayer: 1,
    round: 1,
    phase: 'setup', // setup, dawn, actions, watch, event
    actionsRemaining: 3,
    doubleincome: false,
    abilitiesDisabled: false,
    players: {
        1: {
            name: 'Player 1',
            guild: null,
            gold: 5,
            favors: 1,
            tokens: {}
        },
        2: {
            name: 'AI Opponent',
            guild: null,
            gold: 5,
            favors: 1,
            tokens: {}
        }
    },
    districts: {
        shades: { name: 'The Shades', income: { gold: 3, favors: 1 }, maxTokens: 4, tokens: [] },
        hub: { name: 'The Hub', income: { gold: 2, favors: 1 }, maxTokens: 5, tokens: [] },
        docks: { name: 'The Docks', income: { gold: 4, favors: 0 }, maxTokens: 4, tokens: [] },
        university: { name: 'Unseen University', income: { gold: 1, favors: 2 }, maxTokens: 3, tokens: [] }
    },
    eventDeck: [],
    selectedGuild: null
};

// Modal callback — when set, closeModal() calls this instead of nextTurn()
let modalCallback = null;

// Guilds data
const guilds = {
    thieves: {
        name: "Thieves' Guild",
        ability: "Steal 1 token from any district (2 gold)",
        abilityCost: 2,
        emoji: '🗝️'
    },
    assassins: {
        name: "Assassins' Guild",
        ability: "Remove 1 enemy token anywhere (4 gold)",
        abilityCost: 4,
        emoji: '⚔️'
    },
    seamstresses: {
        name: "Seamstresses' Guild",
        ability: "+1 gold per district (passive)",
        abilityCost: 0,
        emoji: '💋'
    }
};

// Event cards
const eventCards = [
    { name: "Tax Day", effect: "All players pay 3 gold or lose 1 token" },
    { name: "Festival", effect: "All players gain 2 gold and 1 favor" },
    { name: "The Watch Patrols", effect: "Random district raided — pay 2 gold or lose a token" },
    { name: "Patrician's Decree", effect: "No guild abilities next action phase" },
    { name: "Guild Meeting", effect: "Current player gains 2 favors" },
    { name: "Riot in The Shades", effect: "All tokens in The Shades are removed!" },
    { name: "Economic Boom", effect: "Next income collection is doubled" },
    { name: "Quiet Night", effect: "Nothing happens. Enjoy the peace." },
    { name: "Street Vendor", effect: "Player controlling The Hub gains 3 gold" },
    { name: "Vimes Investigates", effect: "Player with the most tokens loses 1" }
];

// Initialize
function init() {
    setupEventListeners();
    shuffleEventDeck();
    log("Welcome to Ankh-Morpork! Choose your guild to begin.", true);
}

function setupEventListeners() {
    document.querySelectorAll('.guild-card').forEach(card => {
        card.addEventListener('click', () => selectGuild(card.dataset.guild));
    });

    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('modal-btn').addEventListener('click', closeModal);
    document.getElementById('use-ability-btn').addEventListener('click', useAbility);
}

function selectGuild(guildKey) {
    game.selectedGuild = guildKey;

    document.querySelectorAll('.guild-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-guild="${guildKey}"]`).classList.add('selected');
    document.getElementById('start-game').disabled = false;
}

function startGame() {
    game.players[1].guild = game.selectedGuild;

    const availableGuilds = Object.keys(guilds).filter(g => g !== game.selectedGuild);
    game.players[2].guild = availableGuilds[Math.floor(Math.random() * availableGuilds.length)];

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    document.getElementById('player1-name').textContent = guilds[game.players[1].guild].emoji + ' ' + guilds[game.players[1].guild].name;
    document.getElementById('player2-name').textContent = guilds[game.players[2].guild].emoji + ' ' + guilds[game.players[2].guild].name;

    placeStartingTokens();
    renderDistricts();

    game.phase = 'dawn';
    updateUI();
    log(`Game started! ${guilds[game.players[1].guild].name} vs ${guilds[game.players[2].guild].name}`, true);

    setTimeout(() => dawnPhase(), 500);
}

function placeStartingTokens() {
    game.districts.shades.tokens.push(1);
    game.districts.hub.tokens.push(1);
    game.players[1].tokens = { shades: 1, hub: 1 };

    game.districts.docks.tokens.push(2);
    game.districts.university.tokens.push(2);
    game.players[2].tokens = { docks: 1, university: 1 };
}

function renderDistricts() {
    const container = document.getElementById('districts-container');
    container.innerHTML = '';

    Object.keys(game.districts).forEach(key => {
        const district = game.districts[key];
        const div = document.createElement('div');
        div.className = 'district';
        div.innerHTML = `
            <h3>${district.name}</h3>
            <div class="district-info">
                Income: ${district.income.gold}💰 ${district.income.favors}⭐
            </div>
            <div class="influence-display" id="${key}-tokens">
                ${renderTokens(district)}
            </div>
            <div class="district-actions">
                <button onclick="placeInfluence('${key}')" ${game.phase !== 'actions' || game.currentPlayer !== 1 ? 'disabled' : ''}>
                    Place Token (2💰)
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderTokens(district) {
    let html = '';
    district.tokens.forEach(player => {
        html += `<span class="token player${player}"></span>`;
    });
    const emptySlots = district.maxTokens - district.tokens.length;
    for (let i = 0; i < emptySlots; i++) {
        html += `<span class="token empty"></span>`;
    }
    return html;
}

function placeInfluence(districtKey) {
    const player = game.players[game.currentPlayer];
    const district = game.districts[districtKey];

    if (player.gold < 2) {
        log("Not enough gold! Need 2 gold to place influence.");
        return;
    }
    if (district.tokens.length >= district.maxTokens) {
        log("District is full! Cannot place more tokens.");
        return;
    }
    if (game.actionsRemaining <= 0) {
        log("No actions remaining this turn!");
        return;
    }

    player.gold -= 2;
    district.tokens.push(game.currentPlayer);
    if (!player.tokens[districtKey]) player.tokens[districtKey] = 0;
    player.tokens[districtKey]++;
    game.actionsRemaining--;

    log(`${player.name} placed influence in ${district.name}`);
    updateUI();
    renderDistricts();
}

// --- GUILD ABILITIES (A: targeting UI) ---

function useAbility() {
    const player = game.players[game.currentPlayer];
    const guild = guilds[player.guild];

    if (game.phase !== 'actions' || game.currentPlayer !== 1) return;
    if (game.actionsRemaining <= 0) {
        log("No actions remaining!");
        return;
    }
    if (game.abilitiesDisabled) {
        log("Guild abilities are disabled this round by the Patrician's Decree!");
        return;
    }
    if (player.guild === 'seamstresses') {
        log("Seamstresses' ability is passive (+1 gold per district).");
        return;
    }
    if (player.gold < guild.abilityCost) {
        log(`Not enough gold! ${guild.name} ability costs ${guild.abilityCost} gold.`);
        return;
    }

    showAbilityPicker(player.guild);
}

function showAbilityPicker(guildKey) {
    const validDistricts = Object.keys(game.districts).filter(key =>
        game.districts[key].tokens.includes(2)
    );

    if (validDistricts.length === 0) {
        log("No enemy tokens on the board to target!");
        return;
    }

    const isThieves = guildKey === 'thieves';
    const title = isThieves ? "Steal Influence" : "Eliminate Target";
    const text = isThieves
        ? "Choose a district to steal an enemy token from (2💰):"
        : "Choose a district to remove an enemy token from (4💰):";

    const choices = validDistricts.map(key => {
        const district = game.districts[key];
        const enemyCount = district.tokens.filter(p => p === 2).length;
        return {
            label: `${district.name}  (${enemyCount} enemy token${enemyCount !== 1 ? 's' : ''})`,
            primary: false,
            action: () => executeGuildAbility(guildKey, key)
        };
    });

    choices.push({ label: 'Cancel', primary: false, action: () => {} });

    showChoiceModal(title, text, choices);
}

function executeGuildAbility(guildKey, districtKey) {
    const player = game.players[1];
    const district = game.districts[districtKey];

    if (guildKey === 'thieves') {
        const idx = district.tokens.indexOf(2);
        district.tokens.splice(idx, 1);
        district.tokens.push(1);
        if (!player.tokens[districtKey]) player.tokens[districtKey] = 0;
        player.tokens[districtKey]++;
        player.gold -= 2;
        game.actionsRemaining--;
        log(`Stole an enemy token in ${district.name}!`, true);
    } else if (guildKey === 'assassins') {
        const idx = district.tokens.indexOf(2);
        district.tokens.splice(idx, 1);
        player.gold -= 4;
        game.actionsRemaining--;
        log(`Eliminated an enemy token in ${district.name}!`, true);
    }

    updateUI();
    renderDistricts();
}

// --- TURN FLOW ---

function dawnPhase() {
    game.phase = 'dawn';
    log(`--- ROUND ${game.round}: DAWN PHASE ---`, true);

    collectIncome(1);
    collectIncome(2);

    // Reset per-round flags after income is collected
    game.doubleincome = false;
    game.abilitiesDisabled = false;

    setTimeout(() => {
        game.phase = 'actions';
        game.actionsRemaining = 3;
        updateUI();
        log("--- ACTION PHASE ---", true);

        if (game.currentPlayer === 2) {
            setTimeout(() => aiTurn(), 1000);
        }
    }, 2000);
}

function collectIncome(playerNum) {
    const player = game.players[playerNum];
    let totalGold = 0;
    let totalFavors = 0;
    let districtsControlled = 0;

    Object.keys(game.districts).forEach(key => {
        const district = game.districts[key];
        const controller = getDistrictController(district);

        if (controller === playerNum) {
            totalGold += district.income.gold;
            totalFavors += district.income.favors;
            districtsControlled++;

            if (player.guild === 'seamstresses') {
                totalGold += 1;
            }
        }
    });

    if (game.doubleincome) {
        totalGold *= 2;
        totalFavors *= 2;
    }

    player.gold += totalGold;
    player.favors += totalFavors;

    const bonusNote = game.doubleincome ? ' (doubled!)' : '';
    log(`${player.name} collected ${totalGold}💰 ${totalFavors}⭐ from ${districtsControlled} districts${bonusNote}`);
}

function getDistrictController(district) {
    if (district.tokens.length === 0) return null;

    const counts = {};
    district.tokens.forEach(player => {
        counts[player] = (counts[player] || 0) + 1;
    });

    let maxCount = 0;
    let controller = null;
    let tie = false;

    Object.keys(counts).forEach(player => {
        if (counts[player] > maxCount) {
            maxCount = counts[player];
            controller = parseInt(player);
            tie = false;
        } else if (counts[player] === maxCount) {
            tie = true;
        }
    });

    return tie ? null : controller;
}

function endTurn() {
    if (game.phase !== 'actions') return;

    log(`${game.players[game.currentPlayer].name} ended their turn`);

    game.phase = 'watch';
    updateUI();
    setTimeout(() => watchPhase(), 1000);
}

// --- WATCH PHASE (B: interactive consequences) ---

function watchPhase() {
    log("--- WATCH PHASE ---", true);

    const roll = Math.floor(Math.random() * 6) + 1;
    const districtKeys = Object.keys(game.districts);

    if (roll === 6) {
        log(`Vimes is busy with paperwork. No Watch patrol. (rolled ${roll})`);
        setTimeout(() => eventPhase(), 1000);
        return;
    }

    let patrolledKey;
    if (roll <= 2) {
        patrolledKey = 'shades';
    } else {
        patrolledKey = districtKeys[Math.floor(Math.random() * districtKeys.length)];
    }

    const patrolledDistrict = game.districts[patrolledKey];
    log(`The Watch patrols ${patrolledDistrict.name}! (rolled ${roll})`);

    const p1Affected = patrolledDistrict.tokens.includes(1);
    const p2Affected = patrolledDistrict.tokens.includes(2);

    // Auto-resolve AI penalty first
    if (p2Affected) {
        resolveWatchPenaltyAuto(2, patrolledKey);
    }

    // Interactive choice for Player 1
    if (p1Affected) {
        const player = game.players[1];
        const canPay = player.gold >= 3;
        showChoiceModal(
            'The Watch Arrives!',
            `The Watch is patrolling ${patrolledDistrict.name}.\nPay a fine or surrender an influence token.`,
            [
                {
                    label: canPay ? 'Pay 3 Gold Fine' : 'Pay 3 Gold Fine (insufficient funds)',
                    primary: true,
                    disabled: !canPay,
                    action: () => {
                        player.gold -= 3;
                        log(`You paid 3💰 fine to The Watch in ${patrolledDistrict.name}.`);
                        updateUI();
                        eventPhase();
                    }
                },
                {
                    label: 'Lose 1 Token',
                    primary: false,
                    action: () => {
                        const idx = patrolledDistrict.tokens.indexOf(1);
                        if (idx !== -1) {
                            patrolledDistrict.tokens.splice(idx, 1);
                            if (player.tokens[patrolledKey] > 0) player.tokens[patrolledKey]--;
                        }
                        log(`You lost a token in ${patrolledDistrict.name} to The Watch.`);
                        updateUI();
                        renderDistricts();
                        eventPhase();
                    }
                }
            ]
        );
    } else {
        setTimeout(() => eventPhase(), 1500);
    }
}

function resolveWatchPenaltyAuto(playerNum, districtKey) {
    const player = game.players[playerNum];
    const district = game.districts[districtKey];
    if (player.gold >= 3) {
        player.gold -= 3;
        log(`${player.name} paid 3💰 fine to The Watch.`);
    } else {
        const idx = district.tokens.indexOf(playerNum);
        if (idx !== -1) {
            district.tokens.splice(idx, 1);
            if (player.tokens[districtKey] > 0) player.tokens[districtKey]--;
        }
        log(`${player.name} lost a token in ${district.name} to The Watch.`);
    }
}

// --- EVENT PHASE (C: all effects wired up) ---

function eventPhase() {
    log("--- EVENT PHASE ---", true);

    if (game.eventDeck.length === 0) {
        shuffleEventDeck();
    }

    const event = game.eventDeck.pop();
    applyEventEffect(event);
    showModal(event.name, event.effect);
}

function applyEventEffect(event) {
    switch (event.name) {
        case "Festival":
            game.players[1].gold += 2;
            game.players[1].favors += 1;
            game.players[2].gold += 2;
            game.players[2].favors += 1;
            log("Festival! All players gained 2💰 1⭐", true);
            break;

        case "Economic Boom":
            game.doubleincome = true;
            log("Economic Boom! Next income collection is doubled!", true);
            break;

        case "Tax Day":
            [1, 2].forEach(playerNum => {
                const player = game.players[playerNum];
                if (player.gold >= 3) {
                    player.gold -= 3;
                    log(`${player.name} paid 3💰 in taxes.`);
                } else {
                    // Lose a token from the district where they have most tokens
                    let targetKey = null;
                    let maxCount = 0;
                    Object.keys(game.districts).forEach(key => {
                        const count = game.districts[key].tokens.filter(p => p === playerNum).length;
                        if (count > maxCount) { maxCount = count; targetKey = key; }
                    });
                    if (targetKey) {
                        const idx = game.districts[targetKey].tokens.indexOf(playerNum);
                        game.districts[targetKey].tokens.splice(idx, 1);
                        log(`${player.name} couldn't pay taxes and lost a token in ${game.districts[targetKey].name}!`);
                    } else {
                        log(`${player.name} has nothing to lose to the taxman.`);
                    }
                }
            });
            renderDistricts();
            break;

        case "The Watch Patrols": {
            const keys = Object.keys(game.districts);
            const raidedKey = keys[Math.floor(Math.random() * keys.length)];
            const raided = game.districts[raidedKey];
            log(`The Watch raids ${raided.name}! Those present pay 2💰 or lose a token.`, true);
            [1, 2].forEach(playerNum => {
                if (raided.tokens.includes(playerNum)) {
                    const p = game.players[playerNum];
                    if (p.gold >= 2) {
                        p.gold -= 2;
                        log(`${p.name} paid 2💰 raid fine.`);
                    } else {
                        const idx = raided.tokens.indexOf(playerNum);
                        raided.tokens.splice(idx, 1);
                        log(`${p.name} lost a token in ${raided.name}!`);
                    }
                }
            });
            renderDistricts();
            break;
        }

        case "Patrician's Decree":
            game.abilitiesDisabled = true;
            log("Patrician's Decree! Guild abilities are disabled next action phase.", true);
            break;

        case "Guild Meeting":
            game.players[game.currentPlayer].favors += 2;
            log(`${game.players[game.currentPlayer].name} attends the Guild Meeting and gains 2⭐!`, true);
            break;

        case "Riot in The Shades":
            game.districts.shades.tokens = [];
            log("Riot in The Shades! All tokens removed from The Shades!", true);
            renderDistricts();
            break;

        case "Quiet Night":
            log("Quiet Night. Nothing stirs in Ankh-Morpork.");
            break;

        case "Street Vendor": {
            const hubController = getDistrictController(game.districts.hub);
            if (hubController) {
                game.players[hubController].gold += 3;
                log(`${game.players[hubController].name} controls The Hub and gains 3💰 from the Street Vendor!`, true);
            } else {
                log("No one controls The Hub. The Street Vendor packs up and leaves.");
            }
            break;
        }

        case "Vimes Investigates": {
            let p1Total = 0, p2Total = 0;
            Object.values(game.districts).forEach(d => {
                p1Total += d.tokens.filter(p => p === 1).length;
                p2Total += d.tokens.filter(p => p === 2).length;
            });
            const suspect = p1Total > p2Total ? 1 : p2Total > p1Total ? 2 : null;
            if (suspect) {
                for (const key of Object.keys(game.districts)) {
                    const d = game.districts[key];
                    const idx = d.tokens.indexOf(suspect);
                    if (idx !== -1) {
                        d.tokens.splice(idx, 1);
                        log(`Vimes Investigates! ${game.players[suspect].name} loses 1 token from ${d.name}!`, true);
                        break;
                    }
                }
                renderDistricts();
            } else {
                log("Vimes finds no clear culprit (equal tokens). He goes home for tea.");
            }
            break;
        }
    }

    updateUI();
}

// --- MODAL SYSTEM ---

function showModal(title, text) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal-choices').style.display = 'none';
    document.getElementById('modal-choices').innerHTML = '';
    document.getElementById('modal-btn').style.display = '';
    document.getElementById('modal').classList.add('show');
}

function showChoiceModal(title, text, choices) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal-btn').style.display = 'none';

    const choicesDiv = document.getElementById('modal-choices');
    choicesDiv.innerHTML = '';
    choicesDiv.style.display = 'flex';

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = choice.primary ? 'primary' : '';
        btn.textContent = choice.label;
        btn.disabled = choice.disabled || false;
        btn.onclick = () => {
            document.getElementById('modal').classList.remove('show');
            choicesDiv.innerHTML = '';
            choicesDiv.style.display = 'none';
            document.getElementById('modal-btn').style.display = '';
            choice.action();
        };
        choicesDiv.appendChild(btn);
    });

    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');

    const cb = modalCallback;
    modalCallback = null;
    if (cb) {
        cb();
    } else {
        nextTurn();
    }
}

function nextTurn() {
    game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;

    if (game.currentPlayer === 1) {
        game.round++;
    }

    if (checkWinCondition()) return;

    dawnPhase();
}

// --- AI ---

function aiTurn() {
    log("AI is taking their turn...", true);

    const ai = game.players[2];
    let actionsLeft = 3;

    const aiActions = setInterval(() => {
        if (actionsLeft <= 0) {
            clearInterval(aiActions);
            setTimeout(() => endTurn(), 1000);
            return;
        }

        let bestDistrict = null;
        let bestScore = -999;

        Object.keys(game.districts).forEach(key => {
            const district = game.districts[key];
            if (district.tokens.length < district.maxTokens) {
                const enemyTokens = district.tokens.filter(p => p === 1).length;
                const ourTokens = district.tokens.filter(p => p === 2).length;
                const score = district.income.gold + district.income.favors - enemyTokens + ourTokens;
                if (score > bestScore) {
                    bestScore = score;
                    bestDistrict = key;
                }
            }
        });

        if (bestDistrict && ai.gold >= 2) {
            game.districts[bestDistrict].tokens.push(2);
            ai.gold -= 2;
            log(`AI placed token in ${game.districts[bestDistrict].name}`);
            renderDistricts();
            updateUI();
        }

        actionsLeft--;
    }, 1500);
}

// --- WIN CONDITIONS ---

function checkWinCondition() {
    for (const playerNum of Object.keys(game.players)) {
        const player = game.players[playerNum];

        if (player.gold >= 50) {
            showVictoryModal(`${player.name} wins with 50+ gold!`);
            return true;
        }

        let controlledDistricts = 0;
        Object.keys(game.districts).forEach(key => {
            if (getDistrictController(game.districts[key]) === parseInt(playerNum)) {
                controlledDistricts++;
            }
        });

        if (controlledDistricts >= 3) {
            showVictoryModal(`${player.name} wins by controlling ${controlledDistricts} districts!`);
            return true;
        }
    }

    return false;
}

function showVictoryModal(message) {
    showChoiceModal(
        "VICTORY!",
        message,
        [{ label: "Play Again", primary: true, action: () => location.reload() }]
    );
}

function shuffleEventDeck() {
    game.eventDeck = [...eventCards].sort(() => Math.random() - 0.5);
    log("Event deck shuffled");
}

// --- UI ---

function updateUI() {
    document.getElementById('current-phase').textContent = game.phase.charAt(0).toUpperCase() + game.phase.slice(1);
    document.getElementById('round-number').textContent = game.round;
    document.getElementById('actions-remaining').textContent = game.actionsRemaining;

    document.getElementById('player1-gold').textContent = game.players[1].gold;
    document.getElementById('player1-favors').textContent = game.players[1].favors;
    document.getElementById('player2-gold').textContent = game.players[2].gold;
    document.getElementById('player2-favors').textContent = game.players[2].favors;

    let p1Districts = 0, p2Districts = 0;
    Object.keys(game.districts).forEach(key => {
        const controller = getDistrictController(game.districts[key]);
        if (controller === 1) p1Districts++;
        if (controller === 2) p2Districts++;
    });

    document.getElementById('player1-districts').textContent = p1Districts;
    document.getElementById('player2-districts').textContent = p2Districts;

    let p1Tokens = 0, p2Tokens = 0;
    Object.values(game.districts).forEach(district => {
        p1Tokens += district.tokens.filter(p => p === 1).length;
        p2Tokens += district.tokens.filter(p => p === 2).length;
    });

    document.getElementById('player1-tokens').textContent = p1Tokens;
    document.getElementById('player2-tokens').textContent = p2Tokens;

    document.getElementById('player1-panel').classList.toggle('active', game.currentPlayer === 1);
    document.getElementById('player2-panel').classList.toggle('active', game.currentPlayer === 2);

    const abilityDisabled = game.phase !== 'actions' || game.currentPlayer !== 1 || game.abilitiesDisabled;
    document.getElementById('end-turn-btn').disabled = game.phase !== 'actions' || game.currentPlayer !== 1;
    document.getElementById('use-ability-btn').disabled = abilityDisabled;
}

function log(message, important = false) {
    const container = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (important ? ' important' : '');
    entry.textContent = message;
    container.insertBefore(entry, container.firstChild);

    while (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', init);
