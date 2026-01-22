"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);

  const scoreRef = useRef(0);
  const fishesRef = useRef([]);

  // 🔄 Restart Game Function
const restartGame = () => {
  scoreRef.current = 0;
  setScore(0);

  setTimeLeft(30);
  setGameOver(false);

  // recreate fishes
  fishesRef.current = Array.from({ length: 3 }, () => ({
    x: Math.random() * 500 + 70,
    y: Math.random() * 300 + 90,
    size: 25,
    speedX: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? -1 : 1),
    speedY: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? -1 : 1)
  }));
};


  useEffect(() => {
    // ✅ SAFETY CHECK (VERY IMPORTANT)
    if (!window.Hands || !window.Camera) {
      console.error("MediaPipe not loaded");
      return;
    }

    const Hands = window.Hands;
    const Camera = window.Camera;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 640;
    canvas.height = 480;

    // 🐟 Create fish
    function createFish() {
      return {
        x: Math.random() * 500 + 70,
        y: Math.random() * 300 + 90,
        size: 25,
        speedX: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? -1 : 1),
        speedY: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? -1 : 1)
      };
    }

    fishesRef.current = Array.from({ length: 3 }, createFish);

    function drawFish(f) {
      ctx.save();
      ctx.translate(f.x, f.y);

      ctx.beginPath();
      ctx.ellipse(0, 0, f.size * 1.2, f.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = "orange";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-f.size * 1.2, 0);
      ctx.lineTo(-f.size * 2, -f.size);
      ctx.lineTo(-f.size * 2, f.size);
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(f.size * 0.6, -5, 4, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();

      ctx.restore();
    }

    function moveFishes() {
      fishesRef.current.forEach(f => {
        f.x += f.speedX;
        f.y += f.speedY;

        if (f.x < 40 || f.x > canvas.width - 40) f.speedX *= -1;
        if (f.y < 40 || f.y > canvas.height - 40) f.speedY *= -1;
      });
    }

    // ✋ MediaPipe Hands
    const hands = new Hands({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(results => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (gameOver) return;

      moveFishes();
      fishesRef.current.forEach(drawFish);

      if (results.multiHandLandmarks?.length > 0) {
        const tip = results.multiHandLandmarks[0][8];
        const x = tip.x * canvas.width;
        const y = tip.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();

        fishesRef.current.forEach((f, i) => {
          if (Math.hypot(x - f.x, y - f.y) < f.size) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            fishesRef.current[i] = createFish();
          }
        });
      }
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480
    });

    camera.start();

    // ⏱ Timer
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      camera.stop();
      clearInterval(timer);
    };
  }, [gameOver]);

  return (
    <main>
      <h1>🐟 Catch the Fish</h1>
      <p>Touch the fish with your index finger</p>

      <h2>⏱ {timeLeft}s</h2>
      <div id="score">Score: {score}</div>

      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} />
      {gameOver && (
     <>
      <h2>🏆 Game Over!</h2>
      <button onClick={restartGame}>
        🔄 Restart Game
      </button>
     </>
      )}
    </main>
  );
}
