import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/circlehub-logo.png";
import { fadeUp } from "./landingAnimations";

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-(--surface-high) text-primary dark:bg-[#060e20] dark:text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-black/8 dark:bg-white/10" />

      <div className="w-full px-8 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
        >
          <div>
            <p className="type-label-md inline-flex items-center gap-2 rounded-(--radius-full) bg-(--surface-lowest)/72 px-4 py-2 text-(--primary) dark:bg-white/10 dark:text-white/82">
              <Sparkles size={16} />
              Ready when you are
            </p>

            <h2 className="mt-5 max-w-3xl text-[34px] font-extrabold leading-10 md:text-[52px] md:leading-15">
              Build your community, then make the feed worth coming back to.
            </h2>

            <p className="type-body-md mt-5 max-w-2xl text-secondary dark:text-white/70">
              CircleHub is a social app for profiles, posts, communities, and the small interactions that make a network feel active.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              to="/register"
              className="button-primary type-button inline-flex items-center gap-2 px-6 py-3"
            >
              Get started now
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/signin"
              className="type-button rounded-xl bg-(--surface-lowest)/72 px-6 py-3 text-(--primary) transition-colors duration-200 hover:bg-(--surface-lowest) dark:bg-white/10 dark:text-white dark:hover:bg-white/16"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-6 border-t border-black/8 pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center dark:border-white/10">
          <div>
            <img src={logo} alt="CircleHub" className="w-40 mb-4 lg:mb-0" />
            <p className="type-label-sm mt-1 text-secondary dark:text-white/58">
              A focused social space for builders, creators, and communities.
            </p>
          </div>
            <p className="type-label-sm text-secondary dark:text-white/58">
              &copy; 2026 CircleHub. All rights reserved. Developed by <Link to="https://portfolio-pearl-seven-23.vercel.app/" target="_blank" className="font-bold hover:underline!">Nasrdev</Link>.
            </p>
        </div>
      </div>
    </footer>
  );
}
