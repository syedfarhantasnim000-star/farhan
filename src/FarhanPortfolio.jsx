/* eslint-disable */
/**
 * FARHAN T. — Portfolio
 * Night.co-inspired: line-mask reveals, sticky hero, ambient mobile video,
 * diagonal brain section, before/after sliders, contact dropdown.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useInView,
} from "framer-motion";

/* ══════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════ */
function GlobalStyles() {
  useEffect(() => {
    if (!document.getElementById("ft-font")) {
      const l = document.createElement("link");
      l.id = "ft-font";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap";
      document.head.appendChild(l);
    }
    let s = document.getElementById("ft-css");
    if (!s) { s = document.createElement("style"); s.id = "ft-css"; document.head.appendChild(s); }
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background:#000; color:#fff; overflow-x:hidden; font-family:'Montserrat',sans-serif; }
      @media (pointer:fine) { body { cursor:none; } }
      ::selection { background:#fff; color:#000; }
      ::-webkit-scrollbar { width:2px; }
      ::-webkit-scrollbar-track { background:#000; }
      ::-webkit-scrollbar-thumb { background:#222; }
      .line-mask { overflow:hidden; display:block; }

      /* ── PERFORMANCE: force hardware acceleration on animated elements ── */
      /* GPU handles transform + opacity natively — zero JS thread cost */
      .hero-vid {
        position:absolute; inset:0; z-index:0;
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
      }
      video {
        display: block;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-color-correction: none;
        color-correction: none;
        image-rendering: auto;
      }
      @media screen and (color-gamut: p3) { video { filter: none; } }

      /* ── PERFORMANCE: on mobile, disable backdrop-filter (very expensive) ── */
      @media (max-width:767px) {
        .contact-dropdown {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: rgba(0,0,0,0.97) !important;
        }
      }

      /* ── PERFORMANCE: promote brain images to own GPU layer ── */
      .brain-img-a, .brain-img-b {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
      }

      .brain-section {
        position:relative; width:100%; min-height:100vh;
        background:#000; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
        /* Isolate brain section into its own stacking context */
        isolation: isolate;
      }
      .brain-img-a { position:absolute; top:4%; left:0; width:42vw; aspect-ratio:16/9; z-index:1; overflow:hidden; }
      .brain-img-b { position:absolute; bottom:4%; right:0; width:42vw; aspect-ratio:16/9; z-index:1; overflow:hidden; }
      .brain-text  { position:relative; z-index:10; text-align:center; padding:0 5vw; max-width:50vw; }
      @media (max-width:767px) {
        .brain-img-a,.brain-img-b { position:static!important; width:100%!important; aspect-ratio:16/9!important; transform:none!important; }
        .brain-text { position:static!important; max-width:100%!important; padding:2.5rem 6vw!important; text-align:center!important; transform:none!important; }
      }
      @media (max-width:540px) { .work-grid { grid-template-columns:1fr!important; } }

      /* ── PERFORMANCE: on mobile disable screenshot blur animation ── */
      @media (max-width:767px) {
        .brain-img-a img, .brain-img-b img {
          filter: none !important;
          transition: opacity 0.6s ease !important;
        }
      }

      .contact-dropdown {
        position:absolute; top:calc(100% + 10px); right:0;
        background:rgba(0,0,0,0.92); border:1px solid rgba(255,255,255,0.12);
        padding:12px 16px; display:flex; gap:18px; align-items:center;
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      }

      /* ── PERFORMANCE: hint browser to prepare scroll compositing ── */
      section { contain: layout style; }
    `;
  }, []);
  return null;
}

/* ══════════════════════════════════════════════════════
   CUSTOM CURSOR  (desktop only)
══════════════════════════════════════════════════════ */
function Cursor() {
  const mx = useMotionValue(-120);
  const my = useMotionValue(-120);
  const x  = useSpring(mx, { stiffness: 650, damping: 34 });
  const y  = useSpring(my, { stiffness: 650, damping: 34 });
  const [big, setBig]     = useState(false);
  const [vis, setVis]     = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer:coarse)").matches);
  }, []);

  useEffect(() => {
    if (touch) return;
    const onMove = (e) => { mx.set(e.clientX); my.set(e.clientY); setVis(true); };
    const onOver = (e) => { setBig(!!e.target.closest("a,button")); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [touch, mx, my]);

  if (touch) return null;

  return (
    <motion.div
      animate={{ width: big ? 38 : 11, height: big ? 38 : 11, opacity: vis ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        position: "fixed", top: 0, left: 0, zIndex: 9999,
        x, y, translateX: "-50%", translateY: "-50%",
        borderRadius: "50%", background: "#fff",
        pointerEvents: "none", mixBlendMode: "difference",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   NIGHT.CO LINE-MASK REVEAL  (bi-directional, once:false)
══════════════════════════════════════════════════════ */
function NightLine({ children, delay = 0, style = {}, className = "" }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-6% 0px" });

  return (
    <span ref={ref} className={`line-mask ${className}`} style={style}>
      <motion.span
        style={{ display: "block" }}
        animate={inView ? { y: "0%", opacity: 1 } : { y: "108%", opacity: 0 }}
        transition={{ duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function NightText({ lines = [], baseDelay = 0, lineDelay = 0.12, textStyle = {} }) {
  return (
    <div>
      {lines.map((line, i) => (
        <NightLine key={i} delay={baseDelay + i * lineDelay} style={{ display: "block", ...textStyle }}>
          {line}
        </NightLine>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SOCIAL LINKS (shared)
══════════════════════════════════════════════════════ */
const SOCIALS = [
  {
    label: "Instagram", href: "https://www.instagram.com/_farhantasnim/",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  },
  {
    label: "WhatsApp", href: "https://wa.me/8801722510256",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
  },
  {
    label: "Email", href: "https://mail.google.com/mail/?view=cm&fs=1&to=syedfarhantasnim000@gmail.com",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
];

/* ══════════════════════════════════════════════════════
   HEADER  with CONTACT dropdown
══════════════════════════════════════════════════════ */
function Header() {
  const { scrollY } = useScroll();
  const [solid,   setSolid]   = useState(false);
  const [open,    setOpen]    = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer:coarse)").matches);
  }, []);

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setSolid(v > 50));
    return unsub;
  }, [scrollY]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const dropVariants = {
    hidden:  { opacity: 0, y: -8, scale: 0.96 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.18 } },
  };

  return (
    <motion.header
      animate={{ backgroundColor: solid ? "rgba(0,0,0,0.78)" : "transparent" }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 5vw", height: 58,
        backdropFilter: solid ? "blur(14px)" : "none",
        WebkitBackdropFilter: solid ? "blur(14px)" : "none",
        transition: "background-color 0.5s ease",
      }}
    >
      <motion.span
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontWeight: 900, fontSize: 12, letterSpacing: "0.32em", color: "#fff", textTransform: "uppercase" }}
      >
        FARHAN T.
      </motion.span>

      <motion.div
        ref={btnRef}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative" }}
        onMouseEnter={() => { if (!isTouch) setOpen(true);  }}
        onMouseLeave={() => { if (!isTouch) setOpen(false); }}
      >
        <button
          onClick={() => { if (isTouch) setOpen((o) => !o); }}
          style={{
            fontWeight: 700, fontSize: 8, letterSpacing: "0.28em", color: "#fff",
            background: "transparent", border: "1px solid rgba(255,255,255,0.3)",
            padding: "9px 16px", textTransform: "uppercase", cursor: "pointer",
            transition: "background 0.3s, color 0.3s, border-color 0.3s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}
        >
          CONTACT
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              className="contact-dropdown"
              variants={dropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {SOCIALS.map(({ label, href, icon }) => (
                <motion.a
                  key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  whileHover={{ y: -4, color: "#fff", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {icon}
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════════════
   VIDEO CAROUSEL
══════════════════════════════════════════════════════ */
const SLIDES = [
  { video: "/videos/1.mp4" },
  { video: "/videos/2.mp4" },
  { video: "/videos/3.mp4" },
  { video: "/videos/4.mp4" },
  { video: "/videos/5.mp4" },
  { video: "/videos/6.mp4" },
  { video: "/videos/7.mp4" },
  { video: "/videos/8.mp4" },
];

const slideVariants = {
  enter:  (d) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } },
  exit:   (d) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0, transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } }),
};

function Carousel({ onSlideChange }) {
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);
  const touchX   = useRef(0);
  const videoRef = useRef(null);

  const go = useCallback((d) => {
    setDir(d);
    setCur((c) => {
      const next = (c + d + SLIDES.length) % SLIDES.length;
      // Notify parent of new slide index — instant, no delay
      if (onSlideChange) onSlideChange(next);
      return next;
    });
  }, [onSlideChange]);

  // No auto-timer — videos advance only when they naturally finish via onEnded

  // Seamless src swap — preload next video while current plays
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;

    const playfrom0 = () => {
      if (cancelled) return;
      vid.currentTime = 0;
      vid.play().catch(() => {});
    };

    const newSrc = `${SLIDES[cur].video}#t=0.001`;
    const fullSrc = window.location.origin + newSrc;

    if (vid.src !== fullSrc) {
      vid.pause();
      vid.src = newSrc;
      vid.load(); // needed here so browser buffers before canplay fires
      vid.addEventListener("canplay", playfrom0, { once: true });
    } else if (vid.readyState >= 2) {
      playfrom0();
    } else {
      vid.load();
      vid.addEventListener("canplay", playfrom0, { once: true });
    }

    // Preload the NEXT video so it's buffered before we need it
    const nextSrc = SLIDES[(cur + 1) % SLIDES.length].video;
    const preloader = document.createElement("video");
    preloader.src = nextSrc;
    preloader.preload = "auto";
    preloader.muted = true;
    preloader.style.display = "none";
    document.body.appendChild(preloader);

    return () => {
      cancelled = true;
      vid.removeEventListener("canplay", playfrom0);
      preloader.src = "";
      preloader.remove();
    };
  }, [cur]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", minHeight: "inherit", overflow: "hidden", background: "#000" }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 44) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* Black base — prevents any flash between slides */}
      <div style={{ position: "absolute", inset: 0, background: "#000", zIndex: 0 }} />

      <AnimatePresence custom={dir} initial={false} mode="sync">
        <motion.div
          key={cur}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ position: "absolute", inset: 0, background: SLIDES[cur].bg }}
        >
          {/* Video — src managed by useEffect to prevent reload flash */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              webkit-playsinline="true"
              onEnded={() => go(1)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "#000",
              }}
            />
          {/* NO colour overlays — nothing sits on top of the video to contaminate grades */}
          <span style={{ position: "absolute", bottom: 24, left: "5vw", fontSize: 8, letterSpacing: "0.5em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", zIndex: 2 }}>
            GRADE {String(cur + 1).padStart(2, "0")}
          </span>
          <span style={{ position: "absolute", bottom: 24, right: "5vw", fontSize: 8, letterSpacing: "0.45em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase", zIndex: 2 }}>
            {String(cur + 1).padStart(2, "0")} — {String(SLIDES.length).padStart(2, "0")}
          </span>
        </motion.div>
      </AnimatePresence>

      {["left", "right"].map((side) => (
        <button
          key={side}
          onClick={() => go(side === "right" ? 1 : -1)}
          aria-label={side}
          style={{ position: "absolute", top: "50%", [side]: "2.5vw", transform: "translateY(-50%)", zIndex: 20, background: "none", border: "none", cursor: "pointer", padding: 12, lineHeight: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d={side === "right" ? "M7 2L15 11L7 20" : "M15 2L7 11L15 20"} stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}

      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 20 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDir(i > cur ? 1 : -1); setCur(i); }}
            style={{ border: "none", padding: 0, cursor: "pointer", height: 2, width: i === cur ? 22 : 4, background: i === cur ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)", transition: "all 0.4s ease" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HERO SECTION
   Desktop : full-bleed sticky, title fades on scroll
   Mobile  : full-bleed → zooms out to 16:9 with ambient glow
══════════════════════════════════════════════════════ */

/* Ambient glow colours matched to each slide */
const GLOW_COLORS = [
  "rgba(255,175,55,0.7)",  "rgba(55,95,255,0.7)",  "rgba(255,55,75,0.65)",
  "rgba(55,215,155,0.65)", "rgba(195,55,255,0.7)",  "rgba(255,215,55,0.65)",
  "rgba(55,175,255,0.7)",  "rgba(255,115,55,0.7)",
];

function HeroSection() {
  const { scrollY } = useScroll();

  /* Desktop scroll transforms — only used on desktop */
  const titleOpacity = useTransform(scrollY, [0, 260], [1, 0]);
  const titleScale   = useTransform(scrollY, [0, 300], [1, 1.36]);
  const titleY       = useTransform(scrollY, [0, 300], ["0%", "-9%"]);
  const hintOpacity  = useTransform(scrollY, [0, 110], [1, 0]);
  const mobileVidScale  = useTransform(scrollY, [80, 320], [1.08, 1]);
  const mobileVidWidth  = useTransform(scrollY, [80, 320], ["100vw", "92vw"]);
  const mobileVidRadius = useTransform(scrollY, [80, 320], [0, 10]);
  const glowOpacity     = useTransform(scrollY, [80, 320], [0, 1]);

  const [isMobile,  setIsMobile]  = useState(false);
  const [ready,     setReady]     = useState(false);
  const [glowColor, setGlowColor] = useState(GLOW_COLORS[0]);
  const [scrolled,  setScrolled]  = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    setIsMobile(mq.matches);
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Called by Carousel the moment a slide changes — max 50ms delay */
  const onSlideChange = useCallback((slideIndex) => {
    const t = setTimeout(() => {
      setGlowColor(GLOW_COLORS[slideIndex % GLOW_COLORS.length]);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  /* Mobile scroll detection — fires once, no per-frame updates */
  useEffect(() => {
    if (!isMobile) return;
    const unsub = scrollY.on("change", (v) => {
      setScrolled(v > 200);
    });
    return unsub;
  }, [isMobile, scrollY]);

  /* shared title block */
  const Title = (
    <motion.div
      style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
        opacity: titleOpacity, scale: titleScale, y: titleY,
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 52 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontSize: "clamp(3.8rem,12vw,14vw)", fontWeight: 900,
          letterSpacing: "-0.025em", lineHeight: 1,
          color: "#fff", textTransform: "uppercase",
          userSelect: "none", mixBlendMode: "difference", textAlign: "center",
        }}
      >
        FARHAN <span style={{ color: "transparent", WebkitTextStroke: "2px #fff" }}>T.</span>
      </motion.h1>
    </motion.div>
  );

  /* shared scroll cue */
  const ScrollCue = (
    <motion.div
      style={{
        position: "absolute", bottom: 32, left: "50%",
        transform: "translateX(-50%)", zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        pointerEvents: "none", opacity: hintOpacity,
      }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 2, duration: 1 }}
        style={{ fontSize: 7, letterSpacing: "0.55em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}
      >
        scroll
      </motion.span>
      <motion.div
        animate={{ scaleY: [1, 0.18, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 1, height: 28, background: "rgba(255,255,255,0.22)", transformOrigin: "top" }}
      />
    </motion.div>
  );

  /* ── DESKTOP ── */
  if (!isMobile) {
    return (
      <section style={{ position: "relative", height: "200vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "#000" }}>
          <div className="hero-vid"><Carousel onSlideChange={onSlideChange} /></div>
          {Title}
          {ScrollCue}
        </div>
      </section>
    );
  }

  /* ── MOBILE — full-bleed → zooms out to 16:9 with ambient glow ── */
  return (
    <section style={{ position: "relative", height: "200vh" }}>
      <style>{`
        .mob-vid-wrap {
          position: relative; z-index: 2;
          width: 100vw; aspect-ratio: 16/9;
          border-radius: 0; overflow: hidden;
          box-shadow: 0 8px 48px rgba(0,0,0,0.8);
          /* CSS transition — runs on compositor, no JS cost */
          transition:
            width 0.9s cubic-bezier(0.22,1,0.36,1),
            border-radius 0.9s cubic-bezier(0.22,1,0.36,1);
        }
        .mob-vid-wrap.scrolled {
          width: 92vw;
          border-radius: 10px;
        }
        .mob-glow {
          position: absolute; z-index: 1;
          width: 60vw; height: 34vw;
          border-radius: 50%;
          background: transparent;
          opacity: 0;
          will-change: opacity, box-shadow;
          transform: translateZ(0);
          transition: opacity 0.9s ease, box-shadow 3s ease;
        }
        .mob-glow.scrolled { opacity: 1; }
        .mob-title {
          position: absolute; inset: 0; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
          transition: opacity 0.6s ease;
        }
        .mob-title.scrolled { opacity: 0; pointer-events: none; }
      `}</style>

      <div style={{
        position: "sticky", top: 0, height: "100vh",
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Ambient glow — box-shadow, CSS transition, no JS per frame */}
        <div
          className={`mob-glow${scrolled ? " scrolled" : ""}`}
          style={{
            boxShadow: `
              0 0 40px 20px ${glowColor},
              0 0 80px 40px ${glowColor.replace(/[\d.]+\)$/, "0.3)")},
              0 0 140px 70px ${glowColor.replace(/[\d.]+\)$/, "0.15)")}
            `,
          }}
        />

        {/* Video frame — CSS transition, no Framer Motion, no scroll listener */}
        <div className={`mob-vid-wrap${scrolled ? " scrolled" : ""}`}>
          <Carousel onSlideChange={onSlideChange} />
        </div>

        {/* Title — CSS fade, no JS */}
        <div className={`mob-title${scrolled ? " scrolled" : ""}`}>
          {ready && (
            <h1 style={{
              fontSize: "clamp(3rem,14vw,5rem)", fontWeight: 900,
              letterSpacing: "-0.025em", lineHeight: 1,
              color: "#fff", textTransform: "uppercase",
              userSelect: "none", mixBlendMode: "difference", textAlign: "center",
            }}>
              FARHAN <span style={{ color: "transparent", WebkitTextStroke: "2px #fff" }}>T.</span>
            </h1>
          )}
        </div>

        {/* Scroll cue */}
        {!scrolled && ready && (
          <div style={{
            position: "absolute", bottom: 28, left: "50%",
            transform: "translateX(-50%)", zIndex: 20,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            pointerEvents: "none",
          }}>
            <span style={{ fontSize: 7, letterSpacing: "0.55em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>scroll</span>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.22)" }} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   BRAIN SECTION — sub-components (outside to avoid hook issues)
══════════════════════════════════════════════════════ */
function NodeTree() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-10% 0px" });

  return (
    <div ref={ref} style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#000" }}>
      <motion.img
        src="/screenshots/1.png"
        alt="Node Tree"
        animate={inView
          ? { opacity: 1, scale: 1,    filter: "blur(0px)" }
          : { opacity: 0, scale: 1.06, filter: "blur(6px)" }
        }
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
          display: "block",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}

function Scopes() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-10% 0px" });

  return (
    <div ref={ref} style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#000" }}>
      <motion.img
        src="/screenshots/2.png"
        alt="Scopes"
        animate={inView
          ? { opacity: 1, scale: 1,    filter: "blur(0px)" }
          : { opacity: 0, scale: 1.06, filter: "blur(6px)" }
        }
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
          display: "block",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}

function BrainCentreText() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-6% 0px" });

  const base = {
    fontWeight: 900,
    fontSize: "clamp(1.8rem,4.6vw,4.6rem)",
    letterSpacing: "-0.025em",
    lineHeight: 1.08,
    textTransform: "uppercase",
    display: "block",
  };

  /* Environmental shadow — dark multi-layer drop shadow that bleeds
     into the black background, making the text feel grounded in the scene */
  const envShadow = "0 2px 4px rgba(0,0,0,0.9), 0 8px 24px rgba(0,0,0,0.75), 0 24px 64px rgba(0,0,0,0.55)";

  return (
    <div ref={ref}>
      {/* NON-DESTRUCTIVE */}
      <span className="line-mask" style={{ display: "block" }}>
        <motion.span
          style={{ display: "block", ...base, color: "#fff", textShadow: envShadow }}
          animate={inView ? { y: "0%", opacity: 1 } : { y: "108%", opacity: 0 }}
          transition={{ duration: 1.05, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        >
          NON-DESTRUCTIVE
        </motion.span>
      </span>

      {/* ACES/DWG — ghost outline, same as "THE IMAGE." in footer */}
      <span className="line-mask" style={{ display: "block" }}>
        <motion.span
          style={{
            display: "block", ...base,
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.55)",
            /* Shadow still visible through the outline */
            filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.85))",
          }}
          animate={inView ? { y: "0%", opacity: 1 } : { y: "108%", opacity: 0 }}
          transition={{ duration: 1.05, delay: 0.13, ease: [0.22, 1, 0.36, 1] }}
        >
          ACES/DWG
        </motion.span>
      </span>

      {/* PIPELINE. */}
      <span className="line-mask" style={{ display: "block" }}>
        <motion.span
          style={{ display: "block", ...base, color: "#fff", textShadow: envShadow }}
          animate={inView ? { y: "0%", opacity: 1 } : { y: "108%", opacity: 0 }}
          transition={{ duration: 1.05, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          PIPELINE.
        </motion.span>
      </span>
    </div>
  );
}

/* Mobile stacked layout — own component so its hooks are always called */
function BrainMobile({ sectionRef }) {
  const imgARef = useRef(null);
  const imgBRef = useRef(null);
  const aInView = useInView(imgARef, { once: false, margin: "-5% 0px" });
  const bInView = useInView(imgBRef, { once: false, margin: "-5% 0px" });

  return (
    <section ref={sectionRef} style={{ background: "#000", width: "100%", overflow: "hidden" }}>
      <motion.div
        ref={imgARef}
        animate={aInView
          ? { x: 0, opacity: 1, scale: 1 }
          : { x: -60, opacity: 0, scale: 0.96 }
        }
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", aspectRatio: "16/9" }}
      >
        <NodeTree />
      </motion.div>

      <div style={{ padding: "3rem 6vw", textAlign: "center" }}>
        <BrainCentreText />
      </div>

      <motion.div
        ref={imgBRef}
        animate={bInView
          ? { x: 0, opacity: 1, scale: 1 }
          : { x: 60, opacity: 0, scale: 0.96 }
        }
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", aspectRatio: "16/9" }}
      >
        <Scopes />
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   BRAIN SECTION
══════════════════════════════════════════════════════ */
function BrainSection() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const yA    = useTransform(scrollYProgress, [0, 1],          ["-12%", "12%"]);
  const yB    = useTransform(scrollYProgress, [0, 1],          ["12%", "-12%"]);
  const xA    = useTransform(scrollYProgress, [0, 0.25, 0.55], ["-100%", "0%", "0%"]);
  const xB    = useTransform(scrollYProgress, [0, 0.25, 0.55], ["100%",  "0%", "0%"]);
  const opA   = useTransform(scrollYProgress, [0, 0.2],        [0, 1]);
  const opB   = useTransform(scrollYProgress, [0, 0.2],        [0, 1]);
  const textY = useTransform(scrollYProgress, [0.1, 0.9],      ["4%", "-4%"]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile) return <BrainMobile sectionRef={sectionRef} />;

  return (
    <section ref={sectionRef} className="brain-section">
      <motion.div className="brain-img-a" style={{ x: xA, y: yA, opacity: opA }}>
        <NodeTree />
      </motion.div>
      <motion.div className="brain-img-b" style={{ x: xB, y: yB, opacity: opB }}>
        <Scopes />
      </motion.div>
      <motion.div className="brain-text" style={{ y: textY }}>
        <BrainCentreText />
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   BEFORE / AFTER SLIDER
══════════════════════════════════════════════════════ */
function BASlider({ title, before, after, isHovered, isAnyHovered }) {
  const [pos,     setPos]     = useState(50);
  const [isTouch, setIsTouch] = useState(false);
  const isDragging  = useRef(false);
  const posRef      = useRef(50);
  const rootRef     = useRef(null);
  const beforeRef   = useRef(null);
  const handleRef   = useRef(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer:coarse)").matches);
  }, []);

  /* Calculates position and updates DOM directly — no React re-render on drag */
  const move = useCallback((clientX) => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const p = Math.min(99, Math.max(1, ((clientX - rect.left) / rect.width) * 100));
    posRef.current = p;
    /* before image: show LEFT portion = clip right side away
       inset(top right bottom left) — right side = 100-p % */
    if (beforeRef.current) {
      beforeRef.current.style.clipPath = `inset(0 ${(100 - p).toFixed(3)}% 0 0)`;
    }
    if (handleRef.current) {
      handleRef.current.style.left = `${p}%`;
    }
  }, []);

  /* Global mouse/touch listeners — always attached, only act when isDragging */
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      if (cx !== undefined) move(cx);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setPos(posRef.current);
    };
    window.addEventListener("mousemove",  onMove, { passive: true });
    window.addEventListener("mouseup",    onUp,   { passive: true });
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("touchend",   onUp,   { passive: true });
    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onUp);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("touchend",   onUp);
    };
  }, [move]); /* stable ref — only attaches once */

  const onDragStart = useCallback((cx) => {
    isDragging.current = true;
    move(cx);
  }, [move]);

  const spring = { type: "spring", stiffness: 240, damping: 30, mass: 0.8 };

  return (
    <motion.div
      ref={rootRef}
      animate={{
        scale:   isHovered ? 1.03 : isAnyHovered ? 0.97 : 1,
        opacity: isHovered ? 1    : isAnyHovered ? 0.45 : 1,
      }}
      transition={spring}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: isHovered ? "3/4" : "4/3",
        transition: "aspect-ratio 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease",
        overflow: "hidden",
        cursor: "col-resize",
        userSelect: "none",
        WebkitUserSelect: "none",
        zIndex: isHovered ? 10 : 1,
        boxShadow: isHovered
          ? "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)"
          : "none",
      }}
      onMouseDown={(e)  => onDragStart(e.clientX)}
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
    >
      {/* AFTER — graded image, always fully visible as base */}
      <img
        src={after}
        alt="After"
        draggable={false}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          display: "block", pointerEvents: "none",
          userSelect: "none", decoding: "async",
        }}
      />

      {/* BEFORE — log image, clipped to show only left portion
          clipPath inset(0 RIGHT 0 0): right = how much to hide from right = 100-pos
          So at pos=50: right=50% → left half shows = correct */}
      <div
        ref={beforeRef}
        style={{
          position: "absolute", inset: 0,
          clipPath: `inset(0 ${(100 - pos).toFixed(3)}% 0 0)`,
        }}
      >
        <img
          src={before}
          alt="Before"
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            display: "block", pointerEvents: "none",
            userSelect: "none",
            filter: "saturate(0.45) brightness(0.8)",
            decoding: "async",
          }}
        />
        <span style={{ position: "absolute", bottom: 12, left: 14, fontSize: 7, letterSpacing: "0.42em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>LOG</span>
      </div>

      {/* GRADE label */}
      <span style={{ position: "absolute", bottom: 12, right: 14, zIndex: 5, fontSize: 7, letterSpacing: "0.42em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>GRADE</span>

      {/* HANDLE */}
      <div
        ref={handleRef}
        style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${pos}%`,
          transform: "translateX(-50%)",
          zIndex: 20, pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{ width: 1, height: "100%", background: "rgba(255,255,255,0.9)" }} />
        <div style={{
          position: "absolute", width: 28, height: 28,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.5)",
          background: "rgba(0,0,0,0.88)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
            <path d="M0 3.5H10M3 1L0 3.5L3 6M7 1L10 3.5L7 6" stroke="white" strokeWidth="0.85" />
          </svg>
        </div>
      </div>

      {/* Hover title (desktop) */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 15,
          padding: "40px 16px 16px",
          background: "linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 100%)",
          pointerEvents: "none", display: "flex", justifyContent: "center",
        }}
      >
        <h3 style={{ fontWeight: 900, fontSize: "clamp(0.85rem,1.6vw,1.4rem)", letterSpacing: "0.12em", color: "#fff", textTransform: "uppercase", textShadow: "0 2px 16px rgba(0,0,0,0.95)", textAlign: "center" }}>
          {title}
        </h3>
      </motion.div>

      {/* Mobile title */}
      {isTouch && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
          padding: "22px 14px 12px",
          background: "linear-gradient(to top,rgba(0,0,0,0.78) 0%,transparent 100%)",
          pointerEvents: "none",
        }}>
          <span style={{ fontWeight: 700, fontSize: "clamp(0.62rem,2.8vw,0.78rem)", letterSpacing: "0.2em", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>
            {title}
          </span>
        </div>
      )}
    </motion.div>
  );
}

const PROJECTS = [
  { title: "GOLDEN HOUR",    before: "/before/1.jpeg", after: "/after/1.avif"  },
  { title: "LOTUS POND",     before: "/before/2.jpeg", after: "/after/2.avif"  },
  { title: "NIGHT LAMP",     before: "/before/3.jpeg", after: "/after/3.avif"  },
  { title: "PORTRAIT GRADE", before: "/before/4.jpeg", after: "/after/4.avif"  },
];

/* ══════════════════════════════════════════════════════
   FEATURED WORK
══════════════════════════════════════════════════════ */
function FeaturedWork() {
  const [hovIdx, setHovIdx] = useState(null);

  return (
    <section style={{ background: "#000", paddingTop: "8rem" }}>
      <div style={{ padding: "0 5vw 3rem" }}>
        <NightLine delay={0} style={{ display: "block", fontWeight: 900, fontSize: "clamp(3rem,8.5vw,8.5rem)", letterSpacing: "-0.035em", lineHeight: 0.95, color: "#fff", textTransform: "uppercase" }}>
          FEATURED
        </NightLine>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0 2vw" }}>
          <NightLine delay={0.11} style={{ display: "inline-block", fontWeight: 900, fontSize: "clamp(3rem,8.5vw,8.5rem)", letterSpacing: "-0.035em", lineHeight: 0.95, color: "rgba(255,255,255,0.14)", textTransform: "uppercase" }}>
            WORK
          </NightLine>
          <NightLine delay={0.28} style={{ display: "inline-block", fontSize: "clamp(0.6rem,1vw,0.78rem)", letterSpacing: "0.38em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
            Selected projects — DI · Colorist · Pipeline
          </NightLine>
        </div>
      </div>

      <div
        className="work-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "1px",
          background: "rgba(255,255,255,0.05)",
          alignItems: "start",
        }}
      >
        {PROJECTS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 1.0, delay: i * 0.05 }}
            style={{ background: "#000" }}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
          >
            <BASlider
              title={p.title}
              before={p.before}
              after={p.after}
              isHovered={hovIdx === i}
              isAnyHovered={hovIdx !== null}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ position: "relative", background: "#000", padding: "8rem 5vw 4rem", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", pointerEvents: "none" }}>
        <span style={{ fontWeight: 900, fontSize: "24vw", color: "rgba(255,255,255,0.025)", textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none" }}>
          BUILD
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <NightLine delay={0} style={{ display: "block", fontWeight: 900, fontSize: "clamp(2.5rem,7vw,7.5rem)", letterSpacing: "-0.035em", lineHeight: 1, color: "#fff", textTransform: "uppercase" }}>
            LET'S BUILD
          </NightLine>
          <NightLine delay={0.15} style={{ display: "block", fontWeight: 900, fontSize: "clamp(2.5rem,7vw,7.5rem)", letterSpacing: "-0.035em", lineHeight: 1, textTransform: "uppercase", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
            THE IMAGE.
          </NightLine>
        </div>

        <div style={{ display: "flex", gap: "2.8rem", alignItems: "center" }}>
          {SOCIALS.map(({ label, href, icon }) => (
            <motion.a
              key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              whileHover={{ y: -10, filter: "drop-shadow(0 0 18px rgba(255,255,255,0.85))", color: "#fff" }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              style={{ color: "rgba(255,255,255,0.42)", cursor: "pointer", display: "block" }}
            >
              {icon}
            </motion.a>
          ))}
        </div>

        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.07)" }} />

        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.42em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>© 2025 FARHAN T.</span>
          <span style={{ fontSize: 8, letterSpacing: "0.42em", color: "rgba(255,255,255,0.14)", textTransform: "uppercase" }}>DI · COLORIST · PIPELINE</span>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function FarhanPortfolio() {
  return (
    <>
      <GlobalStyles />
      <Cursor />
      <Header />
      <main style={{ background: "#000" }}>
        <HeroSection />
        <BrainSection />
        <FeaturedWork />
        <Footer />
      </main>
    </>
  );
}
