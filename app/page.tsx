"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

// Animated text reveal
function TextReveal({ children, className = "" }: { children: string; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            animate={isInView ? { y: 0 } : { y: "100%" }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Magnetic button
function MagneticButton({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.3;
    const y = (clientY - top - height / 2) * 0.3;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      {children}
    </motion.a>
  );
}

// Parallax image
function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// Stagger children animation
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Time display
function CurrentTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Bangkok",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time} BKK</span>;
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Hero parallax
  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -150]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);

  // Counter animation
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const countInView = useInView(countRef, { once: true });

  useEffect(() => {
    if (countInView) {
      let start = 0;
      const end = 97;
      const duration = 2000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
    }
  }, [countInView]);

  return (
    <div ref={containerRef} className="relative">
      {/* Noise overlay */}
      <div className="noise" />

      {/* Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 mix-blend-difference"
      >
        <nav className="flex items-center justify-between px-6 md:px-12 py-6">
          <Link href="/" className="text-white font-medium tracking-tight">
            TOXIC©
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-white text-sm link-hover hidden sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/auth"
              className="text-white text-sm border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-all"
            >
              Login
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="min-h-screen flex flex-col justify-end pb-24 px-6 md:px-12 relative"
      >
        <div className="max-w-7xl w-full">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-[var(--text-muted)] text-sm mb-6 tracking-widest uppercase"
          >
            Relationship Intelligence Platform
          </motion.p>

          <h1 className="text-[clamp(3rem,12vw,10rem)] font-light leading-[0.9] tracking-tighter mb-12">
            <TextReveal>See</TextReveal>
            <br />
            <TextReveal>Through</TextReveal>
            <br />
            <span className="italic font-normal">
              <TextReveal>Toxicity</TextReveal>
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-[var(--text-secondary)] max-w-md"
            >
              วิเคราะห์แชทของคุณด้วย AI เพื่อค้นหาว่าใครกันแน่ที่ toxic
              ในความสัมพันธ์ ไม่มีอคติ มีแต่ข้อมูล
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <MagneticButton
                href="/analyze"
                className="group inline-flex items-center gap-3 text-lg border-b border-[var(--text)] pb-2"
              >
                <span>Start Analysis</span>
                <motion.span
                  className="inline-block"
                  whileHover={{ x: 5, y: -5 }}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </motion.span>
              </MagneticButton>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-16 bg-gradient-to-b from-[var(--text)] to-transparent"
          />
        </motion.div>
      </motion.section>

      {/* Marquee */}
      <section className="py-8 border-y border-[var(--border)] overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mr-8">
              {[
                "TOXICITY ANALYSIS",
                "◆",
                "AI POWERED",
                "◆",
                "RELATIONSHIP INSIGHTS",
                "◆",
                "PATTERN DETECTION",
                "◆",
              ].map((text, j) => (
                <span
                  key={j}
                  className="text-sm tracking-[0.2em] text-[var(--text-muted)]"
                >
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            <div>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm tracking-widest text-[var(--text-muted)] uppercase mb-8 block"
              >
                (01) — About
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                <TextReveal>เข้าใจความสัมพันธ์ ผ่านข้อมูล</TextReveal>
              </h2>
            </div>
            <div className="flex flex-col justify-end">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8"
              >
                เมื่ออารมณ์เข้ามาเกี่ยว
                เราไม่สามารถมองเห็นความจริงได้ชัด แต่ AI ไม่มีอคติ—
                มันวิเคราะห์ทุกข้อความอย่างเป็นกลาง และบอกคุณว่าใครกันแน่
                ที่สร้างความ toxic ในความสัมพันธ์
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                ref={countRef}
                className="flex items-baseline gap-2"
              >
                <span className="text-7xl md:text-8xl font-light tracking-tighter">
                  {count}%
                </span>
                <span className="text-[var(--text-muted)] text-sm">
                  Accuracy Rate
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 md:px-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm tracking-widest text-[var(--text-muted)] uppercase mb-16 block"
          >
            (02) — Features
          </motion.span>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-0"
          >
            {[
              {
                num: "01",
                title: "Smart Import",
                desc: "วาง chat จาก LINE, Messenger, WhatsApp ได้เลย",
              },
              {
                num: "02",
                title: "Deep Analysis",
                desc: "AI วิเคราะห์ toxicity, gaslighting, passive-aggressive",
              },
              {
                num: "03",
                title: "Visual Reports",
                desc: "ผลวิเคราะห์เข้าใจง่าย เห็นภาพรวมชัดเจน",
              },
              {
                num: "04",
                title: "Privacy First",
                desc: "ข้อมูลเข้ารหัส ลบได้ทุกเมื่อ ไม่แชร์กับใคร",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.num}
                variants={staggerItem}
                className="group border-b border-[var(--border)] py-8 md:py-12 cursor-pointer"
              >
                <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
                  <div className="flex items-start md:items-center gap-6 md:gap-12">
                    <span className="text-[var(--text-muted)] text-sm font-mono">
                      {feature.num}
                    </span>
                    <h3 className="text-2xl md:text-4xl font-light tracking-tight group-hover:italic transition-all">
                      {feature.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-8 ml-12 md:ml-0">
                    <p className="text-[var(--text-muted)] text-sm max-w-xs hidden md:block">
                      {feature.desc}
                    </p>
                    <motion.div
                      className="w-10 h-10 border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--text)] group-hover:text-[var(--bg)] transition-all"
                      whileHover={{ scale: 1.1 }}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32 px-6 md:px-12 bg-[var(--text)] text-[var(--bg)]">
        <div className="max-w-7xl mx-auto">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm tracking-widest opacity-50 uppercase mb-16 block"
          >
            (03) — Process
          </motion.span>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              { step: "01", title: "Upload", desc: "วางข้อความแชทของคุณ" },
              { step: "02", title: "Analyze", desc: "AI ประมวลผลทุกข้อความ" },
              { step: "03", title: "Insight", desc: "รับผลวิเคราะห์ที่ชัดเจน" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <span className="text-8xl md:text-9xl font-light opacity-10 block mb-4">
                  {item.step}
                </span>
                <h3 className="text-2xl font-light mb-2">{item.title}</h3>
                <p className="opacity-60 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter mb-12"
          >
            Ready to see
            <br />
            <span className="italic">the truth?</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <MagneticButton
              href="/analyze"
              className="inline-flex items-center gap-3 bg-[var(--text)] text-[var(--bg)] px-8 py-4 text-lg hover:gap-5 transition-all"
            >
              <span>Start Free Analysis</span>
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <span className="font-medium tracking-tight">TOXIC©</span>
            <span className="text-[var(--text-muted)] text-sm">
              {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <CurrentTime />
            <span>Bangkok, Thailand</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
