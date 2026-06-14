"use client";

import { motion } from "framer-motion";

export default function HeroContent() {
  return (
    <>
      {/* Subtitle */}
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hero-subtitle"
      >
        Full-Stack & AI Automation Developer
      </motion.span>

      {/* Main Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hero-name"
      >
        Koushikk
      </motion.h1>
    </>
  );
}
