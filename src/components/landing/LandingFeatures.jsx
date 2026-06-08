import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { fadeUp } from "./landingAnimations";
import { features } from "./landingData";

export default function LandingFeatures() {
  return (
    <section className="relative overflow-hidden bg-(--surface-low) py-16">
      <div className="w-full px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="type-label-md inline-flex items-center gap-2 rounded-(--radius-full) bg-(--active) px-4 py-2 text-(--primary)">
            <Sparkles size={16} />
            What CircleHub helps you do
          </p>

          <h2 className="type-headline-responsive mt-4 text-primary">
            Three loops that make the app feel alive.
          </h2>

          <p className="type-body-md mt-3 text-secondary">
            Join the ultimate experience.
          </p>
        </motion.div>

        <div className="mt-10 grid w-full gap-5 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08, duration: 0.45, ease: "easeOut" }}
                className="relative overflow-hidden rounded-xl bg-(--surface-lowest) px-6 py-8 text-center shadow-(--shadow-sm) transition-transform duration-200 ease-out hover:-translate-y-2"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                  <Icon size={28} />
                </div>

                <h3 className="type-title-lg text-primary">{feature.title}</h3>

                <p className="type-body-sm-readable mx-auto mt-3 max-w-72 text-secondary">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
