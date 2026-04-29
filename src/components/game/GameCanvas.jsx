import React, { useRef, useEffect } from 'react';
import './GameCanvas.css';

const GameCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game state machine
    const GAME_STATES = {
      MENU: 'menu',
      PLAYING: 'playing',
      PAUSED: 'paused',
      GAME_OVER: 'game_over',
      LEVEL_COMPLETE: 'level_complete'
    };
    let gameState = GAME_STATES.MENU;
    let level = 1;
    let score = 0;
    let multiplier = 1;
    let lastHitTime = 0;

    // Game objects
    const player = {
      x: canvas.width / 2 - 25,
      y: canvas.height - 80,
      width: 50,
      height: 30,
      speed: 5,
      color: '#0600EF', // Red Bull blue
      lastShot: 0
    };

    const enemies = [];
    const bullets = [];
    const enemyBullets = [];
    const particles = [];
    const powerUps = [];

    // Initialize enemies in grid formation
    const initEnemies = () => {
      const rows = 4 + level;
      const cols = 6 + Math.min(level, 4);
      const spacingX = 60;
      const spacingY = 40;
      const startX = (canvas.width - (cols - 1) * spacingX) / 2;
      const startY = 100;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          enemies.push({
            x: startX + col * spacingX,
            y: startY + row * spacingY,
            width: 40,
            height: 30,
            speed: 1 + level * 0.3,
            color: '#FFFF00', // Red Bull yellow
            direction: 1 // 1 for right, -1 for left
          });
        }
      }
    };

    initEnemies();

    // Input handling
    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
    });

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;

    canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = false;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const diffX = touchX - touchStartX;
      const diffY = touchY - touchStartY;
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isDragging = true;
        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) {
            keys['ArrowRight'] = true;
            keys['ArrowLeft'] = false;
          } else {
            keys['ArrowLeft'] = true;
            keys['ArrowRight'] = false;
          }
        }
        touchStartX = touchX;
        touchStartY = touchY;
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      // If not dragging, treat as tap to shoot
      if (!isDragging) {
        shoot();
      }
      keys['ArrowLeft'] = false;
      keys['ArrowRight'] = false;
      isDragging = false;
    });

    // Audio (lightweight)
    const playSound = (type) => {
      try {
        const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctxAudio.createOscillator();
        osc.frequency.value = type === 'shoot' ? 600 : type === 'explosion' ? 120 : 900;
        osc.connect(ctxAudio.destination);
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.05);
      } catch {}
    };

    // Shooting
    const shoot = () => {
      if (Date.now() - player.lastShot > 300) {
        bullets.push({
          x: player.x + player.width / 2 - 2,
          y: player.y,
          width: 4,
          height: 10,
          speed: 7,
          color: '#FF0000' // Red Red Bull accent
        });
        player.lastShot = Date.now();
        playSound('shoot');
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        shoot();
      }
    });

    // Game loop
    let lastTime = 0;
    const gameLoop = (timestamp) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // State screens
      if (gameState !== GAME_STATES.PLAYING) {
        ctx.fillStyle = '#00000090';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        const text = gameState === GAME_STATES.MENU ? 'TAP TO START' : gameState === GAME_STATES.GAME_OVER ? 'GAME OVER' : 'LEVEL COMPLETE';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        return;
      }

      // Update player position
      if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
      }
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
      }

      // Update bullets
      bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
          bullets.splice(index, 1);
        }
      });

      // Update enemy bullets
      enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) {
          enemyBullets.splice(index, 1);
        }
      });

      // Update enemies
      let moveDown = false;
      enemies.forEach(enemy => {
        enemy.x += enemy.speed * enemy.direction;

        // Check bounds
        if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
          moveDown = true;
        }
      });

      if (moveDown) {
        enemies.forEach(enemy => {
          enemy.direction *= -1;
          enemy.y += 20;
        });
      }

      // Enemy shooting
      if (Date.now() - (window.lastEnemyShot || 0) > 1500) {
        if (enemies.length > 0) {
          const shooter = enemies[Math.floor(Math.random() * enemies.length)];
          enemyBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 10,
            speed: 3,
            color: '#00FF00' // Green for enemy bullets
          });
          window.lastEnemyShot = Date.now();
        }
      }

      // Collision detection
      // Bullets hitting enemies
      bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
          if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
          ) {
            enemies.splice(eIndex, 1);
            bullets.splice(bIndex, 1);

            // particles
            for (let i = 0; i < 10; i++) {
              particles.push({ x: enemy.x, y: enemy.y, vx: Math.random()*4-2, vy: Math.random()*4-2, life: 20 });
            }

            // score + multiplier
            const now = Date.now();
            if (now - lastHitTime < 2000) multiplier++;
            else multiplier = 1;
            lastHitTime = now;
            score += 100 * multiplier;

            // random power-up
            if (Math.random() < 0.2) {
              powerUps.push({ x: enemy.x, y: enemy.y, type: 'rapid' });
            }

            playSound('explosion');
          }
        });
      });

      // Enemy bullets hitting player
      enemyBullets.forEach((bullet, index) => {
        if (
          bullet.x < player.x + player.width &&
          bullet.x + bullet.width > player.x &&
          bullet.y < player.y + player.height &&
          bullet.y + bullet.height > player.y
        ) {
          // Player hit - game over
          enemyBullets.splice(index, 1);
          gameState = GAME_STATES.GAME_OVER;
        }
      });

      // Draw player
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Draw player details (F1 car-like)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(player.x + 5, player.y - 10, 10, 10); // Cockpit
      ctx.fillRect(player.x + 15, player.y - 5, 20, 5); // Wing

      // Draw bullets
      ctx.fillStyle = '#FF0000';
      bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });

      // Draw enemy bullets
      ctx.fillStyle = '#00FF00';
      enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });

      // Draw enemies
      enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Add F1 tire details
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + enemy.height, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width - 10, enemy.y + enemy.height, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particles
      ctx.fillStyle = '#FFFF00';
      particles.forEach(p => ctx.fillRect(p.x, p.y, 2, 2));

      // Draw power-ups
      ctx.fillStyle = '#0600EF';
      powerUps.forEach(p => ctx.fillRect(p.x, p.y, 15, 15));

      // Draw UI
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score} x${multiplier}`, 20, 30);

      // Check win/lose conditions
      if (enemies.length === 0) {
        level++;
        initEnemies();
        gameState = GAME_STATES.LEVEL_COMPLETE;
        return;
      }

      // Check if enemies reached player
      const enemiesReachedBottom = enemies.some(enemy =>
        enemy.y + enemy.height > player.y
      );

      if (enemiesReachedBottom) {
        gameState = GAME_STATES.GAME_OVER;
        return;
      }

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', null);
      window.removeEventListener('keyup', null);
      canvas.removeEventListener('touchstart', null);
      canvas.removeEventListener('touchmove', null);
      canvas.removeEventListener('touchend', null);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default GameCanvas;
    };

    // Inside gameLoop, after collision detection and before drawing UI:
    // Update power-ups
export default GameCanvas;
    // Inside gameLoop, after collision detection and before drawing UI:
    // Update power-ups
    powerUps.forEach((p, i) => {
      p.y += 2;
      if (p.y > canvas.height) powerUps.splice(i, 1);
    });

    // Update particles
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    });

    // Power-up collection
    powerUps.forEach((p, i) => {
      if (
        p.x < player.x + player.width &&
        p.x + 20 > player.x &&
        p.y < player.y + player.height &&
        p.y + 20 > player.y
      ) {
        powerUps.splice(i, 1);
        player.speed += 1;
        playSound('power');
      }
    });
  };
  requestAnimationFrame(gameLoop);
};

  // Cleanup
  return () => {
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', null);
    window.removeEventListener('keyup', null);
    canvas.removeEventListener('touchstart', null);
    canvas.removeEventListener('touchmove', null);
    canvas.removeEventListener('touchend', null);
  };
}, []);;
  };

    requestAnimationFrame(gameLoop);
  };
