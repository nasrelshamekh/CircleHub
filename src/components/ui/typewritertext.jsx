import { motion } from "motion/react";

export default function TypewriterText({ text, className = "" }) {
  const letters = text.split("");

  return (
    <motion.h1
      className={className}
      aria-label={text}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          aria-hidden="true"
          variants={{
            hidden: {
              opacity: 0,
              y: 8,
              filter: "blur(4px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            },
          }}
          transition={{
            delay: index * 0.025,
            duration: 0.18,
            ease: "easeOut",
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}

      <motion.span
        aria-hidden="true"
        animate={{ opacity: [1, 0, 1] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="ml-1 inline-block text-(--primary)"
      >
        |
      </motion.span>
    </motion.h1>
  );
}