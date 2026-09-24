"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import logo from "./icon.png";



const heroWordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: "easeOut",
    },
  },
};

const heroContainerVariants:Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const paragraphContainerVariants:Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.75,
      staggerChildren: 0.045,
    },
  },
};

const paragraphWordVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070b17] text-white selection:bg-blue-500 selection:text-white">

      {/* ================= NAVBAR ================= */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#070b17]/85 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">

          {/* LOGO */}

          <div className="group flex cursor-pointer items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl  text-sm font-black shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/40 sm:h-11 sm:w-11 sm:text-base">
               <Image
              src={logo}
              alt="Thrill Seekers"
              width={96}
              height={96}
              priority
              className="relative h-full w-full object-contain drop-shadow-[0_0_16px_rgba(250,204,21,0.32)]"
            />
            </div>

            <div>
              <h1 className="text-base font-black tracking-wide transition-colors duration-300 group-hover:text-blue-400 sm:text-lg">
                THRILL SEEKERS
              </h1>

              <p className="text-[9px] font-semibold tracking-[0.2em] text-gray-500 sm:text-[10px] sm:tracking-[0.25em]">
                eFOOTBALL CLUB
              </p>
            </div>
          </div>

          {/* DESKTOP MENU */}

          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            <a
              href="#"
              className="text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:text-blue-400"
            >
              Home
            </a>

            <a
              href="#matches"
              className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:scale-105 hover:text-white"
            >
              Matches
            </a>

            <a
              href="#squad"
              className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:scale-105 hover:text-white"
            >
              Squad
            </a>

            <a
              href="#ranking"
              className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:scale-105 hover:text-white"
            >
              Rankings
            </a>

            <a
              href="#statistics"
              className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:scale-105 hover:text-white"
            >
              Statistics
            </a>
          </div>

          {/* LOGIN & MOBILE TOGGLE */}

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-300 transition-all duration-300 hover:border-blue-400/60 hover:bg-blue-500/20 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              LOGIN
            </Link>

            {/* HAMBURGER BUTTON */}

            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-all duration-300 hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white focus:outline-none md:hidden"
              aria-label="Toggle Menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}

        {mobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="overflow-hidden border-b border-white/10 bg-[#070b17] px-6 md:hidden"
          >
            <div className="flex flex-col gap-4 py-4">
              <a
                href="#"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-white transition-colors duration-300 hover:text-blue-400"
              >
                Home
              </a>

              <a
                href="#matches"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-gray-400 transition-colors duration-300 hover:text-white"
              >
                Matches
              </a>

              <a
                href="#squad"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-gray-400 transition-colors duration-300 hover:text-white"
              >
                Squad
              </a>

              <a
                href="#ranking"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-gray-400 transition-colors duration-300 hover:text-white"
              >
                Rankings
              </a>

              <a
                href="#statistics"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-gray-400 transition-colors duration-300 hover:text-white"
              >
                Statistics
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden pt-24 sm:pt-32 lg:pt-36">

        {/* BACKGROUND GLOW */}

        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-12 -z-10 h-[300px] w-[350px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[100px] sm:top-20 sm:h-[500px] sm:w-[700px] sm:blur-[150px]"
        />

        <motion.div
          animate={{
            x: [0, 35, 0],
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[15%] top-[25%] -z-10 h-32 w-32 rounded-full bg-purple-600/10 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[12%] top-[35%] -z-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8 lg:py-20">

          {/* HERO TEXT */}

          <div className="text-center lg:text-left">

            {/* BADGE */}

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: "easeOut",
              }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3.5 py-1.5 transition-all duration-300 hover:border-blue-400/40 sm:mb-6 sm:px-4 sm:py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>

              <span className="text-[10px] font-bold tracking-widest text-blue-300 sm:text-xs">
                eFOOTBALL CLUB
              </span>
            </motion.div>

            {/* HERO HEADING */}

            <motion.h2
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            >
              {/* WE DON'T */}

              <span className="block">

                <motion.span
                  variants={heroWordVariants}
                  className="mr-2 inline-block sm:mr-3"
                >
                  WE
                </motion.span>

                <motion.span
                  variants={heroWordVariants}
                  className="inline-block"
                >
                  DON'T
                </motion.span>

              </span>

              {/* PLAY SAFE */}

              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">

                <motion.span
                  variants={heroWordVariants}
                  className="mr-2 inline-block sm:mr-3"
                >
                  PLAY
                </motion.span>

                <motion.span
                  variants={heroWordVariants}
                  className="inline-block"
                >
                  SAFE.
                </motion.span>

              </span>
            </motion.h2>

            {/* HERO PARAGRAPH */}

            <motion.p
              variants={paragraphContainerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0"
            >
              {[
                "Welcome",
                "to",
                "Thrill",
                "Seekers.",
                "A",
                "competitive",
                "eFootball",
                "club",
                "built",
                "for",
                "players",
                "who",
                "chase",
                "victories,",
                "rivalries",
                "and",
                "unforgettable",
                "matches.",
              ].map((word, index) => {
                const isHighlighted =
                  word === "Thrill" ||
                  word === "Seekers.";

                return (
                  <motion.span
                    key={`${word}-${index}`}
                    variants={
                      paragraphWordVariants
                    }
                    className={`mr-1 inline-block ${
                      isHighlighted
                        ? "font-bold text-white"
                        : ""
                    }`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </motion.p>

            {/* BUTTONS */}

            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 2.15,
                ease: "easeOut",
              }}
              className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4 lg:justify-start"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 text-xs font-black shadow-lg shadow-blue-900/30 transition-all duration-300 hover:shadow-blue-600/50 sm:w-auto sm:py-4 sm:text-sm"
              >
                VIEW CLUB
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-xs font-black transition-all duration-300 hover:border-white/20 hover:bg-white/10 sm:w-auto sm:py-4 sm:text-sm"
              >
                VIEW MATCHES
              </motion.button>
            </motion.div>
          </div>

          {/* HERO CARD */}

          <motion.div
            initial={{
              opacity: 0,
              y: 50,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 1,
              delay: 0.45,
              ease: "easeOut",
            }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.65, 1, 0.65],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl sm:-inset-5 sm:rounded-[40px] sm:blur-3xl"
            />

            <motion.div
              whileHover={{
                y: -5,
              }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
              }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111a36] to-[#090d1c] p-6 shadow-2xl transition-all duration-500 hover:border-blue-500/30 hover:shadow-blue-500/10 sm:rounded-[32px] sm:p-8"
            >

              {/* CARD TOP */}

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.6,
                  delay: 1,
                }}
                className="flex items-center justify-between"
              >
                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-300 sm:text-xs">
                  MAIN TEAM
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-gray-300 sm:text-xs">
                  ELITE
                </span>
              </motion.div>

              {/* CREST */}

              <div className="flex flex-col items-center py-1 sm:py-2">

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    y: 25,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.95,
                    ease: "easeOut",
                  }}
                  className="relative h-44 w-48 transition-transform duration-700 hover:scale-105 sm:h-64 sm:w-64"
                >
                  <Image
                    src="/icon.png"
                    alt="Thrill Seekers Logo"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]"
                  />
                </motion.div>

                <motion.h3
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.55,
                    ease: "easeOut",
                  }}
                  className="mt-1 text-center text-3xl font-black tracking-tight sm:text-4xl"
                >
                  Thrill Seekers
                </motion.h3>

                <motion.p
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.75,
                  }}
                  className="mt-0.5 text-xs font-bold tracking-[0.3em] text-gray-500"
                >
                  TS • 2026
                </motion.p>
              </div>

              {/* STATS */}

              <div className="grid grid-cols-3 gap-2 sm:gap-3">

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 1.9,
                  }}
                >
                  <Stat
                    value="68"
                    label="Rank"
                  />
                </motion.div>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 2.05,
                  }}
                >
                  <Stat
                    value="164"
                    label="Matches"
                  />
                </motion.div>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 2.2,
                  }}
                >
                  <Stat
                    value="44.5%"
                    label="Win Rate"
                  />
                </motion.div>

              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= CLUB INTRO ================= */}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mb-8 sm:mb-10"
        >
          <p className="text-center text-xs font-bold tracking-[0.3em] text-blue-400 sm:text-left sm:text-sm">
            THE CLUB
          </p>

          <h2 className="mt-2 text-center text-3xl font-black sm:mt-3 sm:text-left sm:text-4xl">
            More than just a team.
          </h2>

          <p className="mt-2 max-w-2xl text-center text-sm text-gray-400 sm:mt-3 sm:text-left sm:text-base">
            Every match tells a story. Every victory adds to our legacy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.6,
              delay: 0.05,
            }}
          >
            <Feature
              icon="⚽"
              title="Competitive"
              description="We play every match with one goal — to win."
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
            }}
          >
            <Feature
              icon="🏆"
              title="Ambitious"
              description="From local battles to the biggest competitions."
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.6,
              delay: 0.25,
            }}
          >
            <Feature
              icon="🔥"
              title="Fearless"
              description="We never stop attacking. We never stop believing."
            />
          </motion.div>

        </div>
      </section>

      {/* ================= RANKING OVERVIEW ================= */}

      <section
        id="ranking"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
      >

        {/* SECTION HEADER */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end"
        >
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold tracking-[0.3em] text-blue-400 sm:text-sm">
                ALL-TIME
              </p>

              <span className="h-px w-12 bg-blue-500/40" />
            </div>

            <h2 className="mt-2 text-3xl font-black sm:mt-3 sm:text-4xl">
              Ranking Overview
            </h2>

            <p className="mt-2 text-sm text-gray-400 sm:mt-3 sm:text-base">
              The legacy of Thrill Seekers across all competitions.
            </p>
          </div>

          <div className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-400 transition-all duration-300 hover:border-white/20 hover:bg-white/10 sm:self-auto sm:text-sm">
            2 TEAMS
          </div>
        </motion.div>

        {/* RANKING CARDS */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          <motion.div
            initial={{
              opacity: 0,
              x: -35,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <RankingCard
              rank="68"
              team="Main"
              level="ELITE"
              matches="164"
              wins="70"
              draws="6"
              gfga="752 : 905"
              gd="-153"
              winRate="44.5%"
              rating="1,154.90"
              main
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: 35,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
          >
            <RankingCard
              rank="78"
              team="Academy"
              level="ELITE"
              matches="22"
              wins="8"
              draws="1"
              gfga="103 : 123"
              gd="-20"
              winRate="38.6%"
              rating="986.94"
            />
          </motion.div>

        </div>
      </section>

      {/* ================= RECENT MATCHES ================= */}

      <section
        id="matches"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
      >

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.7,
          }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-blue-400 sm:text-sm">
              MATCH CENTER
            </p>

            <h2 className="mt-2 text-3xl font-black sm:mt-3 sm:text-4xl">
              Recent Matches
            </h2>
          </div>

          <button className="hidden text-xs font-bold text-gray-400 transition-all duration-300 hover:translate-x-1 hover:text-white sm:block sm:text-sm">
            View all →
          </button>
        </motion.div>

        <div className="mt-6 space-y-3 sm:mt-8">

          <motion.div
            initial={{
              opacity: 0,
              x: -25,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.1,
            }}
            transition={{
              duration: 0.55,
            }}
          >
            <Match
              opponent="Shadow FC"
              result="W"
              score="4 - 1"
              date="Sep 05, 2026"
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: -25,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.1,
            }}
            transition={{
              duration: 0.55,
              delay: 0.1,
            }}
          >
            <Match
              opponent="Elite Warriors"
              result="W"
              score="3 - 2"
              date="Sep 03, 2026"
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: -25,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.1,
            }}
            transition={{
              duration: 0.55,
              delay: 0.2,
            }}
          >
            <Match
              opponent="Dhaka Kings"
              result="D"
              score="2 - 2"
              date="Aug 31, 2026"
            />
          </motion.div>

        </div>

        <motion.button
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.1,
          }}
          transition={{
            duration: 0.5,
            delay: 0.25,
          }}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-xs font-bold text-gray-400 transition-all duration-300 hover:bg-white/10 sm:hidden"
        >
          View all matches →
        </motion.button>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-gray-500 sm:flex-row sm:text-sm"
        >
          <p>© 2026 Thrill Seekers</p>

          <p className="font-semibold text-gray-400">
            I Can't. But We Can.
          </p>

          <p>eFootball Club</p>
        </motion.div>
      </footer>

    </main>
  );
}

/* ================= COMPONENT SUB-MODULES ================= */

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-center transition-all duration-300 hover:scale-105 hover:border-white/10 hover:bg-white/10 sm:rounded-2xl sm:p-4">
      <p className="text-lg font-black sm:text-2xl">
        {value}
      </p>

      <p className="mt-0.5 text-[8px] font-bold uppercase text-gray-500 sm:mt-1 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/40 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-blue-500/5 sm:rounded-3xl sm:p-7">

      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-blue-500/20 sm:mb-6 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
        {icon}
      </div>

      <h3 className="text-lg font-black transition-colors duration-300 group-hover:text-blue-400 sm:text-xl">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-gray-400 sm:mt-3 sm:text-sm sm:leading-6">
        {description}
      </p>

    </div>
  );
}

function RankingCard({
  rank,
  team,
  level,
  matches,
  wins,
  draws,
  gfga,
  gd,
  winRate,
  rating,
  main = false,
}: {
  rank: string;
  team: string;
  level: string;
  matches: string;
  wins: string;
  draws: string;
  gfga: string;
  gd: string;
  winRate: string;
  rating: string;
  main?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl sm:rounded-3xl sm:p-6 ${
        main
          ? "border-blue-500/30 bg-gradient-to-br from-blue-950/50 to-[#0b1020] hover:border-blue-500/50 hover:shadow-blue-950/50"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >

      {main && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"
        />
      )}

      <div className="relative flex items-center justify-between">

        <div className="flex items-center gap-3 sm:gap-5">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-transform duration-300 hover:scale-105 sm:h-16 sm:w-16 sm:rounded-2xl">

            <div className="text-center">

              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 sm:text-[9px]">
                Rank
              </p>

              <p className="text-lg font-black sm:text-2xl">
                #{rank}
              </p>

            </div>
          </div>

          <div>

            <div className="flex items-center gap-2 sm:gap-3">

              <h3 className="text-xl font-black sm:text-2xl">
                {team}
              </h3>

              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-gray-300 sm:px-2.5 sm:py-1 sm:text-[9px]">
                {level}
              </span>

            </div>

            <p className="mt-0.5 text-[10px] font-semibold text-gray-500 sm:mt-1 sm:text-xs">
              Thrill Seekers
            </p>

          </div>

        </div>
      </div>

      <div className="my-4 h-px bg-white/10 sm:my-6" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">

        <RankingStat
          label="PL"
          value={matches}
        />

        <RankingStat
          label="W"
          value={wins}
        />

        <RankingStat
          label="D"
          value={draws}
        />

        <RankingStat
          label="WIN"
          value={winRate}
        />

      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">

        <RankingStat
          label="GF : GA"
          value={gfga}
        />

        <RankingStat
          label="GD"
          value={gd}
        />

      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-black/30 sm:mt-5 sm:rounded-2xl sm:px-5 sm:py-4">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 sm:text-[10px]">
            Club Rating
          </p>

          <p className="mt-0.5 text-xl font-black sm:mt-1 sm:text-2xl">
            {rating}
          </p>

        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform duration-300 hover:rotate-12 hover:scale-110 sm:h-10 sm:w-10">
          ★
        </div>

      </div>
    </div>
  );
}

function RankingStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.08] sm:rounded-xl sm:px-4 sm:py-3">

      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 sm:text-[9px]">
        {label}
      </p>

      <p className="mt-0.5 text-base font-black sm:mt-1 sm:text-lg">
        {value}
      </p>

    </div>
  );
}

function Match({
  opponent,
  result,
  score,
  date,
}: {
  opponent: string;
  result: string;
  score: string;
  date: string;
}) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition-all duration-300 hover:translate-x-1 hover:border-blue-500/30 hover:bg-white/[0.06] sm:rounded-2xl sm:p-5">

      <div className="flex items-center gap-3 sm:gap-4">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-base font-black transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
          {opponent.charAt(0)}
        </div>

        <div>

          <p className="text-xs font-bold transition-colors duration-300 group-hover:text-blue-300 sm:text-base">
            Thrill Seekers
          </p>

          <p className="text-[10px] text-gray-500 sm:text-xs">
            vs {opponent}
          </p>

        </div>
      </div>

      <div className="text-center">

        <p className="text-base font-black tracking-wider sm:text-xl">
          {score}
        </p>

        <p className="text-[9px] font-bold uppercase text-gray-500 sm:text-[10px]">
          {date}
        </p>

      </div>

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10 sm:text-sm ${
          result === "W"
            ? "border-green-500/20 bg-green-500/10 text-green-400"
            : result === "D"
              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
        }`}
      >
        {result}
      </div>

    </div>
  );
}