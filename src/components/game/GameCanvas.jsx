import React, { useState, useRef, useEffect } from 'react';
import './GameCanvas.css';

// ==========================================
// Optimized, Low-Latency Web Audio Synthesizer
// ==========================================
class LightweightAudioSynth {
  constructor() {
    this.ctx = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupEngine();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setupEngine() {
    if (!this.ctx) return;

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineFilter = this.ctx.createBiquadFilter();

    // V6 Core buzz
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(50, this.ctx.currentTime);

    // Deep sub-bass hum
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(25, this.ctx.currentTime);

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setEnginePitch(throttleRatio) {
    if (!this.ctx || this.isMuted || !this.engineOsc1) return;
    const now = this.ctx.currentTime;
    const freq = 45 + throttleRatio * 85;
    this.engineOsc1.frequency.setTargetAtTime(freq, now, 0.1);
    this.engineOsc2.frequency.setTargetAtTime(freq / 2, now, 0.1);
    this.engineFilter.frequency.setTargetAtTime(160 + throttleRatio * 450, now, 0.1);
  }

  playLaser() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.12);
  }

  playExplosion() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.3);
  }

  playPitStop() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const clickTime = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350 - i * 60, clickTime);
      gain.gain.setValueAtTime(0.08, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(clickTime);
      osc.stop(clickTime + 0.05);
    }
  }

  playDrsSignal() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.setValueAtTime(900, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.2);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

const synth = new LightweightAudioSynth();

// ==========================================
// Main React Game Canvas Component
// ==========================================
const GameCanvas = () => {
  const canvasRef = useRef(null);

  // React state for overlays
  const [audioInited, setAudioInited] = useState(false);
  const [gameState, setGameState] = useState('menu'); // menu, playing, level_complete, game_over
  const [selectedTire, setSelectedTire] = useState('medium'); // soft, medium, hard
  const [muteSound, setMuteSound] = useState(false);

  // Teleboard stats (reflected in UI and code)
  const [gameScore, setGameScore] = useState(0);
  const [gameLevel, setGameLevel] = useState(1);
  const [engineerMsg, setEngineerMsg] = useState({ speaker: 'GP', text: 'Ready to race. Choose tires and launch.' });
  const [scoresList, setScoresList] = useState([]);

  // Auto transition counters
  const [nextCountdown, setNextCountdown] = useState(3);
  const [restartCountdown, setRestartCountdown] = useState(5);

  // Telemetry references for standard loops (removes React latency at 60fps)
  const stateRef = useRef({
    gameState: 'menu',
    score: 0,
    level: 1,
    multiplier: 1,
    lastHitTime: 0,
    drsCharge: 0,
    drsActive: false,
    drsTimeLeft: 0,
    tireWear: 100,
    shield: 1,
    lives: 5,
    invulnerableTime: 0,
    tireStrategy: 'medium',
    pitLaneActive: false,
    pitTickerPos: 0,
    pitTickerDir: 1.2,
    pitSweetSpotStart: 0.35,
    pitSweetSpotEnd: 0.65,
    lastEnemyShot: 0,
    steerLeft: false,
    steerRight: false,
    isFiring: false,
    needInit: false
  });

  // Load High Scores on mount
  useEffect(() => {
    const localScores = JSON.parse(localStorage.getItem('f1_scores') || '[]');
    setScoresList(localScores);
  }, []);

  const handleInitAudio = () => {
    synth.init();
    setAudioInited(true);
    triggerEngineerMessage("Radio connection established. We are set.");
  };

  const triggerEngineerMessage = (text) => {
    setEngineerMsg({ speaker: 'GP', text });
  };

  const toggleMuteAudio = () => {
    const isMuted = synth.toggleMute();
    setMuteSound(isMuted);
  };

  const startRace = () => {
    const strategy = selectedTire;
    const baseShield = strategy === 'hard' ? 2 : 1;

    stateRef.current = {
      gameState: 'playing',
      score: 0,
      level: 1,
      multiplier: 1,
      lastHitTime: 0,
      drsCharge: 0,
      drsActive: false,
      drsTimeLeft: 0,
      tireWear: 100,
      shield: baseShield,
      lives: 5,
      invulnerableTime: 0,
      tireStrategy: strategy,
      pitLaneActive: false,
      pitTickerPos: 0.1,
      pitTickerDir: 1.2,
      pitSweetSpotStart: 0.35 + Math.random() * 0.1,
      pitSweetSpotEnd: 0.55 + Math.random() * 0.1,
      lastEnemyShot: Date.now(),
      steerLeft: false,
      steerRight: false,
      isFiring: false,
      needInit: true
    };

    setGameScore(0);
    setGameLevel(1);
    setGameState('playing');
    triggerEngineerMessage(`Green light! Strategy is ${strategy.toUpperCase()} tires.`);
  };

  const nextLevel = () => {
    stateRef.current.level += 1;
    setGameLevel(stateRef.current.level);
    stateRef.current.gameState = 'playing';
    stateRef.current.needInit = true;
    setGameState('playing');
    triggerEngineerMessage(`Lap ${stateRef.current.level}. DRS targets locked.`);
  };

  const keys = useRef({});

  // Handle Box action key/click
  const enterPitLane = () => {
    if (stateRef.current.gameState !== 'playing' || stateRef.current.pitLaneActive) return;
    stateRef.current.pitLaneActive = true;
    stateRef.current.pitTickerPos = 0.1;
    stateRef.current.pitSweetSpotStart = 0.3 + Math.random() * 0.15;
    stateRef.current.pitSweetSpotEnd = stateRef.current.pitSweetSpotStart + 0.22;
    synth.playPitStop();
    triggerEngineerMessage("Copy, boxing this lap. Keep it steady in the lane.");
  };

  const triggerPitReaction = () => {
    const s = stateRef.current;
    if (!s.pitLaneActive) return;

    if (s.pitTickerPos >= s.pitSweetSpotStart && s.pitTickerPos <= s.pitSweetSpotEnd) {
      s.tireWear = 100;
      s.shield = s.tireStrategy === 'hard' ? 2 : 1;
      s.pitLaneActive = false;
      triggerEngineerMessage("Incredible service! Under 2 seconds. Go!");
      synth.playLaser();
    } else {
      triggerEngineerMessage("Stuck nut! Pit crew working... wait.");
      s.pitTickerPos = -999;
      setTimeout(() => {
        s.tireWear = 100;
        s.shield = s.tireStrategy === 'hard' ? 2 : 1;
        s.pitLaneActive = false;
      }, 2000);
    }
  };

  // Firing action
  const fireLaser = (player, bullets) => {
    const s = stateRef.current;
    if (s.pitLaneActive) return;

    const bulletSpeed = 9;
    const fireInterval = s.tireStrategy === 'soft' ? 180 : s.tireStrategy === 'medium' ? 250 : 320;
    const now = Date.now();

    if (now - player.lastShot > fireInterval) {
      if (s.drsActive) {
        bullets.push({
          x: player.x + 5,
          y: player.y + 5,
          width: 4,
          height: 12,
          speed: bulletSpeed + 3,
          color: '#00F3FF'
        });
        bullets.push({
          x: player.x + player.width - 9,
          y: player.y + 5,
          width: 4,
          height: 12,
          speed: bulletSpeed + 3,
          color: '#00F3FF'
        });
      } else {
        bullets.push({
          x: player.x + player.width / 2 - 2,
          y: player.y - 5,
          width: 4,
          height: 12,
          speed: bulletSpeed,
          color: '#FF0055'
        });
      }
      player.lastShot = now;
      synth.playLaser();
      s.tireWear = Math.max(0, s.tireWear - (s.tireStrategy === 'soft' ? 0.3 : s.tireStrategy === 'medium' ? 0.18 : 0.08));
    }
  };

  // DRS Engage
  const engageDrs = () => {
    const s = stateRef.current;
    if (s.drsCharge >= 100 && !s.drsActive) {
      s.drsActive = true;
      s.drsTimeLeft = 360;
      s.drsCharge = 0;
      synth.playDrsSignal();
      triggerEngineerMessage("DRS engaged, push now!");
    }
  };

  const handleActionClick = () => {
    if (stateRef.current.gameState === 'playing') {
      if (stateRef.current.pitLaneActive) {
        triggerPitReaction();
      }
    }
  };

  // ==========================================
  // Auto Countdown Transition Hooks
  // ==========================================
  useEffect(() => {
    let interval;
    if (gameState === 'level_complete') {
      let count = 3;
      setNextCountdown(count);
      interval = setInterval(() => {
        count--;
        setNextCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          nextLevel();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    let interval;
    if (gameState === 'game_over') {
      let count = 5;
      setRestartCountdown(count);
      interval = setInterval(() => {
        count--;
        setRestartCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          startRace();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // ==========================================
  // Game Draw Canvas Hook
  // ==========================================
  useEffect(() => {
    if (!audioInited) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e) => {
      keys.current[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        handleActionClick();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyD') {
        engageDrs();
      }
      if (e.code === 'KeyP') {
        enterPitLane();
      }
    };

    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let trackOffsetY = 0;

    const player = {
      x: canvas.width / 2 - 22,
      y: canvas.height - 180,
      width: 44,
      height: 64,
      speed: 6,
      lastShot: 0
    };

    let enemies = [];
    let bullets = [];
    let enemyBullets = [];
    let particles = [];
    let powerUps = [];

    const initCompetitors = () => {
      enemies = [];
      const s = stateRef.current;
      
      const trackWidth = Math.min(540, canvas.width * 0.85);
      const leftBoundary = (canvas.width - trackWidth) / 2;

      // Calculate grid sizing dynamically to prevent out-of-bounds spawning (Mobile / Lvl 4 bug fix)
      const rows = 3 + Math.min(s.level, 3); 
      const cols = 5 + Math.min(s.level, 4); 
      
      // Calculate dynamic spacingX so total width stays within 80% of current track width
      const maxGridWidth = trackWidth * 0.8;
      const spacingX = Math.min(60, maxGridWidth / (cols - 1));
      const spacingY = 48;

      const gridWidth = (cols - 1) * spacingX;
      const startX = leftBoundary + (trackWidth - gridWidth) / 2;
      const startY = 110;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isSwerver = r === 0 && Math.random() < 0.4;
          const isSafetyCar = s.level % 5 === 0 && r === 0 && c === Math.floor(cols / 2);

          enemies.push({
            x: startX + c * spacingX,
            y: startY + r * spacingY,
            width: 38,
            height: 52,
            speed: 1.0 + s.level * 0.25,
            direction: 1,
            isSwerver,
            isSafetyCar,
            health: isSafetyCar ? 6 : 1,
            color: isSafetyCar ? '#FF8800' : isSwerver ? '#FF00CC' : '#FFCC00'
          });
        }
      }
    };

    const spawnParticle = (x, y, vx, vy, color, life, size = 1.5) => {
      if (particles.length > 30) {
        particles.shift();
      }
      particles.push({ x, y, vx, vy, color, maxLife: life, life, size });
    };

    // Vector drawing function for cars
    const drawF1Car = (ctx, x, y, width, height, isPlayer, strategy, wear, isDrs, isSw, isSC) => {
      ctx.save();
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      const pw = width;
      const ph = height;

      const tireColor = isPlayer 
        ? (strategy === 'soft' ? '#FF0055' : strategy === 'medium' ? '#FFCC00' : '#FFFFFF') 
        : (isSC ? '#FF8800' : isSw ? '#FF00CC' : '#FFCC00');

      const tireW = 8;
      const tireH = 15;
      const frontTireY = 10;
      const rearTireY = ph - 24;

      const wheels = [
        { tx: x - 4, ty: y + frontTireY },
        { tx: x + pw - 4, ty: y + frontTireY },
        { tx: x - 4, ty: y + rearTireY },
        { tx: x + pw - 4, ty: y + rearTireY }
      ];

      wheels.forEach(w => {
        ctx.fillStyle = '#0a0a0d';
        ctx.beginPath();
        ctx.roundRect(w.tx, w.ty, tireW, tireH, 3);
        ctx.fill();

        ctx.fillStyle = '#1c1c22';
        ctx.beginPath();
        ctx.arc(w.tx + tireW / 2, w.ty + tireH / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = tireColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w.tx + tireW / 2, w.ty + tireH / 2, 1.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#25252c';
        const spinY = (frameCount * 1.5) % 8;
        ctx.beginPath();
        ctx.moveTo(w.tx, w.ty + spinY);
        ctx.lineTo(w.tx + tireW, w.ty + spinY);
        ctx.stroke();
      });

      ctx.fillStyle = '#121217';
      ctx.fillRect(x + 3, y + 8, pw - 6, ph - 16);

      const bodyGrad = ctx.createLinearGradient(x + pw / 2, y, x + pw / 2, y + ph);
      if (isPlayer) {
        bodyGrad.addColorStop(0, '#0600EF');
        bodyGrad.addColorStop(0.5, '#0400be');
        bodyGrad.addColorStop(1, '#020059');
      } else {
        const startC = isSC ? '#FF8800' : isSw ? '#FF00CC' : '#FFCC00';
        const endC = isSC ? '#993300' : isSw ? '#800060' : '#806600';
        bodyGrad.addColorStop(0, startC);
        bodyGrad.addColorStop(1, endC);
      }

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(x + pw / 2, y + 2);
      ctx.bezierCurveTo(x + pw * 0.68, y + ph * 0.35, x + pw * 0.82, y + ph * 0.5, x + pw * 0.82, y + ph * 0.74);
      ctx.lineTo(x + pw * 0.7, y + ph * 0.84);
      ctx.lineTo(x + pw * 0.3, y + ph * 0.84);
      ctx.lineTo(x + pw * 0.18, y + ph * 0.74);
      ctx.bezierCurveTo(x + pw * 0.18, y + ph * 0.5, x + pw * 0.32, y + ph * 0.35, x + pw / 2, y + 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isPlayer ? '#00F3FF' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isPlayer ? '#FF0055' : '#0d0d0d';
      ctx.fillRect(x - 2, y + 6, pw + 4, 4);
      ctx.fillStyle = isPlayer ? '#0600EF' : '#FF0055';
      ctx.fillRect(x - 2, y + 3, 2, 7);
      ctx.fillRect(x + pw, y + 3, 2, 7);

      ctx.fillStyle = isPlayer ? (isDrs ? '#00F3FF' : '#FF0055') : '#0d0d0d';
      const spoilerY = y + ph - 13;
      const spoilerH = isPlayer && isDrs ? 3 : 7;
      ctx.fillRect(x + 4, spoilerY, pw - 8, spoilerH);

      if (isPlayer && isDrs) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
        ctx.fillRect(x + 4, spoilerY + 3, pw - 8, 3);
      }

      ctx.fillStyle = isPlayer ? '#0600EF' : '#111111';
      ctx.fillRect(x + 2, spoilerY - 1, 2, 9);
      ctx.fillRect(x + pw - 4, spoilerY - 1, 2, 9);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x + pw / 2, y + ph * 0.58, 3.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isPlayer ? '#FFCC00' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x + pw / 2, y + ph * 0.56, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00F3FF';
      ctx.fillRect(x + pw / 2 - 1.2, y + ph * 0.53, 2.4, 1);

      ctx.restore();
    };

    const drawCarbonFiberHUD = (ctx, y, height, width) => {
      ctx.fillStyle = '#09090d';
      ctx.fillRect(0, y, width, height);

      ctx.strokeStyle = '#121217';
      ctx.lineWidth = 1;
      for (let x = -height; x < width; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + height, y + height);
        ctx.stroke();
      }
    };

    let loopId;
    let frameCount = 0;

    const renderLoop = () => {
      frameCount++;
      const s = stateRef.current;

      const trackWidth = Math.min(540, canvas.width * 0.85);
      const leftBoundary = (canvas.width - trackWidth) / 2;
      const rightBoundary = leftBoundary + trackWidth;

      // ==========================================
      // State machine initialization triggers
      // ==========================================
      if (s.needInit) {
        s.needInit = false;
        initCompetitors();
        bullets = [];
        enemyBullets = [];
        powerUps = [];
        player.x = canvas.width / 2 - 22;
      }

      // Handle Level Finished Transition (once)
      if (enemies.length === 0 && s.gameState === 'playing') {
        s.gameState = 'level_complete_display';
        setGameState('level_complete');
        triggerEngineerMessage(`Checker flag! Lap ${s.level} complete.`);
      }

      // Handle Game Over Transition (once)
      if (s.gameState === 'game_over') {
        s.gameState = 'game_over_display';
        setGameState('game_over');
        
        let scores = JSON.parse(localStorage.getItem('f1_scores') || '[]');
        if (!scores.includes(s.score) && s.score > 0) {
          scores.push(s.score);
          scores.sort((a, b) => b - a);
          scores = scores.slice(0, 5);
          localStorage.setItem('f1_scores', JSON.stringify(scores));
          setScoresList(scores);
        }
      }

      // ==========================================
      // Continuous Idle Loop rendering for Overlays
      // ==========================================
      if (s.gameState === 'menu' || s.gameState === 'game_over_display' || s.gameState === 'level_complete_display') {
        trackOffsetY += 0.6;

        ctx.fillStyle = '#0c2612';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#bfa57a';
        ctx.fillRect(leftBoundary - 20, 0, 10, canvas.height);
        ctx.fillRect(rightBoundary + 10, 0, 10, canvas.height);

        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(leftBoundary - 10, 0, trackWidth + 20, canvas.height);

        const curbLen = 45;
        const curbOffset = trackOffsetY % curbLen;
        const segmentsNum = Math.ceil(canvas.height / curbLen) + 1;
        for (let i = -1; i < segmentsNum; i++) {
          const y = i * curbLen + curbOffset;
          const index = Math.floor((trackOffsetY - y) / curbLen);
          ctx.fillStyle = (index % 2 === 0) ? '#FF0055' : '#FFFFFF';
          ctx.fillRect(leftBoundary - 10, y, 10, curbLen);
          ctx.fillRect(rightBoundary, y, 10, curbLen);
        }

        drawF1Car(ctx, player.x, player.y, player.width, player.height, true, s.tireStrategy, s.tireWear, false, false, false);

        loopId = requestAnimationFrame(renderLoop);
        return;
      }

      // ==========================================
      // Active Combat / Steer loop branch
      // ==========================================
      let speedFactor = 1.0;
      if (s.tireWear <= 30 && s.tireWear > 0) speedFactor = 0.55;
      else if (s.tireWear <= 0) speedFactor = 0.2;

      let playerSpeed = s.tireStrategy === 'soft' ? 7.2 : s.tireStrategy === 'medium' ? 6.0 : 4.8;
      playerSpeed *= speedFactor;
      if (s.drsActive) playerSpeed *= 1.4;

      synth.setEnginePitch(playerSpeed / 7.2);
      trackOffsetY += playerSpeed;

      // Draw grass landscape
      ctx.fillStyle = '#0c2612';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#071b0c';
      ctx.lineWidth = 1;
      const grassOffsetActive = (trackOffsetY * 0.8) % 40;
      for (let y = -40; y < canvas.height + 40; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y + grassOffsetActive);
        ctx.lineTo(leftBoundary - 20, y + grassOffsetActive);
        ctx.moveTo(rightBoundary + 20, y + grassOffsetActive);
        ctx.lineTo(canvas.width, y + grassOffsetActive);
        ctx.stroke();
      }

      // Draw gravel barriers
      ctx.fillStyle = '#bfa57a';
      ctx.fillRect(leftBoundary - 20, 0, 10, canvas.height);
      ctx.fillRect(rightBoundary + 10, 0, 10, canvas.height);

      // Draw asphalt main road
      ctx.fillStyle = '#1a1a20';
      ctx.fillRect(leftBoundary - 10, 0, trackWidth + 20, canvas.height);

      // Draw curbs
      const curbLenActive = 45;
      const curbOffsetActive = trackOffsetY % curbLenActive;
      const segmentsNumActive = Math.ceil(canvas.height / curbLenActive) + 1;
      for (let i = -1; i < segmentsNumActive; i++) {
        const y = i * curbLenActive + curbOffsetActive;
        const index = Math.floor((trackOffsetY - y) / curbLenActive);
        const curbColor = (index % 2 === 0) ? '#FF0055' : '#FFFFFF';

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(leftBoundary - 10, y + 2, 10, curbLenActive);
        ctx.fillRect(rightBoundary, y + 2, 10, curbLenActive);

        ctx.fillStyle = curbColor;
        ctx.fillRect(leftBoundary - 10, y, 10, curbLenActive);
        ctx.fillRect(rightBoundary, y, 10, curbLenActive);
      }

      // Draw starter grid slots
      const gridY = (trackOffsetY - 250) % (canvas.height * 2.2);
      if (gridY < canvas.height + 100) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(leftBoundary + 10, gridY, trackWidth - 20, 3);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftBoundary + trackWidth * 0.15, gridY + 20, 32, 54);
        ctx.strokeRect(leftBoundary + trackWidth * 0.65, gridY + 80, 32, 54);
      }

      // Draw dashed lane markings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftBoundary + trackWidth * 0.33, 0);
      ctx.lineTo(leftBoundary + trackWidth * 0.33, canvas.height);
      ctx.moveTo(leftBoundary + trackWidth * 0.66, 0);
      ctx.lineTo(leftBoundary + trackWidth * 0.66, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      const steerLeft = keys.current['ArrowLeft'] || keys.current['KeyA'] || s.steerLeft;
      const steerRight = keys.current['ArrowRight'] || keys.current['KeyD'] || s.steerRight;
      const isFiring = keys.current['Space'] || s.isFiring;

      if (!s.pitLaneActive) {
        if (steerLeft && player.x > leftBoundary + 10) {
          player.x -= playerSpeed;
          if (frameCount % 4 === 0) {
            spawnParticle(player.x + 5, player.y + player.height - 10, -0.8, -0.8, 'rgba(255, 255, 255, 0.15)', 10, 2);
          }
          s.tireWear = Math.max(0, s.tireWear - 0.04);
        }
        if (steerRight && player.x < rightBoundary - player.width - 10) {
          player.x += playerSpeed;
          if (frameCount % 4 === 0) {
            spawnParticle(player.x + player.width - 5, player.y + player.height - 10, 0.8, -0.8, 'rgba(255, 255, 255, 0.15)', 10, 2);
          }
          s.tireWear = Math.max(0, s.tireWear - 0.04);
        }

        if (frameCount % 4 === 0) {
          spawnParticle(player.x + player.width / 2, player.y + player.height - 5, (Math.random() - 0.5) * 0.5, 2 + Math.random() * 2, '#FF5500', 15);
        }

        if (isFiring) {
          fireLaser(player, bullets);
        }
      }

      s.tireWear = Math.max(0, s.tireWear - (s.tireStrategy === 'soft' ? 0.012 : s.tireStrategy === 'medium' ? 0.006 : 0.002));

      if (s.drsActive) {
        s.drsTimeLeft--;
        if (s.drsTimeLeft <= 0) {
          s.drsActive = false;
          triggerEngineerMessage("DRS closed. Charging battery.");
        }
        if (frameCount % 3 === 0) {
          spawnParticle(player.x + 5, player.y + 10, 0, 3, '#00F3FF', 20, 2);
          spawnParticle(player.x + player.width - 5, player.y + 10, 0, 3, '#00F3FF', 20, 2);
        }
      }

      if (s.invulnerableTime > 0) {
        s.invulnerableTime--;
        ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(frameCount * 0.2));
      }

      bullets = bullets.filter(b => {
        b.y -= b.speed;
        return b.y > 0;
      });

      enemyBullets = enemyBullets.filter(eb => {
        eb.y += eb.speed;
        return eb.y < canvas.height;
      });

      // Update Enemies
      let bounce = false;
      enemies.forEach(enemy => {
        if (enemy.isSwerver) {
          enemy.x += enemy.speed * enemy.direction * 1.4;
          if (enemy.x <= leftBoundary + 10) {
            enemy.direction = 1;
          }
          if (enemy.x >= rightBoundary - enemy.width - 10) {
            enemy.direction = -1;
          }
        } else {
          enemy.x += enemy.speed * enemy.direction;
          
          // Directional border check: only bounce when moving *towards* the hit edge
          if (enemy.direction === 1 && enemy.x >= rightBoundary - enemy.width - 10) {
            bounce = true;
          }
          if (enemy.direction === -1 && enemy.x <= leftBoundary + 10) {
            bounce = true;
          }
        }
      });

      if (bounce) {
        enemies.forEach(enemy => {
          if (!enemy.isSwerver) {
            enemy.direction *= -1;
            enemy.y += 22;
          }
        });
      }

      // Enemy Firing Loop
      const shotCooldown = Math.max(800, 2000 - s.level * 200);
      if (Date.now() - s.lastEnemyShot > shotCooldown) {
        if (enemies.length > 0) {
          const shooter = enemies[Math.floor(Math.random() * enemies.length)];
          enemyBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height - 4,
            width: 4,
            height: 12,
            speed: 4 + s.level * 0.4,
            color: '#FFFF00'
          });
          s.lastEnemyShot = Date.now();
        }
      }

      // Hit Collisions
      bullets.forEach(b => {
        enemies.forEach(enemy => {
          if (
            b.x < enemy.x + enemy.width &&
            b.x + b.width > enemy.x &&
            b.y < enemy.y + enemy.height &&
            b.y + b.height > enemy.y
          ) {
            enemy.health--;
            b.dead = true;
            for (let i = 0; i < 4; i++) {
              spawnParticle(b.x, b.y, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, '#FFFF00', 10);
            }

            if (enemy.health <= 0) {
              enemy.dead = true;
              synth.playExplosion();

              const color = enemy.isSafetyCar ? '#FF8800' : enemy.isSwerver ? '#FF00CC' : '#FFCC00';
              for (let i = 0; i < 12; i++) {
                spawnParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, color, 20, 2);
              }

              const now = Date.now();
              if (now - s.lastHitTime < 2200) {
                s.multiplier = Math.min(10, s.multiplier + 1);
              } else {
                s.multiplier = 1;
              }
              s.lastHitTime = now;

              s.score += (enemy.isSafetyCar ? 1000 : 100) * s.multiplier;
              setGameScore(s.score);

              s.drsCharge = Math.min(100, s.drsCharge + (enemy.isSafetyCar ? 40 : 10));

              if (Math.random() < 0.16) {
                powerUps.push({
                  x: enemy.x + enemy.width / 2 - 8,
                  y: enemy.y + enemy.height / 2,
                  width: 16,
                  height: 16,
                  type: Math.random() < 0.5 ? 'shield' : 'grip',
                  color: '#00F3FF'
                });
              }
            }
          }
        });
      });

      enemies = enemies.filter(e => !e.dead);
      bullets = bullets.filter(b => !b.dead);

      powerUps = powerUps.filter(p => {
        p.y += 2.5;
        const col =
          p.x < player.x + player.width &&
          p.x + p.width > player.x &&
          p.y < player.y + player.height &&
          p.y + p.height > player.y;

        if (col) {
          if (p.type === 'shield') {
            s.shield = Math.min(3, s.shield + 1);
            triggerEngineerMessage("Damage repaired. Wing shields active.");
          } else if (p.type === 'grip') {
            s.tireWear = Math.min(100, s.tireWear + 35);
            triggerEngineerMessage("Tyre grip refreshed.");
          }
          synth.playDrsSignal();
          return false;
        }
        return p.y < canvas.height;
      });

      // Enemy bullets hitting player
      enemyBullets = enemyBullets.filter(eb => {
        const col =
          eb.x < player.x + player.width &&
          eb.x + eb.width > player.x &&
          eb.y < player.y + player.height &&
          eb.y + eb.height > player.y;

        if (col) {
          if (s.invulnerableTime <= 0) {
            s.shield--;
            synth.playExplosion();

            for (let i = 0; i < 10; i++) {
              spawnParticle(player.x + player.width / 2, player.y + player.height / 2, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, '#FF0055', 15);
            }

            if (s.shield <= 0) {
              s.lives--;
              if (s.lives <= 0) {
                s.gameState = 'game_over';
              } else {
                s.shield = s.tireStrategy === 'hard' ? 2 : 1;
                s.invulnerableTime = 90;
                triggerEngineerMessage(`Impact! Lost a wing. ${s.lives} lives remaining.`);
              }
            } else {
              triggerEngineerMessage("Minor wing contact. Watch the gap.");
            }
          }
          return false;
        }
        return true;
      });

      // Enemy crossing player line
      const lineCrossed = enemies.some(e => e.y + e.height >= player.y + 10);
      if (lineCrossed) {
        if (s.invulnerableTime <= 0) {
          s.lives--;
          synth.playExplosion();
          if (s.lives <= 0) {
            s.gameState = 'game_over';
          } else {
            s.invulnerableTime = 90;
            enemies.forEach(e => { e.y = Math.max(100, e.y - 120); });
            triggerEngineerMessage(`Safety line breached. ${s.lives} lives remaining.`);
          }
        }
      }

      // Draw Power-ups
      powerUps.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a14';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'shield' ? 'W' : 'G', p.x + p.width / 2, p.y + p.height / 2 + 3);
      });

      // Draw Competitors
      enemies.forEach(enemy => {
        drawF1Car(ctx, enemy.x, enemy.y, enemy.width, enemy.height, false, null, null, false, enemy.isSwerver, enemy.isSafetyCar);
      });

      // Draw Player Car
      drawF1Car(ctx, player.x, player.y, player.width, player.height, true, s.tireStrategy, s.tireWear, s.drsActive, false, false);

      ctx.globalAlpha = 1.0;

      // Draw Bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        if (frameCount % 2 === 0) {
          spawnParticle(b.x + b.width / 2, b.y + b.height, (Math.random() - 0.5) * 0.5, 1, b.color, 6);
        }
      });

      enemyBullets.forEach(eb => {
        ctx.fillStyle = eb.color;
        ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
      });

      // Update & Draw Particles
      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        return p.life > 0;
      });

      // ==========================================
      // Telemetry HUD Draw
      // ==========================================
      const hudY = canvas.height - 85;
      const hudHeight = 85;

      drawCarbonFiberHUD(ctx, hudY, hudHeight, canvas.width);

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, hudY);
      ctx.lineTo(canvas.width, hudY);
      ctx.stroke();

      const centerBoxX = canvas.width / 2;

      // Speedometer
      const currentSpeedKmh = Math.floor(playerSpeed * 43);
      const rpmDialX = centerBoxX - 180;
      const rpmDialY = hudY + 42;
      const rpmRadius = 28;

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rpmDialX, rpmDialY, rpmRadius, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();

      const speedRatio = playerSpeed / 10.5;
      ctx.strokeStyle = s.drsActive ? '#00F3FF' : '#FFCC00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rpmDialX, rpmDialY, rpmRadius, Math.PI * 0.8, Math.PI * (0.8 + speedRatio * 1.4));
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 13px 'Orbitron', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(currentSpeedKmh, rpmDialX, rpmDialY + 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = "7px 'Orbitron', sans-serif";
      ctx.fillText("KM/H", rpmDialX, rpmDialY + 12);
      ctx.restore();

      // DRS Gauge
      ctx.fillStyle = '#ffffff';
      ctx.font = "9px 'Orbitron', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText("DRS BATTERY", centerBoxX, hudY + 22);

      const dWidth = 130;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(centerBoxX - dWidth / 2, hudY + 28, dWidth, 8);

      const chargeFill = (s.drsCharge / 100) * dWidth;
      ctx.fillStyle = s.drsCharge >= 100 ? '#00F3FF' : '#FFCC00';
      ctx.fillRect(centerBoxX - dWidth / 2, hudY + 28, chargeFill, 8);

      if (s.drsCharge >= 100) {
        ctx.fillStyle = '#00F3FF';
        ctx.font = "bold 9px 'Orbitron', sans-serif";
        ctx.fillText("DRS READY", centerBoxX, hudY + 48);
      } else if (s.drsActive) {
        ctx.fillStyle = '#00F3FF';
        ctx.font = "bold 9px 'Orbitron', sans-serif";
        ctx.fillText(`DRS ACTIVE! ${Math.ceil(s.drsTimeLeft / 60)}s`, centerBoxX, hudY + 48);
      }

      // Tire wear
      const tireModelX = centerBoxX + 180;
      const tireModelY = hudY + 42;
      const tireModelRad = 16;

      ctx.save();
      ctx.fillStyle = '#0a0a0d';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tireModelX, tireModelY, tireModelRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      let tireCompoundColor = '#00F3FF';
      if (s.tireWear <= 30) tireCompoundColor = '#FF0055';
      else if (s.tireWear <= 60) tireCompoundColor = '#FFCC00';

      ctx.strokeStyle = tireCompoundColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tireModelX, tireModelY, tireModelRad - 4, 0, Math.PI * 2 * (s.tireWear / 100));
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = "bold 9px 'Orbitron', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(s.tireWear)}%`, tireModelX + 24, tireModelY - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = "7px 'Orbitron', sans-serif";
      ctx.fillText(s.tireStrategy.toUpperCase(), tireModelX + 24, tireModelY + 8);
      ctx.restore();

      if (s.tireWear <= 30) {
        ctx.fillStyle = '#FF0055';
        ctx.font = "bold 10px 'Orbitron', sans-serif";
        ctx.fillText("BOX NOW!", tireModelX + 24, tireModelY + 20);
      }

      // Score
      ctx.fillStyle = '#fff';
      ctx.font = "13px 'Orbitron', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${s.score}`, 25, hudY + 28);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = "10px 'Orbitron', sans-serif";
      ctx.fillText(`L: ${s.level} | Mult: x${s.multiplier}`, 25, hudY + 44);

      // Lives Display
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < s.lives ? '#FFCC00' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(25 + i * 15, hudY + 60, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shields
      ctx.fillStyle = '#fff';
      ctx.font = "10px 'Orbitron', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText("SHIELDS", canvas.width - 25, hudY + 30);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.shield ? '#00F3FF' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(canvas.width - 25 - (3 - i) * 16, hudY + 36, 10, 10);
      }

      // Pit Stop overlay
      if (s.pitLaneActive) {
        const pyX = canvas.width / 2 - 160;
        const pyY = canvas.height / 2 - 80;
        const pyW = 320;
        const pyH = 130;

        ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
        ctx.fillRect(pyX, pyY, pyW, pyH);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
        ctx.strokeRect(pyX, pyY, pyW, pyH);

        ctx.fillStyle = '#fff';
        ctx.font = "bold 13px 'Orbitron', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("PIT STOP OVERHAUL", canvas.width / 2, pyY + 22);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = "9px sans-serif";
        ctx.fillText("Tap FIRE / click inside Sweet-Spot!", canvas.width / 2, pyY + 40);

        const barX = pyX + 30;
        const barY = pyY + 60;
        const barW = pyW - 60;
        const barH = 18;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(barX, barY, barW, barH);

        const ssStart = barX + s.pitSweetSpotStart * barW;
        const ssEnd = barX + s.pitSweetSpotEnd * barW;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.fillRect(ssStart, barY, ssEnd - ssStart, barH);
        ctx.strokeStyle = '#00F3FF';
        ctx.strokeRect(ssStart, barY, ssEnd - ssStart, barH);

        if (s.pitTickerPos !== -999) {
          s.pitTickerPos += 0.015 * s.pitTickerDir;
          if (s.pitTickerPos >= 0.95 || s.pitTickerPos <= 0.05) {
            s.pitTickerDir *= -1;
          }
          const tickerX = barX + s.pitTickerPos * barW;
          ctx.fillStyle = '#FF0055';
          ctx.fillRect(tickerX - 4, barY - 4, 8, barH + 8);
        } else {
          ctx.fillStyle = '#FFCC00';
          ctx.font = "bold 11px 'Orbitron', sans-serif";
          ctx.fillText("CHANGING TIRES...", canvas.width / 2, barY + 40);
        }
      }

      loopId = requestAnimationFrame(renderLoop);
    };

    loopId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(loopId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [audioInited, selectedTire]);

  useEffect(() => {
    return () => {
      synth.destroy();
    };
  }, []);

  return (
    <div className="GameCanvas-container crt screen-flicker" onClick={handleActionClick}>
      <canvas ref={canvasRef} className="GameCanvas-canvas" />

      {/* Audio Setup Prompt */}
      {!audioInited && (
        <div className="audio-init-prompt" onClick={handleInitAudio}>
          <div className="GameCanvas-card">
            <h2 className="GameCanvas-title">F1 Space Invaders</h2>
            <p className="GameCanvas-desc">
              High-performance racing engine synthesizer and telemetry HUD overlays. Click to setup and start.
            </p>
            <button className="btn-race">Start Telemetry</button>
          </div>
        </div>
      )}

      {/* GP Race Engineer Terminal Messages */}
      {audioInited && (
        <div className="engineer-bubble">
          <div className="engineer-avatar">GP</div>
          <div className="engineer-body">
            <span className="engineer-name">Race Engineer</span>
            <span className="engineer-text">{engineerMsg.text}</span>
          </div>
        </div>
      )}

      {/* Mobile touch overlays */}
      {audioInited && gameState === 'playing' && (
        <div className="mobile-controls">
          <div className="mobile-steer-cluster">
            <div
              className="mobile-btn steer"
              onTouchStart={(e) => { e.preventDefault(); stateRef.current.steerLeft = true; }}
              onTouchEnd={(e) => { e.preventDefault(); stateRef.current.steerLeft = false; }}
            >
              ←
            </div>
            <div
              className="mobile-btn steer"
              onTouchStart={(e) => { e.preventDefault(); stateRef.current.steerRight = true; }}
              onTouchEnd={(e) => { e.preventDefault(); stateRef.current.steerRight = false; }}
            >
              →
            </div>
          </div>

          <div className="mobile-action-cluster">
            <div
              className={`mobile-btn box ${stateRef.current.tireWear <= 30 ? 'ready' : ''}`}
              onTouchStart={(e) => { e.preventDefault(); enterPitLane(); }}
            >
              BOX
            </div>
            <div
              className={`mobile-btn drs ${stateRef.current.drsCharge >= 100 ? 'ready' : ''}`}
              onTouchStart={(e) => { e.preventDefault(); engageDrs(); }}
            >
              DRS
            </div>
            <div
              className="mobile-btn fire"
              onTouchStart={(e) => { e.preventDefault(); stateRef.current.isFiring = true; handleActionClick(); }}
              onTouchEnd={(e) => { e.preventDefault(); stateRef.current.isFiring = false; }}
            >
              FIRE
            </div>
          </div>
        </div>
      )}

      {/* Strategy garage Start Menu */}
      {audioInited && gameState === 'menu' && (
        <div className="GameCanvas-overlay">
          <div className="GameCanvas-card">
            <h1 className="GameCanvas-title">Red Bull Racing</h1>
            <span className="GameCanvas-subtitle">Arcade Sprint</span>

            <p className="GameCanvas-desc">
              Select tires. Soft compounds increase fire rates and engine speeds, but wear out rapidly. Hard tires deploy double wing contact shields.
            </p>

            <div className="tire-selectors">
              <div
                className={`tire-card ${selectedTire === 'soft' ? 'selected' : ''}`}
                onClick={() => setSelectedTire('soft')}
              >
                <div className="tire-badge soft">S</div>
                <span className="tire-name">Soft</span>
                <span className="tire-spec">Max Speed</span>
                <span className="tire-spec">Rapid Wear</span>
              </div>

              <div
                className={`tire-card ${selectedTire === 'medium' ? 'selected' : ''}`}
                onClick={() => setSelectedTire('medium')}
              >
                <div className="tire-badge medium">M</div>
                <span className="tire-name">Medium</span>
                <span className="tire-spec">Balanced</span>
                <span className="tire-spec">Med Wear</span>
              </div>

              <div
                className={`tire-card ${selectedTire === 'hard' ? 'selected' : ''}`}
                onClick={() => setSelectedTire('hard')}
              >
                <div className="tire-badge hard">H</div>
                <span className="tire-name">Hard</span>
                <span className="tire-spec">Shields x2</span>
                <span className="tire-spec">Slow Wear</span>
              </div>
            </div>

            <button className="btn-race" onClick={startRace}>Launch Sprint</button>

            <div className="controls-guide">
              <div className="control-item">
                <span className="key-cap">A / D</span>
                <span>Steer</span>
              </div>
              <div className="control-item">
                <span className="key-cap">Space</span>
                <span>Fire</span>
              </div>
              <div className="control-item">
                <span className="key-cap">Shift</span>
                <span>DRS</span>
              </div>
              <div className="control-item">
                <span className="key-cap">P</span>
                <span>Box</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Finished Overlay with countdown */}
      {audioInited && gameState === 'level_complete' && (
        <div className="GameCanvas-overlay">
          <div className="GameCanvas-card">
            <h1 className="GameCanvas-title" style={{ color: 'var(--neon-blue)' }}>Sprint Finish</h1>
            <span className="GameCanvas-subtitle">Next Lap Advancing</span>

            <p className="GameCanvas-desc" style={{ fontSize: '15px' }}>
              Final telemetry score: <strong style={{ color: 'var(--rb-yellow)' }}>{gameScore}</strong>
            </p>

            <p style={{ fontFamily: 'Orbitron', color: 'var(--neon-blue)', fontSize: '13px', margin: '15px 0' }}>
              NEXT LAP IN <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{nextCountdown}</span> SECONDS
            </p>

            <button className="btn-race" onClick={nextLevel}>Advance Now</button>
          </div>
        </div>
      )}

      {/* Game Over Screen with auto restart */}
      {audioInited && gameState === 'game_over' && (
        <div className="GameCanvas-overlay">
          <div className="GameCanvas-card">
            <h1 className="GameCanvas-title" style={{ color: 'var(--rb-red)' }}>RETIRED</h1>
            <span className="GameCanvas-subtitle">Sprint Complete</span>

            <p className="GameCanvas-desc" style={{ fontSize: '15px' }}>
              Final Score: <strong style={{ color: 'var(--rb-yellow)' }}>{gameScore}</strong>
            </p>

            <p style={{ fontFamily: 'Orbitron', color: 'var(--rb-red)', fontSize: '13px', margin: '15px 0' }}>
              AUTO-RESTARTING IN <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{restartCountdown}</span> SECONDS
            </p>

            {scoresList.length > 0 && (
              <div style={{ width: '100%', marginBottom: '15px' }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>POS</th>
                      <th>TOP TELEMETRY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoresList.map((sc, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{sc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button className="btn-race" onClick={startRace}>Race Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
