document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const healthFill = document.getElementById('health-fill');
    const finalScoreElement = document.getElementById('final-score');
    const enemiesKilledElement = document.getElementById('enemies-killed');
    const gameOverScreen = document.getElementById('game-over');
    const startScreen = document.getElementById('start-screen');
    const pauseScreen = document.getElementById('pause-screen');
    const tutorialScreen = document.getElementById('tutorial-screen');
    const levelScreen = document.getElementById('level-screen');
    const startButton = document.getElementById('start-button');
    const tutorialButton = document.getElementById('tutorial-button');
    const tutorialBackButton = document.getElementById('tutorial-back');
    const levelsBackButton = document.getElementById('levels-back');
    const resumeButton = document.getElementById('resume-button');
    const restartButton = document.getElementById('restart-button');
    const restartButtonPause = document.getElementById('restart-button-pause');
    const mainMenuButton = document.getElementById('main-menu-button');
    const mainMenuButtonGO = document.getElementById('main-menu-button-go');
    const levelButtons = document.querySelectorAll('.level-select');
    const weaponIcon = document.getElementById('weapon-icon');
    const weaponName = document.getElementById('weapon-name');
    const abilityCooldown = document.getElementById('ability-cooldown');
    const levelDisplay = document.getElementById('level-display');
    const waveDisplay = document.getElementById('wave-display');
    const notification = document.getElementById('notification');
    const chapterOptions = document.querySelectorAll('.chapter-option');
  
    // Variables del juego
    let gameActive = false;
    let gamePaused = false;
    let playerX = window.innerWidth / 2;
    let playerY = window.innerHeight - 100;
    let score = 0;
    let health = 100;
    let projectiles = [];
    let enemies = [];
    let powerups = [];
    let explosions = [];
    let stars = [];
    let lastEnemyTime = 0;
    let lastPowerupTime = 0;
    let enemySpawnRate = 2000;
    let powerupSpawnRate = 15000;
    let enemiesKilled = 0;
    let currentLevel = 1;
    let currentWave = 1;
    let maxWaves = 5;
    let waveEnemyCount = 0;
    let maxWaveEnemies = 10;
    let playerWeapon = 'standard'; // standard, plasma, heavy
    let playerShield = false;
    let shieldElement = null;
    let abilityReady = true;
    let abilityTimeout = null;
    let selectedChapter = 'ultramarines';
    let chapterColors = {
      'ultramarines': '#3a7ebf',
      'blood-angels': '#cc0000',
      'dark-angels': '#006600',
      'space-wolves': '#b0b0c0'
    };
    
    // Sonidos (simulados)
    const sounds = {
      shoot: playSound,
      explosion: playSound,
      powerup: playSound,
      damage: playSound,
      orbital: playSound,
      gameOver: playSound
    };
    
    function playSound(type) {
      // Simulación de sonido
      console.log(`Reproduciendo sonido: ${type}`);
    }
    
    // Crear estrellas para el fondo
    function createStars() {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * window.innerWidth}px`;
        star.style.top = `${Math.random() * window.innerHeight}px`;
        star.style.opacity = Math.random();
        gameContainer.appendChild(star);
        stars.push(star);
      }
    }
    
    // Mover estrellas
    function moveStars() {
      stars.forEach(star => {
        const top = parseFloat(star.style.top) + 0.3;
        if (top > window.innerHeight) {
          star.style.top = '0px';
          star.style.left = `${Math.random() * window.innerWidth}px`;
        } else {
          star.style.top = `${top}px`;
        }
      });
    }
    
    // Mostrar notificación
    function showNotification(text, duration = 2000) {
      notification.textContent = text;
      notification.style.opacity = 1;
      
      setTimeout(() => {
        notification.style.opacity = 0;
      }, duration);
    }
    
    // Selección de capítulo Space Marine
    chapterOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Quitar selección actual
        document.querySelector('.chapter-option.selected').classList.remove('selected');
        
        // Añadir nueva selección
        option.classList.add('selected');
        
        // Guardar capítulo seleccionado
        selectedChapter = option.dataset.chapter;
        
        // Actualizar color del jugador
        player.style.backgroundColor = chapterColors[selectedChapter];
      });
    });
    
    // Eventos de botones
    startButton.addEventListener('click', () => {
      startScreen.style.display = 'none';
      levelScreen.style.display = 'flex';
    });
    
    tutorialButton.addEventListener('click', () => {
      startScreen.style.display = 'none';
      tutorialScreen.style.display = 'flex';
    });
    
    tutorialBackButton.addEventListener('click', () => {
      tutorialScreen.style.display = 'none';
      startScreen.style.display = 'flex';
    });
    
    levelsBackButton.addEventListener('click', () => {
      levelScreen.style.display = 'none';
      startScreen.style.display = 'flex';
    });
    
    levelButtons.forEach(button => {
      button.addEventListener('click', () => {
        currentLevel = parseInt(button.dataset.level);
        levelScreen.style.display = 'none';
        startGame();
      });
    });
    
    restartButton.addEventListener('click', startGame);
    restartButtonPause.addEventListener('click', startGame);
    
    resumeButton.addEventListener('click', () => {
      pauseScreen.style.display = 'none';
      gamePaused = false;
      requestAnimationFrame(gameLoop);
    });
    
    mainMenuButton.addEventListener('click', goToMainMenu);
    mainMenuButtonGO.addEventListener('click', goToMainMenu);
    
    function goToMainMenu() {
      // Limpiar el juego
      gameActive = false;
      gamePaused = false;
      
      // Mostrar pantalla principal
      pauseScreen.style.display = 'none';
      gameOverScreen.style.display = 'none';
      startScreen.style.display = 'flex';
      
      // Eliminar todos los elementos del juego
      clearGameElements();
    }
    
    // Pausa con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gameActive) {
        if (gamePaused) {
          pauseScreen.style.display = 'none';
          gamePaused = false;
          requestAnimationFrame(gameLoop);
        } else {
          pauseScreen.style.display = 'flex';
          gamePaused = true;
        }
      }
      
      // Activar bombardeo orbital con ESPACIO
      if (e.key === ' ' && gameActive && !gamePaused && abilityReady) {
        activateOrbitalStrike();
      }
    });
    
    // Iniciar juego
    function startGame() {
      // Reiniciar variables
      clearGameElements();
      
      gameActive = true;
      gamePaused = false;
      score = 0;
      health = 100;
      playerX = window.innerWidth / 2;
      playerY = window.innerHeight - 100;
      enemiesKilled = 0;
      currentWave = 1;
      waveEnemyCount = 0;
      playerWeapon = 'standard';
      playerShield = false;
      abilityReady = true;
      
      // Actualizar interfaz
      updateHUD();
      player.style.backgroundColor = chapterColors[selectedChapter];
      
      // Ocultar pantallas
      startScreen.style.display = 'none';
      gameOverScreen.style.display = 'none';
      pauseScreen.style.display = 'none';
      levelScreen.style.display = 'none';
      
      // Configurar nivel
      setupLevel(currentLevel);
      
      // Crear estrellas
      createStars();
      
      // Anuncio de inicio de nivel
      showNotification(`NIVEL ${currentLevel} - OLEADA 1`, 3000);
      
      // Iniciar bucle del juego
      requestAnimationFrame(gameLoop);
    }
    
    function clearGameElements() {
      // Eliminar enemigos existentes
      document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
      
      // Eliminar proyectiles existentes
      document.querySelectorAll('.projectile').forEach(projectile => projectile.remove());
      
      // Eliminar power-ups existentes
      document.querySelectorAll('.powerup').forEach(powerup => powerup.remove());
      
      // Eliminar explosiones existentes
      document.querySelectorAll('.explosion').forEach(explosion => explosion.remove());
      
      // Eliminar estrellas existentes
      document.querySelectorAll('.star').forEach(star => star.remove());
      
      // Eliminar escudo si existe
      if (shieldElement) {
        shieldElement.remove();
        shieldElement = null;
      }
      
      // Limpiar arrays
      enemies = [];
      projectiles = [];
      powerups = [];
      explosions = [];
      stars = [];
    }
    
    // Configurar el nivel
    function setupLevel(level) {
      switch (level) {
        case 1:
          maxWaves = 5;
          maxWaveEnemies = 10;
          enemySpawnRate = 2000;
          powerupSpawnRate = 15000;
          break;
        case 2:
          maxWaves = 7;
          maxWaveEnemies = 15;
          enemySpawnRate = 1800;
          powerupSpawnRate = 12000;
          break;
        case 3:
          maxWaves = 10;
          maxWaveEnemies = 20;
          enemySpawnRate = 1500;
          powerupSpawnRate = 10000;
          break;
      }
      
      levelDisplay.textContent = level;
      waveDisplay.textContent = 1;
    }
    
    // Activar bombardeo orbital
    function activateOrbitalStrike() {
      if (!abilityReady) return;
      
      // Efectos visuales
      const orbitalEffect = document.createElement('div');
      orbitalEffect.className = 'orbital-strike';
      gameContainer.appendChild(orbitalEffect);
      
      // Eliminar todos los enemigos en pantalla
      enemies.forEach(enemy => {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, true);
        enemy.element.remove();
        score += enemy.score;
        enemiesKilled++;
      });
      
      // Vaciar array de enemigos
      enemies = [];
      
      // Actualizar UI
      updateHUD();
      
      // Sonido
      sounds.orbital('orbital');
      
      // Establecer cooldown
      abilityReady = false;
      abilityCooldown.style.clipPath = 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 0%, 50% 0%)';
      
      // Countdown visual
      let cooldownPercent = 100;
      let cooldownInterval = setInterval(() => {
        cooldownPercent -= 1;
        let angle = 360 * (cooldownPercent / 100);
        
        if (angle <= 90) {
          abilityCooldown.style.clipPath = `polygon(50% 50%, 50% 0%, 0% 0%, 0% ${angle}%)`;
        } else if (angle <= 180) {
          abilityCooldown.style.clipPath = `polygon(50% 50%, 50% 0%, 0% 0%, 0% 100%, ${angle - 180}% 100%)`;
        } else if (angle <= 270) {
          abilityCooldown.style.clipPath = `polygon(50% 50%, 50% 0%, 0% 0%, 0% 100%, 100% 100%, 100% ${270 - angle}%)`;
        } else {
          abilityCooldown.style.clipPath = `polygon(50% 50%, 50% 0%, ${angle - 270}% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 0%)`;
        }
        
        if (cooldownPercent <= 0) {
          clearInterval(cooldownInterval);
          abilityReady = true;
          abilityCooldown.style.clipPath = 'none';
        }
      }, 300);
      
      // Eliminar efecto después de la animación
      setTimeout(() => {
        orbitalEffect.remove();
      }, 500);
      
      // Notificación
      showNotification("¡BOMBARDEO ORBITAL ACTIVADO!", 2000);
    }
    
    // Control del jugador mediante el ratón
    document.addEventListener('mousemove', (e) => {
      if (!gameActive || gamePaused) return;
      
      playerX = e.clientX;
      if (playerX < 30) playerX = 30;
      if (playerX > window.innerWidth - 30) playerX = window.innerWidth - 30;
      
      player.style.left = `${playerX - player.offsetWidth / 2}px`;
      
      // Mover escudo si existe
      if (shieldElement) {
        shieldElement.style.left = `${playerX - shieldElement.offsetWidth / 2}px`;
        shieldElement.style.top = `${playerY - shieldElement.offsetHeight / 2}px`;
      }
    });
    
    // Disparo con clic
    document.addEventListener('click', (e) => {
      if (!gameActive || gamePaused) return;
      
      fireProjectile();
    });
    
    // Disparo de proyectil
    function fireProjectile() {
      const projectile = document.createElement('div');
      projectile.className = `projectile projectile-${playerWeapon}`;
      gameContainer.appendChild(projectile);
      
      let projectileX = playerX - projectile.offsetWidth / 2;
      let projectileY = playerY - player.offsetHeight / 2;
      
      projectile.style.left = `${projectileX}px`;
      projectile.style.top = `${projectileY}px`;
      
      let speed = 10;
      let damage = 10;
      
      // Diferentes tipos de proyectiles
      switch (playerWeapon) {
        case 'plasma':
          speed = 12;
          damage = 20;
          break;
        case 'heavy':
          speed = 8;
          damage = 40;
          break;
      }
      
      projectiles.push({
        element: projectile,
        x: projectileX,
        y: projectileY,
        speed: speed,
        damage: damage,
        type: playerWeapon
      });
      
      // Sonido de disparo
      sounds.shoot('shoot');
    }
    
    // Generar enemigos
    function spawnEnemy() {
      // Verificar si hemos alcanzado el máximo de enemigos para la oleada
      if (waveEnemyCount >= maxWaveEnemies) {
        return;
      }
      
      const enemy = document.createElement('div');
      
      // Determinar tipo de enemigo según nivel y oleada
      let enemyType = 'cultist';
      let size = 40;
      let health = 20;
      let speed = 2;
      let score_value = 100;
      
      const random = Math.random();
      
      if (currentLevel === 1) {
        if (currentWave > 3 && random > 0.7) {
          enemyType = 'chaos';
          health = 40;
          speed = 1.5;
          size = 50;
          score_value = 200;
        }
      } else if (currentLevel === 2) {
        if (random > 0.6) {
          enemyType = 'chaos';
          health = 40;
          speed = 1.5;
          size = 50;
          score_value = 200;
        } else if (currentWave > 5 && random > 0.8) {
          enemyType = 'demon';
          health = 30;
          speed = 3;
          size = 45;
          score_value = 250;
        }
      } else if (currentLevel === 3) {
        if (random > 0.5) {
          enemyType = 'demon';
          health = 30;
          speed = 3;
          size = 45;
          score_value = 250;
        } else if (random > 0.8) {
          enemyType = 'chaos';
          health = 40;
          speed = 1.5;
          size = 50;
          score_value = 200;
        }
        
        // Jefe en la última oleada
        if (currentWave === maxWaves && waveEnemyCount === maxWaveEnemies - 1) {
          enemyType = 'boss';
          health = 200;
          speed = 1;
          size = 80;
          score_value = 1000;
        }
      }
      
      enemy.className = `enemy enemy-${enemyType}`;
      gameContainer.appendChild(enemy);
      
      // Posición aleatoria en la parte superior de la pantalla
      const enemyX = Math.random() * (window.innerWidth - size);
      const enemyY = -size;
      
      enemy.style.left = `${enemyX}px`;
      enemy.style.top = `${enemyY}px`;
      
      enemies.push({
        element: enemy,
        x: enemyX,
        y: enemyY,
        width: size,
        height: size,
        health: health,
        speed: speed,
        type: enemyType,
        score: score_value
      });
      
      waveEnemyCount++;
      
      // Si completamos los enemigos de esta oleada, preparar la siguiente
      if (waveEnemyCount >= maxWaveEnemies) {
        if (currentWave < maxWaves) {
          setTimeout(() => {
            currentWave++;
            waveEnemyCount = 0;
            waveDisplay.textContent = currentWave;
            showNotification(`OLEADA ${currentWave}`, 2000);
          }, 5000);
        }
      }
    }
    
    // Generar power-ups
    function spawnPowerup() {
      const powerup = document.createElement('div');
      const powerupTypes = ['weapon', 'shield', 'orbital', 'health'];
      const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      
      powerup.className = `powerup powerup-${type}`;
      gameContainer.appendChild(powerup);
      
      const size = 30;
      const powerupX = Math.random() * (window.innerWidth - size);
      const powerupY = -size;
      
      powerup.style.left = `${powerupX}px`;
      powerup.style.top = `${powerupY}px`;
      
      powerups.push({
        element: powerup,
        x: powerupX,
        y: powerupY,
        width: size,
        height: size,
        type: type,
        speed: 2
      });
    }
    
    // Crear explosión
    function createExplosion(x, y, isLarge = false) {
      const explosion = document.createElement('div');
      explosion.className = `explosion ${isLarge ? 'explosion-large' : ''}`;
      gameContainer.appendChild(explosion);
      
      explosion.style.left = `${x - explosion.offsetWidth / 2}px`;
      explosion.style.top = `${y - explosion.offsetHeight / 2}px`;
      
      explosions.push(explosion);
      
      // Sonido de explosión
      sounds.explosion('explosion');
      
      // Eliminar después de la animación
      setTimeout(() => {
        explosion.remove();
        explosions = explosions.filter(e => e !== explosion);
      }, 500);
    }
    
    // Provocar daño al jugador
    function damagePlayer(amount) {
      // Si tiene escudo, reducir el daño
      if (playerShield) {
        amount = Math.floor(amount / 2);
        
        // Efecto visual de daño en el escudo
        shieldElement.style.borderColor = 'rgba(255, 0, 0, 0.7)';
        setTimeout(() => {
          shieldElement.style.borderColor = 'rgba(100, 200, 255, 0.7)';
        }, 200);
      }
      
      health -= amount;
      if (health < 0) health = 0;
      
      // Actualizar barra de vida
      updateHUD();
      
      // Efecto visual de daño
      const damageEffect = document.createElement('div');
      damageEffect.className = 'damage-indicator';
      gameContainer.appendChild(damageEffect);
      
      // Sonido de daño
      sounds.damage('damage');
      
      // Eliminar efecto después de la animación
      setTimeout(() => {
        damageEffect.remove();
      }, 500);
      
      // Verificar game over
      if (health <= 0) {
        gameOver();
      }
    }
    
    // Activar power-up
    function activatePowerup(type) {
      switch (type) {
        case 'weapon':
          if (playerWeapon === 'standard') {
            playerWeapon = 'plasma';
            weaponName.textContent = 'Rifle de Plasma';
            weaponIcon.className = 'weapon-icon weapon-plasma';
          } else if (playerWeapon === 'plasma') {
            playerWeapon = 'heavy';
            weaponName.textContent = 'Cañón de Asalto';
            weaponIcon.className = 'weapon-icon weapon-heavy';
          }
          showNotification(`¡ARMA MEJORADA: ${weaponName.textContent}!`);
          break;
          
        case 'shield':
          playerShield = true;
          if (shieldElement) {
            shieldElement.remove();
          }
          shieldElement = document.createElement('div');
          shieldElement.className = 'player-shield';
          gameContainer.appendChild(shieldElement);
          shieldElement.style.left = `${playerX - 40}px`;
          shieldElement.style.top = `${playerY - 40}px`;
          showNotification("¡ESCUDO DE ENERGÍA ACTIVADO!");
          break;
          
        case 'orbital':
          abilityReady = true;
          abilityCooldown.style.clipPath = 'none';
          showNotification("¡BOMBARDEO ORBITAL DISPONIBLE!");
          break;
          
        case 'health':
          health += 25;
          if (health > 100) health = 100;
          updateHUD();
          showNotification("¡SALUD RESTAURADA!");
          break;
      }
      
      // Sonido de power-up
      sounds.powerup('powerup');
    }
    
    // Actualizar HUD
    function updateHUD() {
      scoreElement.textContent = score;
      healthFill.style.width = `${health}%`;
      
      // Cambiar color según nivel de salud
      if (health > 60) {
        healthFill.style.backgroundColor = '#00cc00';
      } else if (health > 30) {
        healthFill.style.backgroundColor = '#ffcc00';
      } else {
        healthFill.style.backgroundColor = '#cc0000';
      }
    }
    
    // Game Over
    function gameOver() {
      gameActive = false;
      
      // Mostrar pantalla de game over
      gameOverScreen.style.display = 'flex';
      finalScoreElement.textContent = score;
      enemiesKilledElement.textContent = enemiesKilled;
      
      // Sonido de game over
      sounds.gameOver('gameOver');
    }
    
    // Comprobar colisiones
    function checkCollisions() {
      // Colisión proyectil-enemigo
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          
          if (
            projectile.x < enemy.x + enemy.width &&
            projectile.x + projectile.element.offsetWidth > enemy.x &&
            projectile.y < enemy.y + enemy.height &&
            projectile.y + projectile.element.offsetHeight > enemy.y
          ) {
            // Daño al enemigo
            enemy.health -= projectile.damage;
            
            // Eliminar proyectil
            projectile.element.remove();
            projectiles.splice(i, 1);
            
            // Verificar si el enemigo murió
            if (enemy.health <= 0) {
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === 'boss');
              enemy.element.remove();
              score += enemy.score;
              enemiesKilled++;
              enemies.splice(j, 1);
              
              // Actualizar puntuación
              updateHUD();
              
              // Verificar si es la última oleada y último enemigo (victoria)
              if (currentWave === maxWaves && waveEnemyCount >= maxWaveEnemies && enemies.length === 0) {
                showNotification("¡NIVEL COMPLETADO!", 3000);
                
                // Pasar al siguiente nivel tras un tiempo
                setTimeout(() => {
                  if (currentLevel < 3) {
                    currentLevel++;
                    startGame();
                  } else {
                    // Victoria final del juego
                    showNotification("¡HAS COMPLETADO TODOS LOS NIVELES!", 5000);
                    setTimeout(goToMainMenu, 5000);
                  }
                }, 3000);
              }
            }
            
            break;
          }
        }
      }
      
      // Colisión jugador-enemigo
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (
          playerX - player.offsetWidth / 2 < enemy.x + enemy.width &&
          playerX + player.offsetWidth / 2 > enemy.x &&
          playerY - player.offsetHeight / 2 < enemy.y + enemy.height &&
          playerY + player.offsetHeight / 2 > enemy.y
        ) {
          // Daño al jugador
          damagePlayer(10);
          
          // Daño al enemigo
          enemy.health -= 20;
          
          // Verificar si el enemigo murió
          if (enemy.health <= 0) {
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemy.element.remove();
            score += enemy.score;
            enemiesKilled++;
            enemies.splice(i, 1);
            
            // Actualizar puntuación
            updateHUD();
          }
        }
      }
      
      // Colisión jugador-powerup
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        if (
          playerX - player.offsetWidth / 2 < powerup.x + powerup.width &&
          playerX + player.offsetWidth / 2 > powerup.x &&
          playerY - player.offsetHeight / 2 < powerup.y + powerup.height &&
          playerY + player.offsetHeight / 2 > powerup.y
        ) {
          // Activar power-up
          activatePowerup(powerup.type);
          
          // Eliminar power-up
          powerup.element.remove();
          powerups.splice(i, 1);
        }
      }
    }
    
    // Actualizar posiciones
    function updatePositions() {
      // Mover proyectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.y -= projectile.speed;
        projectile.element.style.top = `${projectile.y}px`;
        
        // Eliminar si sale de la pantalla
        if (projectile.y < -projectile.element.offsetHeight) {
          projectile.element.remove();
          projectiles.splice(i, 1);
        }
      }
      
      // Mover enemigos
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        enemy.element.style.top = `${enemy.y}px`;
        
        // Movimiento lateral aleatorio para algunos enemigos
        if (enemy.type === 'demon') {
          enemy.x += Math.sin(Date.now() / 200) * 2;
          enemy.element.style.left = `${enemy.x}px`;
        }
        
        // Eliminar si sale de la pantalla
        if (enemy.y > window.innerHeight) {
          enemy.element.remove();
          enemies.splice(i, 1);
          
          // Daño por enemigo escapado
          damagePlayer(5);
        }
      }
      
      // Mover power-ups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += powerup.speed;
        powerup.element.style.top = `${powerup.y}px`;
        
        // Eliminar si sale de la pantalla
        if (powerup.y > window.innerHeight) {
          powerup.element.remove();
          powerups.splice(i, 1);
        }
      }
      
      // Mover estrellas del fondo
      moveStars();
    }
    
    // Bucle principal del juego
    function gameLoop(timestamp) {
      if (!gameActive || gamePaused) return;
      
      // Generar enemigos cada cierto tiempo
      if (timestamp - lastEnemyTime > enemySpawnRate) {
        spawnEnemy();
        lastEnemyTime = timestamp;
      }
      
      // Generar power-ups cada cierto tiempo
      if (timestamp - lastPowerupTime > powerupSpawnRate) {
        spawnPowerup();
        lastPowerupTime = timestamp;
      }
      
      // Comprobar colisiones
      checkCollisions();
      
      // Actualizar posiciones
      updatePositions();
      
      // Continuar el bucle
      requestAnimationFrame(gameLoop);
    }
  });