import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import TypewriterText from "@/components/ui/TypewriterText";

import heroImage from "@/assets/hero.png";
import logo from "@/assets/circlehub-logo.png";
import { fadeUp } from "./landingAnimations";
import { floatingCards } from "./landingData";
import LandingStats from "./LandingStats";

export default function LandingHero() {
  return (
    <section className="relative min-h-[94vh] overflow-hidden">
      <motion.img
        src={heroImage}
        alt="CircleHub network interface illustration"
        className="absolute inset-0 h-full w-full object-cover object-center"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,255,0.96)_0%,rgba(250,248,255,0.82)_40%,rgba(250,248,255,0.22)_78%)] dark:bg-[linear-gradient(90deg,rgba(6,14,32,0.94)_0%,rgba(6,14,32,0.72)_42%,rgba(6,14,32,0.18)_80%)]" />

      <div className="relative z-10 mx-auto flex min-h-[94vh] w-full max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex items-center justify-between gap-4"
        >
          <Link to="/" className="inline-flex items-center">
            <img
              src={logo}
              alt="CircleHub"
              className="w-38 rounded-lg bg-white/88 px-3 py-2 shadow-sm dark:bg-(--surface-lowest)/88"
            />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/signin"
              className="type-button rounded-(--radius-full) bg-(--surface-lowest)/72 px-4 py-2 text-primary shadow-sm backdrop-blur transition-colors duration-200 hover:bg-(--surface-lowest)"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="button-primary type-button hidden px-5 py-2.5 sm:inline-flex"
            >
              Create an account
            </Link>
          </nav>
        </motion.header>

        <div className="grid flex-1 items-center py-14 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:py-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.62, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
              className="type-label-md mb-5 inline-flex items-center gap-2 rounded-(--radius-full) bg-(--surface-lowest)/74 px-4 py-2 text-(--primary) shadow-sm backdrop-blur"
            >
              <Sparkles size={16} />
              A social hub for builders
            </motion.p>

            <h1 className="max-w-4xl text-[44px] font-extrabold leading-13 text-primary sm:text-[58px] sm:leading-16.5 lg:text-[72px] lg:leading-20">
              Meet people, join communities, keep ideas moving.
            </h1>

            <p className="type-body-lg mt-6 max-w-2xl text-secondary">
              CircleHub brings profiles, posts, communities, follows, and notifications into one polished social workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="button-primary type-button inline-flex items-center gap-2 px-6 py-3"
              >
                Create an account
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/signin"
                className="type-button rounded-xl bg-(--surface-lowest)/78 px-6 py-3 text-(--primary) shadow-sm backdrop-blur transition-colors duration-200 hover:bg-(--surface-lowest)"
              >
                I already have an account
              </Link>
            </div>
          </motion.div>

          <div className="relative hidden min-h-130 lg:block">
            {floatingCards.map((card) => {
              const Icon = card.icon;

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 26, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    delay: card.delay,
                    duration: 0.55,
                    ease: "easeOut",
                  }}
                  className={`absolute max-w-72 items-center gap-3 rounded-xl border border-white/50 bg-white/66 p-4 shadow-(--shadow-md) backdrop-blur-xl dark:border-white/10 dark:bg-(--surface-lowest)/68 ${card.className}`}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      delay: card.delay,
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)"
                  >
                    <Icon size={20} />
                  </motion.div>

                  <div>
                    <h2 className="type-label-md text-primary">
                      {card.label}
                    </h2>
                    <p className="type-label-sm mt-1 text-secondary">
                      {card.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <LandingStats />
      </div>
    </section>
  );
}
