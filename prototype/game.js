// Ankh-Morpork: Guild Wars - Game Engine
// Prototype v0.1

// Game State
const game = {
    currentPlayer: 1,
    round: 1,
    phase: 'setup', // setup, dawn, actions, watch, event
    actionsRemaining: 3,
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

// Guilds data
const guilds = {
    thieves: {
        name: "Thieves' Guild",
        ability: "Steal 1 token from adjacent district",
        abilityCost: 2,
        emoji: '🗝️'
    },
    assassins: {
        name: "Assassins' Guild",
        ability: "Remove 1 enemy token anywhere",
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

// Event cards (simplified deck)
const eventCards = [
    { name: "Tax Day", effect: "All players pay 3 gold or lose 1 token" },
    { name: "Festival", effect: "All players gain 2 gold and 1 favor" },
    { name: "The Watch Patrols", effect: "Random district raided" },
    { name: "Patrician's Decree", effect: "No abilities this round" },
    { name: "Guild Meeting", effect: "Current player gains 2 favors" },
    { name: "Riot in The Shades", effect: "All tokens in The Shades removed" },
    { name: "Economic Boom", effect: "Districts generate double income" },
    { name: "Quiet Night", effect: "Nothing happens" },
    { name: "Street Vendor", effect: "Players controlling The Hub gain 3 gold" },
    { name: "Vimes Investigates", effect: "Player with most tokens loses 1" }
];

// Initialize
function init() {
    setupEventListeners();
    shuffleEventDeck();
    log("Welcome to Ankh-Morpork! Choose your guild to begin.", true);
}

function setupEventListeners() {
    // Guild selection
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
    
    // Visual feedback
    document.querySelectorAll('.guild-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-guild="${guildKey}"]`).classList.add('selected');
    
    document.getElementById('start-game').disabled = false;
}

function startGame() {
    // Assign guilds
    game.players[1].guild = game.selectedGuild;
    
    // AI picks random guild (not same as player)
    const availableGuilds = Object.keys(guilds).filter(g => g !== game.selectedGuild);
    game.players[2].guild = availableGuilds[Math.floor(Math.random() * availableGuilds.length)];
    
    // Update UI
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    document.getElementById('player1-name').textContent = guilds[game.players[1].guild].emoji + ' ' + guilds[game.players[1].guild].name;
    document.getElementById('player2-name').textContent = guilds[game.players[2].guild].emoji + ' ' + guilds[game.players[2].guild].name;
    
    // Place starting tokens
    placeStartingTokens();
    
    // Render districts
    renderDistricts();
    
    // Start first turn
    game.phase = 'dawn';
    updateUI();
    log(`Game started! ${guilds[game.players[1].guild].name} vs ${guilds[game.players[2].guild].name}`, true);
    
    // Run dawn phase
    setTimeout(() => dawnPhase(), 500);
}

function placeStartingTokens() {
    // Player 1 starts in Shades and Hub
    game.districts.shades.tokens.push(1);
    game.districts.hub.tokens.push(1);
    game.players[1].tokens = { shades: 1, hub: 1 };
    
    // Player 2 starts in Docks and University
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
    
    // Show existing tokens
    district.tokens.forEach(player => {
        html += `<span class="token player${player}"></span>`;
    });
    
    // Show empty slots
    const emptySlots = district.maxTokens - district.tokens.length;
    for (let i = 0; i < emptySlots; i++) {
        html += `<span class="token empty"></span>`;
    }
    
    return html;
}

function placeInfluence(districtKey) {
    const player = game.players[game.currentPlayer];
    const district = game.districts[districtKey];
    
    // Check if player has enough gold
    if (player.gold < 2) {
        log("Not enough gold! Need 2 gold to place influence.");
        return;
    }
    
    // Check if district is full
    if (district.tokens.length >= district.maxTokens) {
        log("District is full! Cannot place more tokens.");
        return;
    }
    
    // Check if actions remaining
    if (game.actionsRemaining <= 0) {
        log("No actions remaining this turn!");
        return;
    }
    
    // Place token
    player.gold -= 2;
    district.tokens.push(game.currentPlayer);
    if (!player.tokens[districtKey]) player.tokens[districtKey] = 0;
    player.tokens[districtKey]++;
    
    game.actionsRemaining--;
    
    log(`${player.name} placed influence in ${district.name}`);
    updateUI();
    renderDistricts();
}

function useAbility() {
    const player = game.players[game.currentPlayer];
    const guild = guilds[player.guild];
    
    if (game.phase !== 'actions' || game.currentPlayer !== 1) {
        return;
    }
    
    if (game.actionsRemaining <= 0) {
        log("No actions remaining!");
        return;
    }
    
    if (player.gold < guild.abilityCost) {
        log(`Not enough gold! ${guild.name} ability costs ${guild.abilityCost} gold.`);
        return;
    }
    
    // Execute ability based on guild
    if (player.guild === 'thieves') {
        log("Thieves' ability: Select a district to steal from (simplified: steals from The Hub)");
        // Simplified: steal from Hub if possible
        if (game.districts.hub.tokens.includes(2)) {
            const idx = game.districts.hub.tokens.indexOf(2);
            game.districts.hub.tokens.splice(idx, 1);
            game.districts.shades.tokens.push(1);
            player.gold -= 2;
            game.actionsRemaining--;
            log("Stole token from The Hub!");
        } else {
            log("No enemy tokens in The Hub to steal!");
        }
    } else if (player.guild === 'assassins') {
        log("Assassins' ability: Remove enemy token (simplified: removes from The Docks)");
        // Simplified: remove from Docks if possible
        if (game.districts.docks.tokens.includes(2)) {
            const idx = game.districts.docks.tokens.indexOf(2);
            game.districts.docks.tokens.splice(idx, 1);
            player.gold -= 4;
            game.actionsRemaining--;
            log("Eliminated enemy token from The Docks!");
        } else {
            log("No enemy tokens in The Docks!");
        }
    } else if (player.guild === 'seamstresses') {
        log("Seamstresses' ability is passive (+1 gold per district)");
        return;
    }
    
    updateUI();
    renderDistricts();
}

function dawnPhase() {
    game.phase = 'dawn';
    log(`--- ROUND ${game.round}: DAWN PHASE ---`, true);
    
    // Collect income
    collectIncome(1);
    collectIncome(2);
    
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
    
    // Check each district
    Object.keys(game.districts).forEach(key => {
        const district = game.districts[key];
        const controller = getDistrictController(district);
        
        if (controller === playerNum) {
            totalGold += district.income.gold;
            totalFavors += district.income.favors;
            districtsControlled++;
            
            // Seamstresses' passive
            if (player.guild === 'seamstresses') {
                totalGold += 1;
            }
        }
    });
    
    player.gold += totalGold;
    player.favors += totalFavors;
    
    log(`${player.name} collected ${totalGold}💰 ${totalFavors}⭐ from ${districtsControlled} districts`);
}

function getDistrictController(district) {
    if (district.tokens.length === 0) return null;
    
    // Count tokens per player
    const counts = {};
    district.tokens.forEach(player => {
        counts[player] = (counts[player] || 0) + 1;
    });
    
    // Find player with most tokens
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
    
    // Watch phase
    game.phase = 'watch';
    updateUI();
    setTimeout(() => watchPhase(), 1000);
}

function watchPhase() {
    log("--- WATCH PHASE ---", true);
    
    const roll = Math.floor(Math.random() * 6) + 1;
    const districtKeys = Object.keys(game.districts);
    
    if (roll <= 2) {
        log(`The Watch patrols The Shades! (rolled ${roll})`);
        // Players in Shades pay fine or lose token
        if (game.districts.shades.tokens.length > 0) {
            log("Players in The Shades must pay 3 gold or lose a token (automated)");
        }
    } else if (roll === 6) {
        log(`Vimes is busy with paperwork. No Watch patrol. (rolled ${roll})`);
    } else {
        const randomDistrict = districtKeys[Math.floor(Math.random() * districtKeys.length)];
        log(`The Watch patrols ${game.districts[randomDistrict].name}! (rolled ${roll})`);
    }
    
    setTimeout(() => eventPhase(), 1500);
}

function eventPhase() {
    log("--- EVENT PHASE ---", true);
    
    if (game.eventDeck.length === 0) {
        shuffleEventDeck();
    }
    
    const event = game.eventDeck.pop();
    showModal(event.name, event.effect);
    
    // Apply event effect (simplified)
    applyEventEffect(event);
}

function applyEventEffect(event) {
    if (event.name === "Festival") {
        game.players[1].gold += 2;
        game.players[1].favors += 1;
        game.players[2].gold += 2;
        game.players[2].favors += 1;
        log("All players gained 2💰 1⭐");
    } else if (event.name === "Economic Boom") {
        log("Next income is doubled!");
    }
    // Add more event effects here
    
    updateUI();
}

function showModal(title, text) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    
    // Move to next turn
    nextTurn();
}

function nextTurn() {
    // Switch player
    game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
    
    if (game.currentPlayer === 1) {
        game.round++;
    }
    
    // Check win conditions
    if (checkWinCondition()) {
        return;
    }
    
    // Start dawn phase
    dawnPhase();
}

function aiTurn() {
    log("AI is taking their turn...", true);
    
    const ai = game.players[2];
    let actionsLeft = 3;
    
    // Simple AI: try to place tokens in districts with least enemy presence
    const aiActions = setInterval(() => {
        if (actionsLeft <= 0) {
            clearInterval(aiActions);
            setTimeout(() => endTurn(), 1000);
            return;
        }
        
        // Find best district to place token
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

function checkWinCondition() {
    // Check if anyone has won
    Object.keys(game.players).forEach(playerNum => {
        const player = game.players[playerNum];
        
        // Gold victory
        if (player.gold >= 50) {
            showModal("VICTORY!", `${player.name} wins with 50+ gold!`);
            return true;
        }
        
        // District control victory
        let controlledDistricts = 0;
        Object.keys(game.districts).forEach(key => {
            if (getDistrictController(game.districts[key]) === parseInt(playerNum)) {
                controlledDistricts++;
            }
        });
        
        if (controlledDistricts >= 3) {
            showModal("VICTORY!", `${player.name} wins by controlling 3+ districts!`);
            return true;
        }
    });
    
    return false;
}

function shuffleEventDeck() {
    game.eventDeck = [...eventCards].sort(() => Math.random() - 0.5);
    log("Event deck shuffled");
}

function updateUI() {
    // Update phase indicator
    document.getElementById('current-phase').textContent = game.phase.charAt(0).toUpperCase() + game.phase.slice(1);
    document.getElementById('round-number').textContent = game.round;
    document.getElementById('actions-remaining').textContent = game.actionsRemaining;
    
    // Update player panels
    document.getElementById('player1-gold').textContent = game.players[1].gold;
    document.getElementById('player1-favors').textContent = game.players[1].favors;
    document.getElementById('player2-gold').textContent = game.players[2].gold;
    document.getElementById('player2-favors').textContent = game.players[2].favors;
    
    // Count controlled districts
    let p1Districts = 0, p2Districts = 0;
    Object.keys(game.districts).forEach(key => {
        const controller = getDistrictController(game.districts[key]);
        if (controller === 1) p1Districts++;
        if (controller === 2) p2Districts++;
    });
    
    document.getElementById('player1-districts').textContent = p1Districts;
    document.getElementById('player2-districts').textContent = p2Districts;
    
    // Count tokens on board
    let p1Tokens = 0, p2Tokens = 0;
    Object.values(game.districts).forEach(district => {
        p1Tokens += district.tokens.filter(p => p === 1).length;
        p2Tokens += district.tokens.filter(p => p === 2).length;
    });
    
    document.getElementById('player1-tokens').textContent = p1Tokens;
    document.getElementById('player2-tokens').textContent = p2Tokens;
    
    // Highlight active player
    document.getElementById('player1-panel').classList.toggle('active', game.currentPlayer === 1);
    document.getElementById('player2-panel').classList.toggle('active', game.currentPlayer === 2);
    
    // Enable/disable buttons
    document.getElementById('end-turn-btn').disabled = game.phase !== 'actions' || game.currentPlayer !== 1;
    document.getElementById('use-ability-btn').disabled = game.phase !== 'actions' || game.currentPlayer !== 1;
}

function log(message, important = false) {
    const container = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (important ? ' important' : '');
    entry.textContent = message;
    container.insertBefore(entry, container.firstChild);
    
    // Keep only last 20 entries
    while (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', init);
