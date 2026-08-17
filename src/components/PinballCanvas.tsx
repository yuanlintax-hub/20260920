import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { soundManager } from "../utils/audio";
import { Sparkles, Zap, Gauge, ArrowRight, Trophy, CheckCircle2 } from "lucide-react";

interface PinballCanvasProps {
  isGoldBall: boolean;
  onBallFinish: (scoreEarned: number) => void;
  ballNumber: number; // 1 to 4
  totalBalls?: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface SettlementData {
  pocketLabel: string;
  pocketPts: number;
  obstacleBonusPts: number;
  roundTotalPts: number;
  isGold: boolean;
  isLastBall: boolean;
}

interface StageConfig {
  stageName: string;
  bumpers: { id: string; x: number; y: number; r: number; name: string; pts: number; hitAnim: number }[];
  kickers: { id: string; x1: number; y1: number; x2: number; y2: number; nx: number; ny: number; pts: number }[];
  pins: { x: number; y: number; r: number }[];
  bell: { x: number; y: number; radius: number };
  spinner: { x: number; y: number; radius: number };
  bumperBounceFactor: number;
  pinElasticity: number;
  deflectionSpread: number;
}

// 4 Distinct Stage Layouts & Elasticity Profiles per Round
const STAGE_CONFIGS: Record<number, StageConfig> = {
  1: {
    stageName: "經典肉圓陣",
    bumpers: [
      { id: "bawan1", x: 110, y: 195, r: 34, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan2", x: 260, y: 195, r: 34, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan3", x: 185, y: 340, r: 32, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
    ],
    kickers: [
      { id: "sausage1", x1: 45, y1: 390, x2: 95, y2: 440, nx: 0.707, ny: -0.707, pts: 50 },
      { id: "sausage2", x1: 325, y1: 390, x2: 275, y2: 440, nx: -0.707, ny: -0.707, pts: 50 },
    ],
    pins: [
      { x: 135, y: 125, r: 7.5 },
      { x: 185, y: 115, r: 7.5 },
      { x: 235, y: 125, r: 7.5 },
      { x: 75, y: 225, r: 7.5 },
      { x: 295, y: 225, r: 7.5 },
      { x: 110, y: 280, r: 7.5 },
      { x: 155, y: 250, r: 7.5 },
      { x: 215, y: 250, r: 7.5 },
      { x: 260, y: 280, r: 7.5 },
      { x: 110, y: 415, r: 7.5 },
      { x: 160, y: 415, r: 7.5 },
      { x: 210, y: 415, r: 7.5 },
      { x: 260, y: 415, r: 7.5 },
    ],
    bell: { x: 185, y: 155, radius: 24 },
    spinner: { x: 185, y: 265, radius: 34 },
    bumperBounceFactor: 1.30,
    pinElasticity: 0.86,
    deflectionSpread: 26,
  },
  2: {
    stageName: "波浪交錯陣",
    bumpers: [
      { id: "bawan1", x: 95, y: 180, r: 35, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan2", x: 240, y: 215, r: 35, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan3", x: 135, y: 345, r: 33, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
    ],
    kickers: [
      { id: "sausage1", x1: 40, y1: 375, x2: 95, y2: 430, nx: 0.707, ny: -0.707, pts: 50 },
      { id: "sausage2", x1: 330, y1: 405, x2: 275, y2: 450, nx: -0.707, ny: -0.707, pts: 50 },
    ],
    pins: [
      { x: 120, y: 120, r: 7.5 },
      { x: 175, y: 130, r: 7.5 },
      { x: 250, y: 120, r: 7.5 },
      { x: 65, y: 240, r: 7.5 },
      { x: 170, y: 210, r: 7.5 },
      { x: 300, y: 180, r: 7.5 },
      { x: 205, y: 280, r: 7.5 },
      { x: 270, y: 290, r: 7.5 },
      { x: 75, y: 320, r: 7.5 },
      { x: 90, y: 420, r: 7.5 },
      { x: 150, y: 425, r: 7.5 },
      { x: 220, y: 410, r: 7.5 },
      { x: 280, y: 420, r: 7.5 },
    ],
    bell: { x: 255, y: 140, radius: 24 },
    spinner: { x: 115, y: 270, radius: 34 },
    bumperBounceFactor: 1.42,
    pinElasticity: 0.90,
    deflectionSpread: 32,
  },
  3: {
    stageName: "雙星漏斗陣",
    bumpers: [
      { id: "bawan1", x: 140, y: 175, r: 35, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan2", x: 245, y: 175, r: 35, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan3", x: 250, y: 325, r: 33, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
    ],
    kickers: [
      { id: "sausage1", x1: 50, y1: 395, x2: 105, y2: 440, nx: 0.707, ny: -0.707, pts: 50 },
      { id: "sausage2", x1: 320, y1: 375, x2: 265, y2: 425, nx: -0.707, ny: -0.707, pts: 50 },
    ],
    pins: [
      { x: 100, y: 125, r: 7.5 },
      { x: 195, y: 110, r: 7.5 },
      { x: 285, y: 125, r: 7.5 },
      { x: 70, y: 215, r: 7.5 },
      { x: 310, y: 215, r: 7.5 },
      { x: 145, y: 255, r: 7.5 },
      { x: 240, y: 255, r: 7.5 },
      { x: 105, y: 310, r: 7.5 },
      { x: 175, y: 340, r: 7.5 },
      { x: 100, y: 415, r: 7.5 },
      { x: 155, y: 415, r: 7.5 },
      { x: 215, y: 415, r: 7.5 },
      { x: 270, y: 415, r: 7.5 },
    ],
    bell: { x: 100, y: 220, radius: 24 },
    spinner: { x: 195, y: 255, radius: 34 },
    bumperBounceFactor: 1.48,
    pinElasticity: 0.92,
    deflectionSpread: 35,
  },
  4: {
    stageName: "大吉滿貫陣",
    bumpers: [
      { id: "bawan1", x: 85, y: 220, r: 34, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan2", x: 285, y: 220, r: 34, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
      { id: "bawan3", x: 185, y: 195, r: 36, name: "肉圓碰撞柱", pts: 20, hitAnim: 0 },
    ],
    kickers: [
      { id: "sausage1", x1: 45, y1: 385, x2: 100, y2: 435, nx: 0.707, ny: -0.707, pts: 50 },
      { id: "sausage2", x1: 325, y1: 385, x2: 270, y2: 435, nx: -0.707, ny: -0.707, pts: 50 },
    ],
    pins: [
      { x: 125, y: 120, r: 7.5 },
      { x: 185, y: 105, r: 7.5 },
      { x: 245, y: 120, r: 7.5 },
      { x: 60, y: 170, r: 7.5 },
      { x: 310, y: 170, r: 7.5 },
      { x: 135, y: 275, r: 7.5 },
      { x: 235, y: 275, r: 7.5 },
      { x: 95, y: 325, r: 7.5 },
      { x: 275, y: 325, r: 7.5 },
      { x: 110, y: 410, r: 7.5 },
      { x: 160, y: 410, r: 7.5 },
      { x: 210, y: 410, r: 7.5 },
      { x: 260, y: 410, r: 7.5 },
    ],
    bell: { x: 185, y: 130, radius: 24 },
    spinner: { x: 185, y: 340, radius: 34 },
    bumperBounceFactor: 1.55,
    pinElasticity: 0.94,
    deflectionSpread: 38,
  },
};

export const PinballCanvas: React.FC<PinballCanvasProps> = ({
  isGoldBall,
  onBallFinish,
  ballNumber,
  totalBalls = 4,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Current Stage Layout Config
  const stageConfig = useMemo(() => {
    const stageIdx = ((ballNumber - 1) % 4) + 1;
    return STAGE_CONFIGS[stageIdx] || STAGE_CONFIGS[1];
  }, [ballNumber]);

  // UI & Game States
  const [plungerTension, setPlungerTension] = useState<number>(0);
  const [hasLaunched, setHasLaunched] = useState<boolean>(false);
  const [isMagnetActive, setIsMagnetActive] = useState<boolean>(false);
  const [currentRoundScore, setCurrentRoundScore] = useState<number>(0);
  const [isDraggingPlunger, setIsDraggingPlunger] = useState<boolean>(false);
  const [settlementModal, setSettlementModal] = useState<SettlementData | null>(null);

  // Physics simulation references
  const gameStateRef = useRef({
    ball: {
      x: 362,
      y: 535,
      vx: 0,
      vy: 0,
      radius: 9.5,
      active: false,
      settled: false,
      inPlayTime: 0,
      inLaunchChannel: true,
      hasExitedTop: false,
      isGold: isGoldBall,
    },
    plunger: {
      yOffset: 0,
      isDragging: false,
      startY: 0,
      tension: 0,
      maxPull: 80,
      recoilAnim: 0,
    },
    spinner: {
      angle: 0,
      speed: 0,
      x: stageConfig.spinner.x,
      y: stageConfig.spinner.y,
      radius: stageConfig.spinner.radius,
    },
    bell: {
      angle: 0,
      swingSpeed: 0,
      x: stageConfig.bell.x,
      y: stageConfig.bell.y,
      radius: stageConfig.bell.radius,
    },
    rainbowTriggered: false,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    roundScore: 0,
    obstacleScore: 0,
    multiplier: isGoldBall ? 2 : 1,
    magnetTimerActive: false,
    settledPocketIdx: -1,
    settledTimer: 0,
    sausageHitCount: 0,
  });

  // Reset or initialize ball on mount or round change
  useEffect(() => {
    gameStateRef.current.ball.isGold = isGoldBall;
    gameStateRef.current.multiplier = isGoldBall ? 2 : 1;
    gameStateRef.current.roundScore = 0;
    gameStateRef.current.obstacleScore = 0;
    gameStateRef.current.rainbowTriggered = false;
    gameStateRef.current.magnetTimerActive = false;
    gameStateRef.current.settledPocketIdx = -1;
    gameStateRef.current.settledTimer = 0;
    gameStateRef.current.sausageHitCount = 0;
    gameStateRef.current.ball.active = false;
    gameStateRef.current.ball.settled = false;
    gameStateRef.current.ball.inLaunchChannel = true;
    gameStateRef.current.ball.hasExitedTop = false;
    gameStateRef.current.ball.x = 362;
    gameStateRef.current.ball.y = 535;
    gameStateRef.current.ball.vx = 0;
    gameStateRef.current.ball.vy = 0;
    gameStateRef.current.ball.inPlayTime = 0;
    gameStateRef.current.plunger.tension = 0;
    gameStateRef.current.plunger.isDragging = false;

    // Synchronize spinner & bell positions for current stage
    gameStateRef.current.spinner.x = stageConfig.spinner.x;
    gameStateRef.current.spinner.y = stageConfig.spinner.y;
    gameStateRef.current.spinner.radius = stageConfig.spinner.radius;
    gameStateRef.current.bell.x = stageConfig.bell.x;
    gameStateRef.current.bell.y = stageConfig.bell.y;
    gameStateRef.current.bell.radius = stageConfig.bell.radius;

    setHasLaunched(false);
    setIsMagnetActive(false);
    setCurrentRoundScore(0);
    setPlungerTension(0);
    setIsDraggingPlunger(false);
    setSettlementModal(null);
  }, [ballNumber, isGoldBall, stageConfig]);

  // Floating text popups for obstacle hits
  const addScorePopup = useCallback((x: number, y: number, points: number, label?: string) => {
    const mult = isGoldBall ? 2 : 1;
    const finalPoints = points * mult;
    const text = label ? `${label} +${finalPoints}` : `+${finalPoints}${mult > 1 ? " (2x!)" : ""}`;
    const color = isGoldBall ? "#FFD700" : "#E9D5FF";

    gameStateRef.current.roundScore += finalPoints;
    gameStateRef.current.obstacleScore += finalPoints;
    setCurrentRoundScore(gameStateRef.current.roundScore);

    gameStateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 45,
    });

    // Spawn purple & golden sparkles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isGoldBall ? "#FFEA00" : i % 2 === 0 ? "#C084FC" : "#9333EA",
        size: 2.5 + Math.random() * 3,
        life: 0,
        maxLife: 25,
      });
    }
  }, [isGoldBall]);

  // Launch Ball Along the Right Channel & Track with Dynamic Trajectory
  const launchBall = useCallback((powerRatio: number) => {
    // Increased base power and boosted maximum elasticity
    const clampedPower = Math.max(0.15, Math.min(1.0, powerRatio));
    const ball = gameStateRef.current.ball;
    if (ball.active || hasLaunched) return;

    soundManager.playPlungerRelease();
    ball.active = true;
    ball.settled = false;
    ball.inLaunchChannel = true;
    ball.hasExitedTop = false;
    ball.x = 362;
    ball.y = 525;

    // Boosted launch velocity curve: mobile operators achieve high-speed launch easily without pulling all the way down
    const launchSpeed = (780 + clampedPower * 560) * (0.98 + (Math.random() - 0.5) * 0.04);
    ball.vx = -8 + (Math.random() - 0.5) * 5; // slight organic leftward bias
    ball.vy = -launchSpeed;
    ball.inPlayTime = 0;

    gameStateRef.current.plunger.recoilAnim = 16;
    gameStateRef.current.plunger.tension = 0;

    // Launch sparks at the plunger tip
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI / 2) + (Math.random() - 0.5) * 1.3;
      const spd = 2 + Math.random() * 5;
      gameStateRef.current.particles.push({
        x: 362,
        y: 530,
        vx: Math.cos(angle) * spd,
        vy: -Math.abs(Math.sin(angle) * spd),
        color: isGoldBall ? (i % 2 === 0 ? "#FFD700" : "#C084FC") : (i % 2 === 0 ? "#E9D5FF" : "#9333EA"),
        size: 3 + Math.random() * 2.5,
        life: 0,
        maxLife: 25,
      });
    }

    setHasLaunched(true);
    setPlungerTension(0);
    setIsDraggingPlunger(false);
  }, [hasLaunched, isGoldBall]);

  // Proceed to next round or finish
  const handleProceedNext = useCallback(() => {
    const finalScore = gameStateRef.current.roundScore;
    onBallFinish(finalScore);
  }, [onBallFinish]);

  // Physics loop and canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Logical Board Dimensions: 390 x 620
    const BOARD_WIDTH = 390;
    const BOARD_HEIGHT = 620;

    // Load current stage obstacles
    const bumpers = stageConfig.bumpers.map((b) => ({ ...b }));
    const kickers = stageConfig.kickers.map((k) => ({ ...k }));
    const pins = stageConfig.pins.map((p) => ({ ...p }));

    // Score pockets at bottom
    const scorePockets = [
      { id: "p1", x1: 40, x2: 85, y: 535, pts: 100, label: "100分 格子", color: "#FF9800" },
      { id: "p2", x1: 85, x2: 130, y: 535, pts: 200, label: "200分 格子", color: "#00BCD4" },
      { id: "p3", x1: 130, x2: 175, y: 535, pts: 300, label: "爌肉飯 300分", color: "#E91E63" },
      { id: "p4", x1: 175, x2: 215, y: 535, pts: 500, label: "豬事大吉 500分", color: "#FFD700" },
      { id: "p5", x1: 215, x2: 260, y: 535, pts: 300, label: "爌肉飯 300分", color: "#E91E63" },
      { id: "p6", x1: 260, x2: 305, y: 535, pts: 200, label: "200分 格子", color: "#00BCD4" },
      { id: "p7", x1: 305, x2: 345, y: 535, pts: 100, label: "100分 格子", color: "#FF9800" },
    ];

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.033);
      lastTimestamp = now;

      // 1. UPDATE PHYSICS
      const ball = gameStateRef.current.ball;
      const spinner = gameStateRef.current.spinner;
      const bell = gameStateRef.current.bell;

      // Spinner dampening
      spinner.angle += spinner.speed * dt;
      spinner.speed *= 0.96;

      // Bell oscillation
      bell.angle += bell.swingSpeed * dt;
      bell.swingSpeed *= 0.92;
      bell.angle *= 0.95;

      if (ball.active && !ball.settled) {
        ball.inPlayTime += dt;

        // Anti-stuck Magnet Check: Trigger Piggy Magnetism if ball is in play > 8s
        if (ball.inPlayTime > 8 && !gameStateRef.current.magnetTimerActive) {
          gameStateRef.current.magnetTimerActive = true;
          setIsMagnetActive(true);
          soundManager.playMagnetActive();
        }

        // Sub-stepping for collision precision
        const steps = 6;
        const subDt = dt / steps;

        for (let step = 0; step < steps; step++) {
          if (gameStateRef.current.magnetTimerActive) {
            // Find nearest pocket center
            let targetX = 195;
            const targetY = 535;
            let minDist = 9999;
            scorePockets.forEach((p) => {
              const centerX = (p.x1 + p.x2) / 2;
              const dist = Math.hypot(centerX - ball.x, targetY - ball.y);
              if (dist < minDist) {
                minDist = dist;
                targetX = centerX;
              }
            });

            // Smooth magnetic tractor force
            const dx = targetX - ball.x;
            const dy = targetY - ball.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 10) {
              ball.vx = (dx / dist) * 190;
              ball.vy = (dy / dist) * 230;
            } else {
              ball.x = targetX;
              ball.y = targetY;
              ball.vx = 0;
              ball.vy = 20;
            }

            // Spawn purple-blue magnet trails
            if (Math.random() < 0.3) {
              gameStateRef.current.particles.push({
                x: ball.x + (Math.random() - 0.5) * 10,
                y: ball.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 20,
                color: "#C084FC",
                size: 3,
                life: 0,
                maxLife: 20,
              });
            }
          } else {
            // Standard Gravity & Dynamic Air Resistance
            const gravity = 520; // px/s^2
            ball.vy += gravity * subDt;
            ball.vx *= 0.9985;
            ball.vy *= 0.9985;
          }

          ball.x += ball.vx * subDt;
          ball.y += ball.vy * subDt;

          // ========================================================
          // 1.1 LAUNCH CHANNEL & TOP CURVED TRACK PHYSICS
          // ========================================================
          if (ball.inLaunchChannel) {
            // Inside the vertical right launch lane (x: 342~375, y: 120~560)
            if (ball.y >= 120) {
              // Right outer frame wall
              if (ball.x + ball.radius > 373) {
                ball.x = 373 - ball.radius;
                ball.vx = -Math.abs(ball.vx) * 0.5;
              }
              // Left lane divider rail
              if (ball.x - ball.radius < 345) {
                ball.x = 345 + ball.radius;
                ball.vx = Math.abs(ball.vx) * 0.5;
              }

              // Check if ball did not successfully exit into playfield and fell back down to launcher base
              if (!ball.hasExitedTop && ball.y >= 530 && ball.vy > 0) {
                ball.active = false;
                ball.settled = false;
                ball.inLaunchChannel = true;
                ball.hasExitedTop = false;
                ball.x = 362;
                ball.y = 535;
                ball.vx = 0;
                ball.vy = 0;
                ball.inPlayTime = 0;
                gameStateRef.current.plunger.tension = 0;
                gameStateRef.current.plunger.isDragging = false;
                setHasLaunched(false);
                setPlungerTension(0);
                setIsDraggingPlunger(false);
                soundManager.playPinBounce();
              }
            } else {
              // Reached top of launch lane (y < 120), smoothly curving left into the top arch
              if (ball.x < 342) {
                ball.inLaunchChannel = false;
                ball.hasExitedTop = true;
                // Add varied horizontal drift on exit so each run enters distinct lanes
                ball.vx = -12 + (Math.random() - 0.5) * 16;
              }
            }
          }

          // Top Arch Curve Guide (Center: 195, 120 | Outer Radius: 162)
          if (ball.y < 130) {
            const arcCenterX = 195;
            const arcCenterY = 120;
            const distFromArc = Math.hypot(ball.x - arcCenterX, ball.y - arcCenterY);

            // Outer Arch Boundary
            if (distFromArc > 162 - ball.radius && ball.y < 120) {
              const normalX = (arcCenterX - ball.x) / distFromArc;
              const normalY = (arcCenterY - ball.y) / distFromArc;
              ball.x = arcCenterX - normalX * (162 - ball.radius);
              ball.y = arcCenterY - normalY * (162 - ball.radius);

              const dot = ball.vx * normalX + ball.vy * normalY;
              ball.vx = (ball.vx - 1.9 * dot * normalX) * 0.85;
              ball.vy = (ball.vy - 1.9 * dot * normalY) * 0.85;

              // Tangential leftward guidance along arch
              if (ball.x > 195 && ball.vy < 0) {
                ball.vx -= 40 * subDt;
              }

              // Check Rainbow Gate Pass
              if (ball.x > 130 && ball.x < 260 && !gameStateRef.current.rainbowTriggered) {
                gameStateRef.current.rainbowTriggered = true;
                soundManager.playRainbowGate();
                addScorePopup(195, 60, 200, "🌈 雲端發票彩虹門");
              }
            }
          }

          // ========================================================
          // 1.2 MAIN PLAYFIELD WALLS
          // ========================================================
          // Left Wall
          if (ball.x - ball.radius < 36) {
            ball.x = 36 + ball.radius;
            ball.vx = Math.abs(ball.vx) * 0.78;
            soundManager.playPinBounce();
          }

          // Right Playfield Wall (Divider rail when inside playfield)
          if (!ball.inLaunchChannel) {
            if (ball.x + ball.radius > 342 && ball.y >= 120 && ball.y <= 510) {
              ball.x = 342 - ball.radius;
              ball.vx = -Math.abs(ball.vx) * 0.78;
              soundManager.playPinBounce();
            }
          }

          // ========================================================
          // 1.3 BUMPERS (肉圓碰撞柱 - 動態彈力係數與微角度散射)
          // ========================================================
          bumpers.forEach((b) => {
            const dx = ball.x - b.x;
            const dy = ball.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < b.r + ball.radius) {
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x = b.x + nx * (b.r + ball.radius + 1.5);
              const speed = Math.hypot(ball.vx, ball.vy);
              
              // Dynamic restitution per stage + micro randomized impulse
              const impulse = Math.max(speed * stageConfig.bumperBounceFactor, 275) + (Math.random() - 0.5) * 35;
              ball.vx = nx * impulse + (Math.random() - 0.5) * 28;
              ball.vy = ny * impulse + (Math.random() - 0.5) * 28;
              b.hitAnim = 12;
              soundManager.playBaWanBumper();
              addScorePopup(b.x, b.y - 15, b.pts, "🥟 肉圓碰撞");
            }
            if (b.hitAnim > 0) b.hitAnim--;
          });

          // ========================================================
          // 1.4 LUCKY BELL (稅務幸運鈴)
          // ========================================================
          const bellDx = ball.x - bell.x;
          const bellDy = ball.y - bell.y;
          const bellDist = Math.hypot(bellDx, bellDy);
          if (bellDist < bell.radius + ball.radius) {
            bell.swingSpeed = (ball.vx > 0 ? 9 : -9) + Math.random() * 4;
            const nx = bellDx / bellDist;
            const ny = bellDy / bellDist;
            ball.x = bell.x + nx * (bell.radius + ball.radius + 1.5);
            ball.vx = nx * (220 + (Math.random() - 0.5) * 40);
            ball.vy = ny * (220 + (Math.random() - 0.5) * 40);
            soundManager.playTaxBell();
            addScorePopup(bell.x, bell.y, 100, "🔔 稅務幸運鈴");
          }

          // ========================================================
          // 1.5 PIGGY SPINNER (豚寶轉盤)
          // ========================================================
          const spDx = ball.x - spinner.x;
          const spDy = ball.y - spinner.y;
          const spDist = Math.hypot(spDx, spDy);
          if (spDist < spinner.radius + ball.radius) {
            spinner.speed += (ball.vx + ball.vy) * 0.12 + 18;
            const nx = spDx / spDist;
            const ny = spDy / spDist;
            ball.x = spinner.x + nx * (spinner.radius + ball.radius + 1.5);
            ball.vx = nx * (200 + (Math.random() - 0.5) * 35);
            ball.vy = ny * (200 + (Math.random() - 0.5) * 35);
            soundManager.playPiggySpinner();
            const randomPts = Math.floor(Math.random() * 3 + 1) * 50; // 50, 100, 150
            addScorePopup(spinner.x, spinner.y, randomPts, "🎡 豚寶轉盤");
          }

          // ========================================================
          // 1.6 SAUSAGE KICKERS (香腸彈跳器 - 最多反彈2次後直接落入分數格)
          // ========================================================
          kickers.forEach((k) => {
            const lineX = k.x2 - k.x1;
            const lineY = k.y2 - k.y1;
            const lineLen = Math.hypot(lineX, lineY);
            const u = Math.max(0, Math.min(1, ((ball.x - k.x1) * lineX + (ball.y - k.y1) * lineY) / (lineLen * lineLen)));
            const nearestX = k.x1 + u * lineX;
            const nearestY = k.y1 + u * lineY;
            const dist = Math.hypot(ball.x - nearestX, ball.y - nearestY);

            if (dist < ball.radius + 14) {
              const hitCount = gameStateRef.current.sausageHitCount;

              if (hitCount === 0) {
                // 第 1 次反彈：正常向內向上彈射 (帶隨機角度微擾)
                gameStateRef.current.sausageHitCount = 1;
                ball.x = nearestX + k.nx * (ball.radius + 16);
                ball.y = nearestY + k.ny * (ball.radius + 16);
                ball.vx = k.nx * (260 + (Math.random() - 0.5) * 30);
                ball.vy = -240 + (Math.random() - 0.5) * 30;
                soundManager.playSausageKicker();
                addScorePopup(nearestX, nearestY, k.pts, "🌭 香腸彈跳 (1/2)");
              } else if (hitCount === 1) {
                // 第 2 次反彈：達到上限，直接向下導引落入下方得分格！
                gameStateRef.current.sausageHitCount = 2;
                ball.x = nearestX + k.nx * (ball.radius + 18);
                ball.y = nearestY + Math.abs(k.ny) * (ball.radius + 18);
                ball.vx = (k.nx > 0 ? 55 : -55) + (Math.random() - 0.5) * 20;
                ball.vy = 310; // 直接加速向下落入分數格
                soundManager.playSausageKicker();
                addScorePopup(nearestX, nearestY, k.pts, "🌭 香腸導向進洞");
              } else {
                // 超過 2 次：不再向上彈射，順暢向下落入分數格
                ball.x = nearestX + k.nx * (ball.radius + 16);
                ball.vy = Math.max(ball.vy, 250);
              }
            }
          });

          // ========================================================
          // 1.7 PINS (黃銅擋釘 - 7.5px，具備動態彈力與自然偏折)
          // ========================================================
          pins.forEach((pin) => {
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const dist = Math.hypot(dx, dy);
            if (dist < pin.r + ball.radius) {
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x = pin.x + nx * (pin.r + ball.radius + 0.5);
              const dot = ball.vx * nx + ball.vy * ny;
              const elast = stageConfig.pinElasticity;
              const spread = stageConfig.deflectionSpread;

              ball.vx = (ball.vx - 1.85 * dot * nx) * elast + (Math.random() - 0.5) * spread;
              ball.vy = (ball.vy - 1.85 * dot * ny) * elast + (Math.random() - 0.5) * spread;
              soundManager.playPinBounce();
            }
          });

          // ========================================================
          // 1.8 BOTTOM POCKET SETTLEMENT DETECTION (落入得分格子)
          // ========================================================
          if (ball.y > 510 && !ball.settled) {
            scorePockets.forEach((p, idx) => {
              if (ball.x >= p.x1 && ball.x <= p.x2 && ball.y >= p.y) {
                ball.settled = true;
                ball.vx = 0;
                ball.vy = 0;
                ball.x = (p.x1 + p.x2) / 2;
                ball.y = 525;

                gameStateRef.current.settledPocketIdx = idx;
                gameStateRef.current.settledTimer = 0;

                soundManager.playScoreHole();
                const mult = isGoldBall ? 2 : 1;
                const earned = p.pts * mult;
                gameStateRef.current.roundScore += earned;
                setCurrentRoundScore(gameStateRef.current.roundScore);

                // Show the celebratory Settlement Score Modal
                setSettlementModal({
                  pocketLabel: p.label,
                  pocketPts: earned,
                  obstacleBonusPts: gameStateRef.current.obstacleScore,
                  roundTotalPts: gameStateRef.current.roundScore,
                  isGold: isGoldBall,
                  isLastBall: ballNumber >= totalBalls,
                });

                // Spawn celebration particles at winning pocket
                for (let i = 0; i < 24; i++) {
                  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
                  const spd = 2 + Math.random() * 5.5;
                  gameStateRef.current.particles.push({
                    x: ball.x,
                    y: ball.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    color: isGoldBall
                      ? (i % 2 === 0 ? "#FFD700" : "#C084FC")
                      : (i % 2 === 0 ? "#C084FC" : "#9333EA"),
                    size: 3.5 + Math.random() * 3,
                    life: 0,
                    maxLife: 45,
                  });
                }
              }
            });
          }
        }
      }

      // Ball Out of Bounds Fallback
      if (ball.y > 610 && !ball.settled && ball.active) {
        ball.settled = true;
        const earned = 100 * (isGoldBall ? 2 : 1);
        gameStateRef.current.roundScore += earned;
        setCurrentRoundScore(gameStateRef.current.roundScore);

        setSettlementModal({
          pocketLabel: "幸運保底 100分",
          pocketPts: earned,
          obstacleBonusPts: gameStateRef.current.obstacleScore,
          roundTotalPts: gameStateRef.current.roundScore,
          isGold: isGoldBall,
          isLastBall: ballNumber >= totalBalls,
        });
      }

      // ========================================================
      // 2. DRAW BOARD ON CANVAS
      // ========================================================
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Wood Grain Board Background
      const bgGrad = ctx.createLinearGradient(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
      bgGrad.addColorStop(0, "#F5ECE1");
      bgGrad.addColorStop(0.5, "#EEDEC9");
      bgGrad.addColorStop(1, "#E4CEB5");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Decorative Wood Plank Lines
      ctx.strokeStyle = "rgba(120, 53, 15, 0.06)";
      ctx.lineWidth = 1;
      for (let y = 40; y < BOARD_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(345, y);
        ctx.stroke();
      }

      // Outer Solid Wooden Border Frame
      ctx.fillStyle = "#78350F";
      ctx.fillRect(0, 0, 35, BOARD_HEIGHT); // Left Frame
      ctx.fillRect(375, 0, 15, BOARD_HEIGHT); // Right Outer Frame
      ctx.fillRect(0, 0, BOARD_WIDTH, 20); // Top Frame
      ctx.fillRect(0, BOARD_HEIGHT - 25, BOARD_WIDTH, 25); // Bottom Frame

      // Curved Arch Guide at top
      ctx.beginPath();
      ctx.arc(195, 120, 160, Math.PI, 0, false);
      ctx.strokeStyle = "#B45309";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Rainbow Gate Header (雲端發票彩虹門 - 20px 特粗體)
      ctx.save();
      ctx.beginPath();
      ctx.arc(195, 80, 52, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.strokeStyle = "#4CAF50";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(195, 80, 45, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.strokeStyle = "#2196F3";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(195, 80, 38, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.strokeStyle = "#E91E63";
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = "#880E4F";
      ctx.font = "900 20px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
      ctx.shadowBlur = 4;
      ctx.fillText("🌈 雲端發票彩虹門 +200", 195, 46);
      ctx.restore();

      // Golden Tax Lucky Bell (稅務幸運鈴 - 動態位置)
      ctx.save();
      ctx.translate(bell.x, bell.y);
      ctx.rotate(bell.angle);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(0, -8, 20, Math.PI, 0, false);
      ctx.lineTo(24, 16);
      ctx.lineTo(-24, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#F57F17";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Bell Clapper
      ctx.fillStyle = "#E65100";
      ctx.beginPath();
      ctx.arc(0, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      // Enlarged "稅" Text
      ctx.fillStyle = "#B71C1C";
      ctx.font = "900 18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("稅", 0, 4);
      ctx.restore();

      // Bell sub-label
      ctx.fillStyle = "#880E4F";
      ctx.font = "900 16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔔 幸運鈴 +100", bell.x, bell.y + 40);

      // Sausage Kickers (香腸彈跳器 - 動態位置)
      kickers.forEach((k) => {
        ctx.save();
        ctx.strokeStyle = "#C62828";
        ctx.lineWidth = 22;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(k.x1, k.y1);
        ctx.lineTo(k.x2, k.y2);
        ctx.stroke();

        ctx.strokeStyle = "#FF8A80";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Sausage text enlarged 2x
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 18px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        const midX = (k.x1 + k.x2) / 2;
        const midY = (k.y1 + k.y2) / 2;
        ctx.fillText("香腸+50", midX + k.nx * 20, midY + k.ny * 20);
        ctx.restore();
      });

      // Ba-wan Bumpers (肉圓碰撞柱 - 動態位置)
      bumpers.forEach((b) => {
        ctx.save();
        const animScale = b.hitAnim > 0 ? 1.15 : 1.0;
        ctx.translate(b.x, b.y);
        ctx.scale(animScale, animScale);

        // Bumper glow
        const bGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, b.r);
        bGrad.addColorStop(0, "#FFF8E1");
        bGrad.addColorStop(0.7, "#FFE082");
        bGrad.addColorStop(1, "#FFB300");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#E65100";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner meat filling look
        ctx.fillStyle = "#D32F2F";
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Enlarged text "+20"
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 20px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+20", 0, 0);

        // Enlarged subtext "肉圓"
        ctx.fillStyle = "#5D4037";
        ctx.font = "900 16px system-ui, -apple-system, sans-serif";
        ctx.fillText("肉圓", 0, b.r + 16);
        ctx.restore();
      });

      // Piggy Spinner (豚寶轉盤 - 動態位置)
      ctx.save();
      ctx.translate(spinner.x, spinner.y);
      ctx.rotate(spinner.angle);
      // Spinner wheel blades
      for (let i = 0; i < 4; i++) {
        ctx.rotate((Math.PI * 2) / 4);
        ctx.fillStyle = i % 2 === 0 ? "#FF4081" : "#FFD54F";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, spinner.radius, -0.32, 0.32);
        ctx.closePath();
        ctx.fill();
      }
      // Spinner center hub
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#C2185B";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Spinner label enlarged 2x
      ctx.fillStyle = "#880E4F";
      ctx.font = "900 18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎡 豚寶轉盤 +50~150", spinner.x, spinner.y + 48);

      // Draw Brass Pins (Enlarged 7.5px - 動態佈局)
      pins.forEach((pin) => {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#B78103";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Bottom Scoring Pockets Dividers & Labels (22~24px text)
      scorePockets.forEach((p, idx) => {
        const isSettledWinningPocket = gameStateRef.current.settledPocketIdx === idx;

        // Divider bar
        ctx.fillStyle = "#8D6E63";
        ctx.fillRect(p.x1, 485, 3, 55);
        if (idx === scorePockets.length - 1) {
          ctx.fillRect(p.x2, 485, 3, 55);
        }

        // Pocket Background
        if (isSettledWinningPocket) {
          ctx.fillStyle = "#FFEB3B";
          ctx.fillRect(p.x1 + 1, 488, p.x2 - p.x1 + 1, 52);
          ctx.strokeStyle = "#D50000";
          ctx.lineWidth = 3;
          ctx.strokeRect(p.x1 + 1, 488, p.x2 - p.x1 + 1, 52);
        } else {
          ctx.fillStyle = p.pts >= 500 ? "#FFF9C4" : p.pts >= 300 ? "#FFEBEE" : "#F5F5F5";
          ctx.fillRect(p.x1 + 3, 490, p.x2 - p.x1 - 3, 48);
        }

        // Pocket Score Text (Only display points number without text)
        ctx.fillStyle = isSettledWinningPocket ? "#D50000" : p.color;
        ctx.font = isSettledWinningPocket ? "900 24px sans-serif" : "900 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const midX = (p.x1 + p.x2) / 2;
        ctx.fillText(`${p.pts}`, midX, 514);
      });

      // Launcher Channel Rail Divider
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(342, 120, 4, 440);

      // Current Plunger Pull Calculations
      const currentTension = gameStateRef.current.plunger.tension;
      const plungerBaseY = 556;
      const plungerPullY = currentTension * 38;
      const plungerY = plungerBaseY + plungerPullY - gameStateRef.current.plunger.recoilAnim;

      if (gameStateRef.current.plunger.recoilAnim > 0) {
        gameStateRef.current.plunger.recoilAnim -= 1.8;
      }

      // ==========================================
      // DRAW ELONGATED HEAVY SPRING COIL IN CHANNEL
      // ==========================================
      const springTopY = 475;
      const springBottomY = plungerY;
      const coilCount = 14;

      ctx.save();
      // 1. Spring outer ambient drop shadow
      ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= coilCount; i++) {
        const cy = springTopY + (i / coilCount) * (springBottomY - springTopY);
        const cx = i % 2 === 0 ? 353 : 371;
        if (i === 0) ctx.moveTo(cx + 1, cy + 1);
        else ctx.lineTo(cx + 1, cy + 1);
      }
      ctx.stroke();

      // 2. Main Steel / Bronze Spring Wire
      ctx.strokeStyle = currentTension > 0.8 ? "#DC2626" : currentTension > 0.4 ? "#D97706" : "#B45309";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= coilCount; i++) {
        const cy = springTopY + (i / coilCount) * (springBottomY - springTopY);
        const cx = i % 2 === 0 ? 353 : 371;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // 3. Inner metallic highlight sheen
      ctx.strokeStyle = currentTension > 0.8 ? "#FCA5A5" : currentTension > 0.4 ? "#FDE68A" : "#FDE047";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= coilCount; i++) {
        const cy = springTopY + (i / coilCount) * (springBottomY - springTopY);
        const cx = i % 2 === 0 ? 354 : 370;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.restore();

      // Plunger Head Plate
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(348, plungerY, 28, 9);
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 2;
      ctx.strokeRect(348, plungerY, 28, 9);

      // Plunger Metal Rod (Draggable Handle)
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(362, plungerY + 9);
      ctx.lineTo(362, 615);
      ctx.stroke();

      // Plunger Handle Grip Knob (Enlarged & Prominent for Mobile)
      ctx.fillStyle = currentTension > 0.8 ? "#DC2626" : "#B45309";
      ctx.beginPath();
      ctx.arc(362, Math.min(612, plungerY + 36), 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Knob metallic shine
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(360, Math.min(610, plungerY + 34), 3, 0, Math.PI * 2);
      ctx.fill();

      // Hint arrow when waiting to launch
      if (!ball.active && currentTension === 0 && !gameStateRef.current.plunger.isDragging) {
        ctx.save();
        ctx.fillStyle = "#991B1B";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        const bounce = Math.sin(Date.now() / 200) * 3;
        ctx.fillText("👇下拉", 362, plungerY + 23 + bounce);
        ctx.restore();
      }

      // ==========================================
      // FORCE GAUGE / 力氣條 (DISPLAYED ON CANVAS)
      // ==========================================
      if (!ball.active && (currentTension > 0 || gameStateRef.current.plunger.isDragging)) {
        ctx.save();
        const gaugeX = 296;
        const gaugeY = 350;
        const gaugeW = 40;
        const gaugeH = 175;
        const barPad = 5;
        const barH = gaugeH - 46;
        const fillHeight = barH * currentTension;
        const percentVal = Math.round(currentTension * 100);

        // Outer Meter Capsule Container
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.beginPath();
        ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 12);
        ctx.fill();
        ctx.strokeStyle = currentTension > 0.85 ? "#EF4444" : currentTension > 0.5 ? "#F59E0B" : "#10B981";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Meter Title
        ctx.fillStyle = "#FEF3C7";
        ctx.font = "900 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡力氣", gaugeX + gaugeW / 2, gaugeY + 18);

        // Meter Track Background
        const trackX = gaugeX + barPad;
        const trackY = gaugeY + 24;
        const trackW = gaugeW - barPad * 2;
        ctx.fillStyle = "#1E293B";
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, trackW, barH, 6);
        ctx.fill();

        // Gauge Fill Gradient (Lime -> Amber -> Crimson Red)
        if (fillHeight > 0) {
          const fillY = trackY + barH - fillHeight;
          const fGrad = ctx.createLinearGradient(0, trackY + barH, 0, trackY);
          fGrad.addColorStop(0, "#10B981");
          fGrad.addColorStop(0.5, "#F59E0B");
          fGrad.addColorStop(1, "#EF4444");

          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.roundRect(trackX, fillY, trackW, fillHeight, 6);
          ctx.fill();

          // Top level glowing line
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(trackX + 2, fillY, trackW - 4, 2.5);
        }

        // Percentage Text at bottom of gauge
        ctx.fillStyle = currentTension > 0.85 ? "#F87171" : currentTension > 0.5 ? "#FDE047" : "#6EE7B7";
        ctx.font = "900 14px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${percentVal}%`, gaugeX + gaugeW / 2, gaugeY + gaugeH - 6);

        ctx.restore();
      }

      // ==========================================
      // DRAW PURPLE PINBALL (晶瑩紫彈珠 / 紫金尊榮雙倍珠)
      // ==========================================
      if (ball.active) {
        ctx.save();
        // Vibrant Glossy Purple Pinball Core
        const purpleGrad = ctx.createRadialGradient(
          ball.x - 3.5,
          ball.y - 3.5,
          1.5,
          ball.x,
          ball.y,
          ball.radius
        );
        purpleGrad.addColorStop(0, "#FAF5FF");
        purpleGrad.addColorStop(0.25, "#E9D5FF");
        purpleGrad.addColorStop(0.65, "#9333EA");
        purpleGrad.addColorStop(0.9, "#6B21A8");
        purpleGrad.addColorStop(1, "#3B0764");

        ctx.fillStyle = purpleGrad;
        ctx.shadowColor = isGoldBall ? "#FFD700" : "#A855F7";
        ctx.shadowBlur = isGoldBall ? 14 : 10;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // High-gloss specular lens shine
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(ball.x - 3, ball.y - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // If Gold Multiplier active: draw shimmering golden halo & double sparkle
        if (isGoldBall) {
          ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius + 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // Resting Purple Ball on top of Plunger
        ctx.save();
        const ballRestY = 544 + plungerPullY;
        const restGrad = ctx.createRadialGradient(
          359,
          ballRestY - 3.5,
          1.5,
          362,
          ballRestY,
          9.5
        );
        restGrad.addColorStop(0, "#FAF5FF");
        restGrad.addColorStop(0.25, "#E9D5FF");
        restGrad.addColorStop(0.65, "#9333EA");
        restGrad.addColorStop(0.9, "#6B21A8");
        restGrad.addColorStop(1, "#3B0764");

        ctx.fillStyle = restGrad;
        ctx.shadowColor = isGoldBall ? "#FFD700" : "#A855F7";
        ctx.shadowBlur = isGoldBall ? 12 : 8;
        ctx.beginPath();
        ctx.arc(362, ballRestY, 9.5, 0, Math.PI * 2);
        ctx.fill();

        // Highlight shine on resting ball
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(359.5, ballRestY - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (isGoldBall) {
          ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(362, ballRestY, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Particles (Purple & Gold sparks)
      gameStateRef.current.particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          gameStateRef.current.particles.splice(pIdx, 1);
        }
      });

      // Draw Floating Points Text Popups
      gameStateRef.current.floatingTexts.forEach((ft, ftIdx) => {
        ft.y -= 1.2;
        ft.life++;
        const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
        if (alpha > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = ft.color;
          ctx.font = "900 16px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 4;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        } else {
          gameStateRef.current.floatingTexts.splice(ftIdx, 1);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ballNumber, isGoldBall, onBallFinish, totalBalls, addScorePopup, stageConfig]);

  // Pointer drag events on canvas plunger channel or purple ball
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (hasLaunched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 390 / rect.width;
    const scaleY = 620 / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Check if clicked in launcher lane (x: 260~390) or plunger/ball area (y >= 380)
    if (canvasX >= 260 || canvasY >= 380) {
      try {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {}
      gameStateRef.current.plunger.isDragging = true;
      gameStateRef.current.plunger.startY = e.clientY;
      setIsDraggingPlunger(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!gameStateRef.current.plunger.isDragging || hasLaunched) return;
    const dy = e.clientY - gameStateRef.current.plunger.startY;
    // Fast response tension scaling: mobile user only needs to drag ~42px to reach 100% full maximum tension!
    const tension = Math.max(0, Math.min(1.0, dy / 42));
    setPlungerTension(tension);
    gameStateRef.current.plunger.tension = tension;
    soundManager.playPlungerPull(tension);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!gameStateRef.current.plunger.isDragging || hasLaunched) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    const currentTension = gameStateRef.current.plunger.tension || plungerTension;
    gameStateRef.current.plunger.isDragging = false;
    setIsDraggingPlunger(false);

    // ONLY when finger is released, if there is pull tension, launch the purple ball!
    if (currentTension >= 0.08) {
      launchBall(currentTension);
    } else {
      setPlungerTension(0);
      gameStateRef.current.plunger.tension = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto relative select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Game Top HUD */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#FEF3C7] rounded-t-xl border-t-2 border-x-2 border-[#78350F] text-xs font-black shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[#78350F] bg-amber-200/80 px-2.5 py-0.5 rounded-full text-xs">
            第 {ballNumber} 關：{stageConfig.stageName}
          </span>
          {isGoldBall ? (
            <span className="flex items-center gap-1 text-[#78350F] bg-yellow-300 font-black px-2 py-0.5 rounded-full text-xs border border-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              紫金 2x
            </span>
          ) : (
            <span className="flex items-center gap-1 text-purple-950 bg-purple-100 font-black px-2 py-0.5 rounded-full text-xs border border-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-600 inline-block shadow-sm"></span>
              紫色 1x
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 font-black text-[#DC2626] text-sm">
          <span>本顆累積:</span>
          <span className="text-base text-[#DC2626] font-mono tracking-tight font-black">
            +{currentRoundScore}
          </span>
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div className="relative w-full flex-1 max-h-[calc(100%-40px)] aspect-[390/620] bg-[#1A1A1A] rounded-b-xl overflow-hidden shadow-2xl border-2 border-[#78350F] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={390}
          height={620}
          onPointerDown={handlePointerDown}
          className={`w-full h-full object-contain ${!hasLaunched ? "cursor-grab active:cursor-grabbing" : ""}`}
        />

        {/* Floating Realtime Force Bar Toast when dragging */}
        {isDraggingPlunger && !hasLaunched && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex flex-col items-center gap-1.5 z-20 min-w-[200px] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between w-full text-xs font-black">
              <span className="flex items-center gap-1 text-amber-400">
                <Gauge className="w-4 h-4 text-amber-400 animate-pulse" />
                發射力道
              </span>
              <span
                className={`font-mono text-base font-black ${
                  plungerTension > 0.8
                    ? "text-red-400"
                    : plungerTension > 0.4
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {Math.round(plungerTension * 100)}%
              </span>
            </div>

            {/* Horizontal Force Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  plungerTension > 0.8
                    ? "bg-gradient-to-r from-amber-500 to-red-500"
                    : plungerTension > 0.4
                    ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.round(plungerTension * 100)}%` }}
              />
            </div>

            <div className="text-[10px] text-amber-200/90 font-bold">
              👉 手指放開立即發射！
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SETTLEMENT SCORE PROMPT MODAL (彈珠落入格子後的得分表) */}
        {/* ======================================================== */}
        {settlementModal && (
          <div
            id="settlement-score-modal"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="w-full max-w-[310px] bg-[#FFFBEB] rounded-3xl border-4 border-[#78350F] shadow-2xl p-4 sm:p-5 flex flex-col items-center space-y-3.5 relative">
              {/* Score Breakdown Card */}
              <div className="w-full bg-white rounded-2xl p-3.5 border-2 border-amber-200 shadow-sm space-y-2.5 text-xs font-bold text-[#78350F]">
                {/* 1. 進洞得分 */}
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <span className="text-slate-600 font-bold text-sm">進洞得分</span>
                  <span className="font-mono text-base text-[#B45309] font-black">
                    +{settlementModal.pocketPts} 分
                  </span>
                </div>

                {/* 2. 加成倍率 */}
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <span className="text-slate-600 font-bold text-sm">加成倍率</span>
                  <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {settlementModal.isGold ? "2 倍 (紫金雙倍)" : "1 倍"}
                  </span>
                </div>

                {/* 3. 碰撞阻礙物加分 */}
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <span className="text-slate-600 font-bold text-sm">碰撞阻礙物加分</span>
                  <span className="font-mono text-base text-emerald-700 font-black">
                    +{settlementModal.obstacleBonusPts} 分
                  </span>
                </div>

                {/* 4. 本回合總得分 */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-black text-[#DC2626]">本回合總得分</span>
                  <span className="text-2xl font-black text-[#DC2626] font-mono tracking-tight">
                    +{settlementModal.roundTotalPts} 分
                  </span>
                </div>
              </div>

              {/* 5. 進入下一關問答按鈕 */}
              <button
                id="settlement-next-btn"
                type="button"
                onClick={handleProceedNext}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-b from-[#DC2626] to-[#991B1B] text-white font-black text-sm sm:text-base shadow-lg border-2 border-amber-300 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {settlementModal.isLastBall ? (
                  <>
                    <Trophy className="w-5 h-5 text-yellow-300" />
                    <span>查看總成績</span>
                  </>
                ) : (
                  <>
                    <span>進入下一關問答</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Piggy Magnetism Active Overlay Alert */}
        {isMagnetActive && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#DC2626] text-white font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce border-2 border-white z-20">
            <Zap className="w-5 h-5 text-yellow-300 animate-spin" />
            <span>豚寶磁力啟動！引導進洞</span>
          </div>
        )}
      </div>
    </div>
  );
};
