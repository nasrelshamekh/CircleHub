import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/circlehub-logo.png";
import { fadeUp } from "./landingAnimations";

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#060e20] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
        >
          <div>
            <p className="type-label-md inline-flex items-center gap-2 rounded-(--radius-full) bg-white/10 px-4 py-2 text-white/82">
              <Sparkles size={16} />
              Ready when you are
            </p>

            <h2 className="mt-5 max-w-3xl text-[34px] font-extrabold leading-10 md:text-[52px] md:leading-15">
              Build your community, then make the feed worth coming back to.
            </h2>

            <p className="type-body-md mt-5 max-w-2xl text-white/70">
              CircleHub is a social app concept for profiles, posts, communities, and the small interactions that make a network feel active.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              to="/register"
              className="button-primary type-button inline-flex items-center gap-2 px-6 py-3"
            >
              Create an account
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/signin"
              className="type-button rounded-xl bg-white/10 px-6 py-3 text-white transition-colors duration-200 hover:bg-white/16"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <img src={logo} alt="CircleHub" className="w-40" />
            <p className="type-label-sm mt-1 text-white/58">
              A focused social space for builders, creators, and communities.
            </p>
          </div>

          <p className="type-label-sm text-white/58">
            &copy; 2026 CircleHub. All rights reserved. Developed by nWeave.
          </p>
        </div>
      </div>
    </footer>
  );
}
