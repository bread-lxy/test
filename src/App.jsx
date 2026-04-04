import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BUTTON_SIZE = 280;
const DODGE_RADIUS = 150;
const WIPE_GOAL = 35;
const GAME_OVER_THRESHOLD = 90;
const GRACE_PERIOD_MS = 6500;
const EMOJIS = [
  "\u{1F62D}",
  "\u{1F921}",
  "\u{1F4A5}",
  "\u{1F635}",
  "\u{1FAE0}",
  "\u{1F441}",
  "\u{1F485}",
  "\u{1F9FB}",
  "\u{1F621}",
  "\u{1F300}",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeEmojiWall(length) {
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  }

  return result;
}

function createTear(originX, originY, viewport) {
  const size = randomBetween(16, 30);

  return {
    id: crypto.randomUUID(),
    x: clamp(originX + randomBetween(-56, 56), size, viewport.width - size),
    y: clamp(originY + randomBetween(40, 90), size, viewport.height - size),
    vx: randomBetween(-1.6, 1.6),
    vy: randomBetween(0.35, 1.4),
    size,
    rotate: randomBetween(-20, 20),
  };
}

export default function App() {
  const buttonRef = useRef(null);
  const dodgeLock = useRef(false);
  const spawnTimer = useRef(null);
  const animationFrame = useRef(null);
  const emojiRef = useRef(makeEmojiWall(12));
  const meltdownStartedAt = useRef(0);

  const [phase, setPhase] = useState("tease");
  const [viewport, setViewport] = useState({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  });
  const [pointer, setPointer] = useState({
    x: (typeof window === "undefined" ? 1440 : window.innerWidth) / 2,
    y: (typeof window === "undefined" ? 900 : window.innerHeight) / 2,
  });
  const [buttonPosition, setButtonPosition] = useState({
    x: ((typeof window === "undefined" ? 1440 : window.innerWidth) - BUTTON_SIZE) / 2,
    y: ((typeof window === "undefined" ? 900 : window.innerHeight) - BUTTON_SIZE) / 2,
  });
  const [tears, setTears] = useState([]);
  const [wipedCount, setWipedCount] = useState(0);
  const [chaosText, setChaosText] = useState({
    headline: "",
    body: "",
    counter: "",
  });
  const [meltdownElapsed, setMeltdownElapsed] = useState(0);

  const showTutorial = phase === "meltdown" && meltdownElapsed < 5000;
  const gameOver =
    phase === "meltdown" &&
    meltdownElapsed > GRACE_PERIOD_MS &&
    tears.length > GAME_OVER_THRESHOLD;

  useEffect(() => {
    function handleResize() {
      const nextViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setViewport(nextViewport);
      setButtonPosition((current) => ({
        x: clamp(current.x, 24, nextViewport.width - BUTTON_SIZE - 24),
        y: clamp(current.y, 24, nextViewport.height - BUTTON_SIZE - 24),
      }));
      setTears((current) =>
        current.map((tear) => ({
          ...tear,
          x: clamp(tear.x, tear.size, nextViewport.width - tear.size),
          y: clamp(tear.y, tear.size, nextViewport.height - tear.size),
        })),
      );
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handlePointerMove(event) {
      setPointer({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    if (phase !== "tease" || !buttonRef.current || dodgeLock.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = pointer.x - centerX;
    const dy = pointer.y - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance >= DODGE_RADIUS) {
      return;
    }

    dodgeLock.current = true;
    setButtonPosition((current) => {
      let nextX = current.x;
      let nextY = current.y;

      for (let attempt = 0; attempt < 18; attempt += 1) {
        const candidateX = randomBetween(24, Math.max(24, viewport.width - BUTTON_SIZE - 24));
        const candidateY = randomBetween(24, Math.max(24, viewport.height - BUTTON_SIZE - 24));
        const candidateCenterX = candidateX + BUTTON_SIZE / 2;
        const candidateCenterY = candidateY + BUTTON_SIZE / 2;

        if (Math.hypot(pointer.x - candidateCenterX, pointer.y - candidateCenterY) > DODGE_RADIUS * 1.2) {
          nextX = candidateX;
          nextY = candidateY;
          break;
        }
      }

      return { x: nextX, y: nextY };
    });

    window.setTimeout(() => {
      dodgeLock.current = false;
    }, 120);
  }, [buttonPosition.x, buttonPosition.y, phase, pointer.x, pointer.y, viewport.height, viewport.width]);

  useEffect(() => {
    if (phase !== "meltdown") {
      return undefined;
    }

    meltdownStartedAt.current = performance.now();

    function tickClock() {
      setMeltdownElapsed(performance.now() - meltdownStartedAt.current);
    }

    tickClock();
    const clockId = window.setInterval(tickClock, 120);

    return () => {
      window.clearInterval(clockId);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "meltdown") {
      return undefined;
    }

    function spawnTears() {
      const rect = buttonRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height * 0.58;

      setTears((current) => {
        const burstSize = meltdownElapsed > 12000 ? 4 : meltdownElapsed > 7000 ? 3 : 2;
        const freshTears = Array.from({ length: burstSize }, () => createTear(originX, originY, viewport));
        return [...current, ...freshTears].slice(-110);
      });
    }

    spawnTears();
    const spawnDelay = meltdownElapsed > 12000 ? 170 : meltdownElapsed > 7000 ? 210 : 280;
    spawnTimer.current = window.setInterval(spawnTears, spawnDelay);

    return () => {
      window.clearInterval(spawnTimer.current);
    };
  }, [meltdownElapsed, phase, viewport]);

  useEffect(() => {
    if (phase !== "meltdown") {
      return undefined;
    }

    let previous = performance.now();

    function step(now) {
      const delta = Math.min((now - previous) / 16.6667, 2.5);
      previous = now;

      setTears((current) => {
        let wipedThisFrame = 0;

        const updated = current.flatMap((tear) => {
          const radius = tear.size / 2;
          const nextVy = tear.vy + 0.08 * delta;
          let nextX = tear.x + tear.vx * 2.5 * delta;
          let nextY = tear.y + nextVy * 2.8 * delta;
          let nextVx = tear.vx;
          let nextFinalVy = nextVy;
          let nextRotate = tear.rotate + tear.vx * 1.8;

          if (nextX <= radius || nextX >= viewport.width - radius) {
            nextX = clamp(nextX, radius, viewport.width - radius);
            nextVx *= -0.94;
          }

          if (nextY <= radius) {
            nextY = radius;
            nextFinalVy *= -0.75;
          }

          if (nextY >= viewport.height - radius) {
            nextY = viewport.height - radius;
            nextFinalVy *= -0.82;
            nextVx *= 0.985;
          }

          if (phase === "meltdown" && Math.hypot(pointer.x - nextX, pointer.y - nextY) < radius + 52) {
            wipedThisFrame += 1;
            return [];
          }

          return [
            {
              ...tear,
              x: nextX,
              y: nextY,
              vx: nextVx,
              vy: nextFinalVy,
              rotate: nextRotate,
            },
          ];
        });

        if (wipedThisFrame > 0) {
          setWipedCount((currentCount) => currentCount + wipedThisFrame);
        }

        return updated;
      });

      animationFrame.current = window.requestAnimationFrame(step);
    }

    animationFrame.current = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrame.current);
    };
  }, [phase, pointer.x, pointer.y, viewport.height, viewport.width]);

  useEffect(() => {
    if (phase === "meltdown" && wipedCount >= WIPE_GOAL) {
      setPhase("redeemed");
      setTears([]);
    }
  }, [phase, wipedCount]);

  useEffect(() => {
    if (!gameOver) {
      return;
    }

    const intervalId = window.setInterval(() => {
      emojiRef.current = makeEmojiWall(12);
      setChaosText({
        headline: makeEmojiWall(8),
        body: makeEmojiWall(18),
        counter: makeEmojiWall(10),
      });
    }, 240);

    return () => window.clearInterval(intervalId);
  }, [gameOver]);

  function triggerMeltdown() {
    setTears([]);
    setWipedCount(0);
    setChaosText({
      headline: "",
      body: "",
      counter: "",
    });
    setMeltdownElapsed(0);
    setPhase("meltdown");
  }

  function resetExperience() {
    setPhase("tease");
    setTears([]);
    setWipedCount(0);
    setChaosText({
      headline: "",
      body: "",
      counter: "",
    });
    setMeltdownElapsed(0);
    setButtonPosition({
      x: (viewport.width - BUTTON_SIZE) / 2,
      y: (viewport.height - BUTTON_SIZE) / 2,
    });
  }

  const headline = gameOver
    ? chaosText.headline || makeEmojiWall(8)
    : phase === "redeemed"
      ? "Okay... maybe you do have empathy."
    : phase === "tease"
      ? "The Emotionally Unstable Button"
      : "Contain the cyber tears before the guilt consumes the room.";

  const bodyText = gameOver
    ? chaosText.body || makeEmojiWall(18)
    : phase === "redeemed"
      ? "You wiped the tears, stabilized the button, and prevented the full empathy apocalypse."
    : phase === "tease"
      ? "Move slowly. It can smell intention."
      : "Blue tears are the targets. Move the tissue cursor over them to wipe them away before the panic meter fills.";

  const counterText = gameOver
    ? chaosText.counter || makeEmojiWall(10)
    : phase === "redeemed"
      ? `Calmed down. Tears wiped: ${wipedCount} / ${WIPE_GOAL}`
      : `Active tears: ${tears.length} / ${GAME_OVER_THRESHOLD} / Wiped: ${wipedCount} / ${WIPE_GOAL}`;

  const buttonText = gameOver
    ? `${emojiRef.current} ${emojiRef.current}`
    : phase === "redeemed"
      ? "fine. forgiven."
    : phase === "tease"
      ? "DO NOT CLICK"
      : "WHY WOULD YOU DO THAT?!";

  return (
    <main
      className={`app-shell ${
        phase === "meltdown"
          ? "chaos-grid cursor-hidden"
          : phase === "redeemed"
            ? "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(218,255,239,0.95)),linear-gradient(135deg,_#dbfff0_0%,_#b9ffe1_100%)]"
            : "minimal-grid"
      } text-zinc-950`}
    >
      <div className="noise" />

      {phase === "meltdown" && !gameOver && (
        <>
          <motion.div
            className="absolute -left-24 top-[-18%] h-[38rem] w-[38rem] rounded-full bg-cyan-300/30 blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [0, 80, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-yellow-200/25 blur-3xl"
            animate={{ scale: [1, 1.15, 1], x: [0, -70, 0], y: [0, 60, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-6 pt-8 text-center sm:pt-12">
        <motion.p
          className={`max-w-4xl text-[clamp(1.4rem,2vw,2rem)] font-black uppercase tracking-[0.32em] ${
            phase === "meltdown" ? "text-white" : "text-zinc-900"
          }`}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {headline}
        </motion.p>
        <motion.p
          className={`mt-3 max-w-2xl text-sm font-bold uppercase tracking-[0.42em] sm:text-base ${
            phase === "meltdown" ? "text-white/85" : "text-zinc-500"
          }`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          {bodyText}
        </motion.p>
      </header>

      <motion.div
        ref={buttonRef}
        className="absolute z-30"
        initial={false}
        animate={{
          x: buttonPosition.x,
          y: buttonPosition.y,
          scale: phase === "tease" ? 1 : phase === "redeemed" ? 0.96 : 1.04,
        }}
        transition={{
          x: { type: "spring", stiffness: 260, damping: 18, mass: 0.55 },
          y: { type: "spring", stiffness: 260, damping: 18, mass: 0.55 },
          scale: { type: "spring", stiffness: 180, damping: 14 },
        }}
      >
        <motion.button
          type="button"
          onClick={phase === "redeemed" ? resetExperience : triggerMeltdown}
          className={`relative flex h-[280px] w-[280px] items-center justify-center rounded-full border-0 bg-transparent p-0 ${
            phase === "meltdown" ? "violent-shake" : ""
          }`}
          whileTap={{ scale: 0.96 }}
          animate={
            phase === "meltdown"
              ? {
                  boxShadow: [
                    "0 0 0 rgba(255,255,255,0)",
                    "0 0 44px rgba(255, 245, 248, 0.34)",
                    "0 0 0 rgba(255,255,255,0)",
                  ],
                }
              : phase === "redeemed"
                ? {
                    boxShadow: [
                      "0 14px 44px rgba(57, 157, 122, 0.22)",
                      "0 20px 70px rgba(130, 255, 193, 0.36)",
                      "0 14px 44px rgba(57, 157, 122, 0.22)",
                    ],
                  }
              : {
                  boxShadow: [
                    "0 18px 50px rgba(0,0,0,0.16)",
                    "0 24px 64px rgba(214, 21, 24, 0.24)",
                    "0 18px 50px rgba(0,0,0,0.16)",
                  ],
                }
          }
          transition={{ duration: phase === "meltdown" ? 0.55 : 2.2, repeat: Infinity }}
        >
          <span className="button-rim" />
          <span className="button-gloss" />
          <span className="relative z-10 max-w-[82%] text-center text-[2rem] font-black leading-none tracking-[0.16em] text-white drop-shadow-[0_5px_8px_rgba(70,0,0,0.55)] sm:text-[2.25rem]">
            {buttonText}
          </span>
          <span className="pointer-events-none absolute inset-x-[18%] top-[12%] h-[18%] rounded-full bg-white/55 blur-xl" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {tears.map((tear) => (
          <motion.div
            key={tear.id}
            className="tear z-20"
            style={{
              width: tear.size,
              height: tear.size * 1.28,
              left: tear.x - tear.size / 2,
              top: tear.y - tear.size / 2,
              transform: `rotate(${tear.rotate}deg)`,
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.2 }}
            transition={{ duration: 0.12 }}
          />
        ))}
      </AnimatePresence>

      {phase === "meltdown" && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5 sm:px-8 sm:pb-7"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-[2rem] border border-white/25 bg-white/12 px-5 py-4 text-center shadow-[0_18px_80px_rgba(110,0,66,0.22)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-white/80">
              Swipe the tissue across glowing blue tears
            </p>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white sm:text-right">
              {counterText}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/20 sm:w-48">
              <motion.div
                className="h-full rounded-full bg-cyan-200"
                animate={{ width: `${Math.min((wipedCount / WIPE_GOAL) * 100, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {phase === "meltdown" && (
        <motion.div
          className="tissue-cursor"
          animate={{ x: pointer.x, y: pointer.y, scale: [1, 1.06, 1] }}
          transition={{
            x: { type: "spring", stiffness: 900, damping: 38, mass: 0.2 },
            y: { type: "spring", stiffness: 900, damping: 38, mass: 0.2 },
            scale: { duration: 0.7, repeat: Infinity },
          }}
        >
          <div>{"\u{1F9FB}"}</div>
        </motion.div>
      )}

      <AnimatePresence>
        {showTutorial && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[18%] z-40 mx-auto w-[min(92vw,40rem)]"
            initial={{ opacity: 0, y: -18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="rounded-[2rem] border border-white/35 bg-white/18 px-6 py-5 text-center text-white shadow-[0_24px_90px_rgba(84,0,55,0.28)] backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.42em] text-cyan-100">
                New objective
              </p>
              <p className="mt-3 text-2xl font-black uppercase tracking-[0.18em]">
                Wipe {WIPE_GOAL} tears to calm it down
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.22em] text-white/85">
                Blue droplets are destroyable. Your tissue has a generous hit zone now, so sweep through them.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameOver && (
        <div className="marquee-wall">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`marquee-line ${index % 2 === 0 ? "" : "reverse"}`}>
              {"YOU LACK EMPATHY!!! ".repeat(8)}
            </div>
          ))}
        </div>
      )}

      {phase === "redeemed" && (
        <motion.div
          className="absolute bottom-10 left-1/2 z-30 w-[min(92vw,40rem)] -translate-x-1/2 rounded-[2rem] border border-emerald-200/80 bg-white/70 px-6 py-5 text-center shadow-[0_18px_70px_rgba(57,157,122,0.18)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-black uppercase tracking-[0.42em] text-emerald-600">
            Redemption achieved
          </p>
          <p className="mt-3 text-base font-black uppercase tracking-[0.18em] text-emerald-950">
            Click the button again if you want to re-trigger the emotional disaster.
          </p>
        </motion.div>
      )}
    </main>
  );
}
