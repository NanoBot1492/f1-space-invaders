# F1 Racer: Space Invaders with Red Bull Formula One Theme

## Product Vision
A browser-based recreation of the classic Space Invaders arcade game with a Red Bull Formula One twist, designed to be both an engaging gaming experience and a learning platform for web game development with React and Canvas.

## Objectives
- Create an authentic, engaging Space Invaders experience with F1 aesthetics
- Provide a clean React + Canvas codebase for learning web game development
- Establish an organized `/ai` folder for experimenting with AI techniques in games
- Ensure the project is responsive and playable on mobile devices
- Build with a modern twist that incorporates Red Bull Racing Formula One branding and themes

## Target Audience
- Formula One racing fans
- Retro gaming enthusiasts
- Developers learning React game development
- AI enthusiasts interested in game AI applications
- Mobile gamers seeking quick, enjoyable browser games

## Core Game Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Player Controls** | Move F1 car left/right, fire projectiles (maybe as "boost" or "missiles") | High |
| **Alien Formation** | Grid of opponent F1 cars/tires descending in patterns | High |
| **Projectile System** | Player missiles and opponent retaliatory fire | High |
| **Collision Detection** | Missile-car, car-player, missile-barrier hits | High |
| **Scoring System** | Points per opponent destroyed, lap time bonuses, high score tracking | High |
| **Lives System** | 3 lives (representing car durability), game over on depletion | High |
| **Progressive Difficulty** | Opponent speed/aggressiveness increases as fewer remain | Medium |
| **Sound Effects** | F1 engine sounds, crash effects, crowd noises | Medium |
| **Barriers** | Destructible tire barriers or pit lane equipment | Medium |
| **UI/Feedback** | Start screen with RB logo, game over display, pause functionality, lap counter | Medium |
| **Responsive Design** | Fully playable on mobile touch controls and desktop | High |
| **F1 Theme Elements** | Red Bull livery, track background, pit stop animations, podium celebrations | High |

## AI Experimentation Ideas (`/ai` folder)
*These are suggestions for future exploration - not required for MVP:*
- **Adaptive Difficulty**: ML model adjusting opponent speed/fire rate based on player performance
- **Behavior Prediction**: Using simple models to anticipate player movements for opponent AI
- **Procedural Track Generation**: AI-generated F1 track layouts or obstacle patterns
- **Player Style Analysis**: Clustering players by aggression/defensiveness tendencies (bumping vs. clean driving)
- **Pit Stop Strategy**: Reinforcement learning for optimal pit stop timing during gameplay
- **Tire Wear Simulation**: ML models predicting degradation based on driving style

## Technical Requirements
- **Frontend**: React 18, HTML5 Canvas, CSS3, Modern JavaScript (ES6+)
- **State Management**: React hooks (useState, useEffect, useReducer) or Context API
- **Animation**: requestAnimationFrame for game loop, CSS animations for UI
- **Optional AI Library**: TensorFlow.js (for browser-based ML experiments in `/ai` folder)
- **Development Tools**: Git, VS Code (or preferred IDE), npm
- **Dependencies**: Minimal external dependencies for learning focus
- **Browser Support**: Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile Support**: Touch controls responsive design

## Project Structure
```
f1-racer-ai-project/
├── /public                 # Static assets
│   ├── index.html          # Main HTML template
│   ├── /assets             # Images, sounds, sprites
│   │   ├── /images         # Car sprites, track backgrounds, RB logos
│   │   ├── /sounds         # Engine, crash, crowd audio
│   │   └── /sprites        # Sprite sheets for animations
│   └── favicon.ico
├── /src                    # Main application source
│   ├── /components         # React components
│   │   ├── /game           # Game-specific components
│   │   │   ├── GameCanvas.jsx      # Main canvas rendering
│   │   │   ├── GameControls.jsx    # Touch/keyboard controls
│   │   │   ├── GameStats.jsx       # Score, lives, lap display
│   │   │   └── /entities           # Game objects (PlayerCar, OpponentCar, Missile, etc.)
│   │   ├── /layout         # Page layout components
│   │   │   ├── Header.jsx          # RB branding, lap counter
│   │   │   └── Footer.jsx
│   │   └── /ui             # Reusable UI components
│   │       ├── Button.jsx
│   │       └── Modal.jsx
│   ├── /hooks              # Custom React hooks
│   │   ├── useGameLoop.js
│   │   ├── useControls.js
│   │   └── useCollisions.js
│   ├── /utils              # Helper functions
│   │   ├── collisionDetection.js
│   │   ├── mathUtils.js
│   │   └── constants.js    # Game constants (speeds, sizes, colors, RB colors)
│   ├── /styles             # CSS/Sass files
│   │   ├── index.css
│   │   ├── game.css
│   │   └── responsive.css
│   ├── /ai                 # AI experimentation folder
│   │   ├── /models         # Saved ML models (if any)
│   │   ├── /notebooks      # Experiment logs/journal
│   │   ├── /scripts        # AI training/testing scripts
│   │   └── README.ai.md    # Guide to AI experiments
│   ├── /services           # API calls, external services
│   ├── App.js              # Main app component
│   ├── index.js            # React entry point
│   └── serviceWorker.js    # PWA support (optional)
├── /tests                  # Unit/integration tests
├── /docs                   # Documentation
│   ├── PRD.md              # This document
│   ├── TODO.md             # Feature backlog
│   └── DESIGN.md           # Technical design decisions
├── package.json            # Project metadata & scripts
├── README.md               # Project overview & setup
└── .gitignore              # Git ignore file
```

## Success Criteria (MVP)
- [ ] Playable in browser with keyboard controls AND mobile touch controls
- [ ] Clear win/lose conditions (destroy all opponents or lose all lives)
- [ ] Opponent formation moves and descends correctly with F1-themed sprites
- [ ] Collision detection works for all object types
- [ ] Score, lives, and lap counter display update accurately
- [ ] Basic F1-themed sound effects play (engine, crash, etc.)
- [ ] Responsive layout works on mobile and desktop
- [ ] Code is well-commented and organized for learning
- [ ] `/ai` folder exists with placeholder experimentation ideas
- [ ] Visible Red Bull Racing theme elements (colors, logos, branding where permissible)

## Open Questions Addressed
Based on your responses:
1. **Tech Stack**: React + Canvas (chosen)
2. **AI Focus**: Experimental folder (`/ai`) for learning, not integrated core features
3. **Scope**: Modern twist with Red Bull Formula One theme (not just a clone)
4. **Platform**: Mobile-responsive with touch controls priority

## Next Steps
Once this PRD is approved, we'll:
1. Set up the React project with Create React App
2. Implement the basic game loop with Canvas
3. Create the F1-themed assets (or placeholders)
4. Build core gameplay mechanics
5. Add responsive touch controls
6. Implement scoring and UI
7. Set up the `/ai` experimentation folder
8. Add basic sound effects
9. Ensure mobile responsiveness
10. Apply Red Bull Racing theme aesthetics

## Non-Goals (for MVP)
- Official Red Bull licensing (using inspiration/theme only)
- Multiplayer functionality
- Complex physics simulation
- Advanced AI opponents (beyond pattern movement)
- Official F1 track licenses (generic track design)
- Complex career mode or progression system

---
*PRD Version 0.1.0 - Ready for development kickoff*