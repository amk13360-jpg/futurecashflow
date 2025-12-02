"use client"
import React from "react"
import styles from "./landing.module.css"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hammer, DollarSign, AlertTriangle, Building } from "lucide-react"

// Logo with brand blue (solid, no gradient, no animation)
export const LogoIcon = ({ className = "w-10 h-10" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      {/* Bottom arrow */}
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
      {/* Top arrow */}
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
    </svg>
  </div>
)

// Hero Section - solid black background, solid blue accents (no shiny effects)
const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center bg-landing-hero text-landing-hero"
    >
      <div className="container relative z-10 text-center px-4">
        <div className="max-w-3xl mx-auto">
          {/* Arrows above headline */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto">
                <path d="M20 12L15 18H17L20 15L23 18H25L20 12Z" className="fill-landing-accent" />
                <path d="M20 20L15 26H17L20 23L23 26H25L20 20Z" className="fill-landing-accent" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-4">
              <h1 className="font-black text-4xl md:text-5xl lg:text-6xl text-landing-headline">
                Finance Cashflow
              </h1>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-6 mb-8">
            <p className="text-xl font-light text-foreground">
              Cashflow is a fintech and funding platform enabling companies to offer
              <span className="bg-landing-accent text-landing-accent-contrast rounded-full px-4 py-1 font-semibold mx-2">
                early payment
              </span>
              programs for SMEs in their supply chain.
            </p>
            <p className="text-xl font-light text-foreground">
              Our platform helps businesses make a greater impact on SMEs by enabling faster payments to suppliers.
            </p>
            <p className="text-xl font-light text-foreground">
              Through Cashflow, suppliers can receive immediate payments for approved invoices,
              <span className="underline decoration-landing-accent underline-offset-4 mx-1">
                improving their cash flow
              </span>
              and fostering sustainable growth.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-landing-accent text-landing-accent-contrast px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-colors duration-200 hover:bg-landing-accent-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Company Description (black background, solid accents)
const CompanyDescriptionSection = () => {
  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="space-y-8 text-2xl lg:text-3xl leading-relaxed font-light">
            <div className="mb-16">
              <p>
                <span className="font-semibold">Cashflow is a fintech and funding platform</span> enabling companies to
                offer <span className="bg-blue-600 text-white rounded-full px-6 py-2 font-semibold">early payment</span>{" "}
                programs for SMEs in their supply chain.
              </p>
            </div>

            <div className="mb-16">
              <p>
                Our platform helps businesses make a greater impact on SMEs by enabling faster payments to suppliers.
              </p>
            </div>

            <div>
              <p>
                Through Cashflow, suppliers can receive{" "}
                <span className="underline decoration-blue-500 underline-offset-4">immediate payments</span> for
                approved invoices, improving their{" "}
                <span className="underline decoration-blue-500 underline-offset-4">cash flow</span> and fostering
                sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Problem Section Icons - Exact match to presentation
const PaymentTermsIcon = () => (
  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
    <div className="text-center text-white">
      <div className="text-2xl font-bold">90</div>
      <div className="text-xs">DAYS</div>
    </div>
  </div>
)

const FundingBarriersIcon = () => (
  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
    <Building className="w-10 h-10 text-white" />
  </div>
)

const CashflowIssuesIcon = () => (
  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
    <DollarSign className="w-10 h-10 text-white" />
  </div>
)

const InefficiencyIcon = () => (
  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
    <AlertTriangle className="w-10 h-10 text-white" />
  </div>
)

// Reusable ProblemGridSection component
function ProblemGridSection() {
  // Card data
  const cards = [
    {
      icon: (
        <div className="flex flex-col items-center justify-center mt-4">
          <div className={styles["problem-icon"]}>
            <span className="days">90</span>
            <span className="label">DAYS</span>
          </div>
        </div>
      ),
      heading: "Payment Terms",
      description:
        "Suppliers face long payment cycles, with the industry average of 90 days severely impacting their cashflow.",
    },
    {
      icon: (
        <div className="flex flex-col items-center justify-center mt-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="32" rx="6" fill="#333" stroke="#fff" strokeWidth="2" />
            <rect x="20" y="16" width="8" height="16" rx="2" fill="#fff" />
            <rect x="30" y="16" width="4" height="16" rx="2" fill="#fff" />
            <circle cx="14" cy="32" r="4" fill="#fff" />
            <rect x="12" y="20" width="4" height="8" rx="2" fill="#fff" />
          </svg>
        </div>
      ),
      heading: "Funding Barriers",
      description:
        "SMEs lack access to affordable financing, making it hard to bridge the gap between invoicing and payment.",
    },
    {
      icon: (
        <div className="flex flex-col items-center justify-center mt-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="2" fill="#333" />
            <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">
              $
            </text>
            <path d="M24 8v8M24 32v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      heading: "Cashflow Issues",
      description: "SMEs often struggle with cashflow due to mines’ extended payment terms, causing instability.",
    },
    {
      icon: (
        <div className="flex flex-col items-center justify-center mt-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="2" fill="#333" />
            <path d="M24 16v8l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="4" fill="#fff" />
            <path d="M24 8v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 24h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 24h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <text x="24" y="28" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
              !
            </text>
          </svg>
        </div>
      ),
      heading: "Inefficiency",
      description:
        "Supplier instability disrupts supply chains, reduces quality and increases costs for mining operations.",
    },
  ]

  // Card wrapper
  function ProblemCard({
    icon,
    heading,
    description,
  }: { icon: React.ReactNode; heading: string; description: string }) {
    return (
      <div className={`transition duration-200 cursor-pointer flex flex-col items-center justify-center ${styles["problem-card"]}`}> 
        {icon}
        <h3 className="font-bold text-lg mt-6 mb-2">{heading}</h3>
        <p className="text-center text-base font-normal">{description}</p>
      </div>
    )
  }

  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      <div className="container relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className={styles["problem-header"]}>THE PROBLEM WE’RE SOLVING</div>
          <div className={styles["problem-subheader"]}>Most mines take too long to pay their suppliers…</div>
        </div>

        {/* Modern square grid, no progress bar, no rounded corners */}
        <div className="w-full flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 mb-8 w-full bg-[#181e29] overflow-hidden shadow-xl">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center transition duration-200 cursor-pointer ${styles["problem-card-grid"]} ${idx < cards.length - 1 ? "border-r border-[#222]" : ""}`}
              >
                {card.icon}
                <h3 className={`font-bold text-lg mt-6 mb-2 ${styles["problem-card-grid-heading"]}`}>{card.heading}</h3>
                <p className={`text-center text-base font-normal ${styles["problem-card-grid-desc"]}`}>{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center">
          <p className={`text-lg text-white max-w-4xl mx-auto ${styles["problem-footnote"]}`}>
            ...too few financiers have provided fast, tech-enabled, scalable solutions based on a{" "}
            <a href="#" className={`underline ${styles["problem-footnote-link"]}`}>mine’s credit risk</a>
          </p>
        </div>
      </div>
    </section>
  )
}

// Solution Icons - Exact match to presentation
const FastPayoutIcon = () => (
  <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center">
    <div className="text-white text-center">
      <div className="text-2xl">⚡</div>
    </div>
  </div>
)

const AffordableRatesIcon = () => (
  <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center">
    <div className="text-white text-center">
      <div className="text-2xl">%</div>
    </div>
  </div>
)

const EasyApplicationIcon = () => (
  <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center">
    <div className="text-white text-center">
      <div className="text-2xl">✓</div>
    </div>
  </div>
)

const MiningFocusedIcon = () => (
  <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center">
    <Hammer className="w-10 h-10 text-white" />
  </div>
)

// Solution Section - matches provided screenshot design
function SolutionSection() {
  // Card data
  const cards = [
    {
      icon: (
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 16l4-4m0 0l-4-4m4 4h12"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="#181e29" strokeWidth="2" fill="none" />
            <path d="M16 10v6l4 2" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      heading: "Fast approval and payment for verified suppliers",
      description: "Fast approval and payment for verified suppliers",
      button: "FAST PAYOUT",
    },
    {
      icon: (
        <div className="flex flex-col items-center mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 8v16" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 24l-4-4m4 4l4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      heading: "Our developmental focus empowers suppliers",
      description: "Our developmental focus empowers suppliers",
      button: "AFFORDABLE RATES",
    },
    {
      icon: (
        <div className="flex flex-col items-center mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="8" y="8" width="16" height="16" rx="4" stroke="#2563eb" strokeWidth="2" fill="none" />
            <path d="M12 16h8M12 20h8" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 12h8" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      heading: "Frictionless journey backed by the best systems",
      description: "Frictionless journey backed by the best systems",
      button: "EASY APPLICATION",
    },
    {
      icon: (
        <div className="flex flex-col items-center mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <g>
              <path d="M10 22l12-12" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 22l-12-12" stroke="#181e29" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 24v-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      ),
      heading: "Our systems are tailored for mining, unlike non-specialist financing",
      description: "Our systems are tailored for mining, unlike non-specialist financing",
      button: "MINING FOCUSED",
    },
  ]

  return (
    <section className="relative bg-[#f7f7f9] text-gray-700 py-24 overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-10">
          <div className="bg-white text-black px-8 py-4 rounded-full inline-block mb-8 shadow-lg">
            <h2 className="text-2xl font-bold">OUR SOLUTION</h2>
          </div>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
            Our tech-platform integrates with a mine's accounts payable, to give their suppliers the option to receive
            immediate payment for approved invoices...
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cards.map((card, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-2 py-4">
                {card.icon}
                <h3 className={`text-lg font-semibold text-gray-700 mb-3 mt-2 ${styles["solution-card"]}`}>{card.heading}</h3>
                <p className={`text-base text-gray-500 mb-6 ${styles["solution-card"]}`}>{card.description}</p>
                <button className="bg-[#2563eb] text-white font-bold rounded-full px-6 py-3 text-sm mt-auto w-full max-w-[180px] shadow-md transition hover:bg-[#1d4ed8]">
                  {card.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// How it Works Section (black background, white pill header)
const HowItWorksSection = () => {
  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="bg-white text-black px-8 py-4 rounded-full inline-block mb-8">
            <h2 className="text-2xl font-bold">HOW SUPPLY CHAIN FINANCE WORKS</h2>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
              1
            </div>
            <p className="text-lg">
              A <span className="underline">supplier delivers</span> (R100) worth of goods to a mine, and the{" "}
              <span className="underline">mine approves their invoice</span>.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
              2
            </div>
            <p className="text-lg">
              <span className="underline">We notify the supplier</span> that their invoice is approved and offer them
              the choice of either getting paid (R95) immediately by us or waiting the usual 90 days to get paid their
              (R100) by the mine.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
              3
            </div>
            <p className="text-lg">
              If the supplier chooses to receive (R95) immediately <span className="underline">we pay it to them</span>{" "}
              and the mine pays us the (R100) directly after 90 days.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
              ✓
            </div>
            <p className="text-lg">
              It therefore costs the supplier just (R5) to get paid early by us, instead of them waiting 90 days.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
              ✓
            </div>
            <p className="text-lg">
              We make R5 gross profit on the transaction and then repay our big loans with interest to the banks and
              financiers that give us the capital to make this all happen.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Ecosystem Section - matches provided screenshot design
function EcosystemSection() {
  const items = [
    {
      label: "FUNDERS",
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 10h18M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect x="7" y="13" width="2" height="3" rx="1" fill="#6b7280" />
          <rect x="11" y="13" width="2" height="3" rx="1" fill="#6b7280" />
          <rect x="15" y="13" width="2" height="3" rx="1" fill="#6b7280" />
        </svg>
      ),
      description: "Banks and lenders lend our fund capital at a rate based on a mine's credit risk.",
    },
    {
      label: "MINES",
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M6 19l6-6 6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 13V5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      description:
        "Mines give us access to their accounts payable so that we can offer their suppliers immediate discounted payment for their invoices.",
    },
    {
      label: "SUPPLIERS",
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="7" width="18" height="10" rx="2" stroke="#6b7280" strokeWidth="2" />
          <circle cx="7" cy="19" r="2" fill="#2563eb" />
          <circle cx="17" cy="19" r="2" fill="#2563eb" />
        </svg>
      ),
      description:
        "Suppliers can elect to receive an immediate discounted payment for their invoices, already approved by the mine.",
    },
  ]

  return (
    <section className="relative bg-[#f7f7f9] text-gray-700 py-24 overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-10">
          <div className="bg-white text-black px-8 py-4 rounded-full inline-block mb-8 shadow-lg">
            <h2 className="text-2xl font-bold">OUR ECOSYSTEM</h2>
          </div>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
            We are a platform and ecosystem business, adding value by connecting cash from banks and funders with mines'
            suppliers that need it the most.
          </p>
        </div>
        <div className="space-y-6 max-w-4xl mx-auto">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow border border-gray-200 px-6 py-6 gap-6 md:gap-8"
            >
              <button className="bg-[#2563eb] text-white font-bold rounded-full px-8 py-3 text-base shadow-md transition hover:bg-[#1d4ed8] mb-4 md:mb-0">
                {item.label}
              </button>
              <span className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16">{item.icon}</span>
              <p className="text-gray-600 text-base md:text-lg flex-1 text-center md:text-left">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <LogoIcon className="w-8 h-8 text-primary" />
            <span className="font-bold text-white text-xl">Future Cashflow</span>
          </div>
          <p className="text-base mb-6">Future Cashflow (Pty) Ltd is a registered Credit Provider NCRCP18174</p>
          <div className="text-sm">&copy; 2025 Future Cashflow. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  )
}

// Main Component
// Best UI/UX: Animated word spinner with fade transition
function WordSpinner({ words }: { words: string[] }) {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % words.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [words.length])

  return (
    <span className={`flex items-center whitespace-nowrap ${styles["word-spinner"]}`}> 
      <span className="text-blue-600 text-2xl md:text-3xl lg:text-4xl font-semibold">{words[index]}</span>
    </span>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <main className="flex flex-col items-center justify-center text-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            {/* Static chevrons (no animation) */}
            <span className="flex flex-col">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 8L12 16H16L20 12L24 16H28L20 8Z" className="fill-primary" />
                <path d="M20 18L12 26H16L20 22L24 26H28L20 18Z" className="fill-primary" />
              </svg>
            </span>
            <span className="font-bold text-2xl md:text-3xl lg:text-4xl text-primary">Future Cashflow</span>
          </div>

          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            Supply Chain Finance Platform for Mining Industry
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/login/admin" passHref>
              <Button size="lg" className="rounded-full px-8 py-6 text-lg font-semibold min-w-[200px]">
                Admin Login
              </Button>
            </Link>
            <Link href="/login/ap" passHref>
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg font-semibold min-w-[200px]">
                AP Login
              </Button>
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
// End of file
