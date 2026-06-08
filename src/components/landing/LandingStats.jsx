import { motion } from "motion/react";

import { stats } from "./landingData";

export default function LandingStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.72, duration: 0.45, ease: "easeOut" }}
      className="grid gap-3 pb-4 sm:grid-cols-3"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-white/60 bg-(--surface-lowest)/72 px-4 py-4 text-center shadow-sm backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] dark:border-white/10 dark:bg-(--surface-lowest)/70"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                delay: index * 0.25,
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)"
            >
              <Icon size={20} />
            </motion.div>

            <p className="text-[26px] font-extrabold leading-8 text-primary">
              {stat.value}
            </p>
            <p className="type-label-md mx-auto mt-1 max-w-50 text-secondary">
              {stat.label}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
}
