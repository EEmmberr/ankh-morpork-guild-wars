# Ankh-Morpork: Guild Wars - Playable Prototype v0.1

🔥 **It's alive!** A working browser-based prototype of the game.

---

## How to Play

1. **Open** `game.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
2. **Choose your guild** (Thieves, Assassins, or Seamstresses)
3. **Click "Start Game"**
4. **Play!**

No server needed. No installation required. Just open and play.

---

## What's Implemented

### ✅ Core Mechanics
- **4 Districts** (simplified from 8): The Shades, The Hub, The Docks, Unseen University
- **2 Players**: You vs Simple AI
- **3 Guilds**: Thieves, Assassins, Seamstresses (with abilities)
- **Turn Phases**: Dawn (collect income) → Actions (3 per turn) → Watch (patrol) → Event (card draw)
- **Actions**: Place influence tokens, use guild abilities
- **District Control**: Most tokens = control = income
- **Income**: Gold + Favors based on controlled districts
- **Win Conditions**: 50 gold OR control 3+ districts

### ✅ UI Features
- Visual district board with token display
- Player panels showing resources
- Event log tracking game history
- Phase indicator
- Modal popups for events
- Responsive layout

### ✅ AI Opponent
- Simple rule-based AI
- Evaluates districts and places tokens strategically
- Takes 3 actions per turn

---

## What's Missing (Future Versions)

### Phase 2 (Next)
- [ ] All 8 districts
- [ ] All 6 guilds
- [ ] Full event deck (40 cards) with real effects
- [ ] Contract cards (30 cards)
- [ ] Watch raids with consequences (pay fine or lose token)
- [ ] Better AI (multiple difficulty levels)
- [ ] Trading between players
- [ ] More win conditions (complete 3 major contracts)

### Phase 3 (Polish)
- [ ] Card art and illustrations
- [ ] Animated token placement
- [ ] Sound effects
- [ ] Save/load game
- [ ] Multiple AI opponents (3-5 players)
- [ ] Online multiplayer

---

## Current Gameplay

**Setup:**
- Choose guild
- 2 starting tokens placed automatically
- Start with 5 gold, 1 favor

**Each Turn:**
1. **Dawn:** Collect income from controlled districts
2. **Actions:** Take up to 3 actions:
   - Place influence token (costs 2 gold)
   - Use guild ability (costs vary)
3. **Watch:** Dice roll determines patrol location
4. **Event:** Draw and resolve event card
5. Next player's turn

**Guild Abilities:**
- **Thieves:** Steal token from adjacent district (2 gold) *[simplified in prototype]*
- **Assassins:** Remove any enemy token (4 gold) *[simplified in prototype]*
- **Seamstresses:** +1 gold per controlled district (passive)

**Win Conditions:**
- First to 50 gold
- Control 3+ districts at end of round

---

## Known Issues / Limitations

- Guild abilities are simplified (no district selection UI yet)
- Event effects are mostly placeholder
- Watch phase doesn't apply penalties yet
- No contract cards
- AI is basic (doesn't use abilities)
- No save/load
- Single player only

---

## Testing Focus

When playing, pay attention to:
- **Balance**: Are guilds roughly equal in power?
- **Pacing**: How many rounds to win? Too fast/slow?
- **Fun factor**: Are decisions interesting?
- **Clarity**: Is it clear what's happening?

---

## Tech Stack

- Pure HTML/CSS/JavaScript
- No frameworks or dependencies
- ~600 lines of code total
- Works offline

---

## Next Steps

1. **Play 5-10 games** to test core mechanics
2. **Gather feedback** on balance and fun
3. **Iterate** on rules based on playtesting
4. **Add missing features** (contracts, full events, better AI)
5. **Polish UI** (animations, better visuals)

---

## File Structure

```
prototype/
├── game.html        # Main game page (HTML + CSS)
├── game.js          # Game logic (~500 lines)
└── README.md        # This file
```

---

**Ready to playtest!** 🎲🔥

Open `game.html` and let me know what you think!
