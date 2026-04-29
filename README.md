# F1 Racer: Space Invaders with Red Bull Formula One Theme

A browser-based recreation of the classic Space Invaders arcade game with a Red Bull Formula One twist, built with React and HTML5 Canvas.

## 🏎️ Features
- **F1 Theme**: Red Bull Racing inspired visuals (blue and yellow) and F1 car-like graphics
- **Classic Gameplay**: Faithful Space Invaders mechanics with F1 twist
- **Responsive Design**: Playable on desktop and mobile with touch controls
- **AI Experimentation**: Dedicated `/ai` folder for machine learning experiments
- **Modern Tech Stack**: React 18 + HTML5 Canvas

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd f1-racer-ai-project

# Install dependencies
npm install

# Start the development server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure
```
f1-racer-ai-project/
├── /public                 # Static assets
├── /src                    # Main application source
│   ├── /components         # React components
│   ├── /hooks              # Custom React hooks
│   ├── /utils              # Helper functions
│   ├── /styles             # CSS/Sass files
│   ├── /ai                 # AI experimentation folder
│   ├── App.js              # Main app component
│   └── index.js            # React entry point
├── /tests                  # Unit/integration tests
├── /docs                   # Documentation
├── package.json            # Project metadata & scripts
├── README.md               # This file
└── .gitignore              # Git ignore file
```

## 🎮 How to Play
- **Desktop**: Use left/right arrow keys to move, spacebar to shoot
- **Mobile**: Touch left/right sides of screen to move, tap to shoot
- **Objective**: Destroy all enemy F1 cars before they reach your position
- **Win**: Eliminate all opponents (see enemy count at top left)
- **Lose**: Let any opponent reach your car or get hit by enemy fire (game over message appears)

## 🤖 AI Experimentation
The `/ai` folder is dedicated to exploring AI techniques in games:
- Adaptive difficulty systems
- Behavior prediction models
- Procedural content generation
- Player style analysis
- Reinforcement learning experiments

See `/src/ai/README.ai.md` for experiment ideas and setup instructions.

## 🛠️ Development
- Built with Create React App
- Uses HTML5 Canvas for game rendering
- Responsive design for mobile play
- Modular component architecture

## 📄 License
This project is open source and available under the MIT License.

## 🏆 Credits
Inspired by the classic Space Invaders arcade game.
Red Bull Racing theme created for educational/fan purposes only.