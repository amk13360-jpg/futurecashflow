"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Logo with brand blue and blinking animation
export const LogoIcon = ({ className = "w-10 h-10" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" className="animate-blink-2" />
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" className="animate-blink-1" />
    </svg>
  </div>
)

const CompanyDescriptionSection = () => {
  return (
    <section className="relative bg-black py-24 overflow-hidden text-white">
      <div className="z-10 relative container">
        <div className="mx-auto max-w-5xl text-center">
          <div className="space-y-8 font-light text-2xl lg:text-3xl leading-relaxed">
            <div className="mb-16">
              <p>
                <span className="font-semibold">Future Finance Cashflow is a fintech and funding platform</span>{" "}
                enabling companies to offer{" "}
                <span className="bg-blue-600 px-6 py-2 rounded-full font-semibold text-white">early payment programs</span>{" "}
                for SMEs in their supply chain.
              </p>
            </div>

            <div className="mb-16">
              <p>
                Our platform helps businesses make a greater impact on SMEs by enabling faster payments to suppliers.
              </p>
            </div>

            <div>
              <p>
                Through our platform, suppliers can receive{" "}
                <span className="decoration-blue-500 underline underline-offset-4">immediate payments</span> for
                approved invoices, improving their{" "}
                <span className="decoration-blue-500 underline underline-offset-4">cash flow</span> and fostering
                sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemGridSection() {
  const cards = [
    {
      icon: (
        <div className="flex flex-col justify-center items-center mt-4">
          <div className="flex justify-center items-center bg-transparent mb-2 border-2 border-white rounded-full w-[70px] h-[70px]">
            <span className="font-bold text-[22px] text-white">90</span>
            <span className="ml-1 font-normal text-[12px] text-white">DAYS</span>
          </div>
        </div>
      ),
      heading: "Payment Terms",
      description:
        "Suppliers face long payment cycles, with the industry average of 90 days severely impacting their cashflow.",
    },
    {
      icon: (
        <div className="flex flex-col justify-center items-center mt-4">
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
        <div className="flex flex-col justify-center items-center mt-4">
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
      description: "SMEs often struggle with cashflow due to extended payment terms, causing instability.",
    },
    {
      icon: (
        <div className="flex flex-col justify-center items-center mt-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="2" fill="#333" />
            <path d="M24 16v8l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="4" fill="#fff" />
          </svg>
        </div>
      ),
      heading: "Inefficiency",
      description: "Supplier instability disrupts supply chains, reduces quality and increases costs for operations.",
    },
  ]

  return (
    <section className="relative bg-black py-24 overflow-hidden text-white">
      <div className="z-10 relative container">
        <div className="flex flex-col items-center mb-8">
          <div className="inline-block bg-transparent px-10 py-2 rounded-[40px] font-bold text-white text-4xl uppercase leading-tight tracking-wide">THE PROBLEM WE'RE SOLVING</div>
          <div className="mt-5 mb-5 font-normal text-white text-xl text-center">Most companies take too long to pay their suppliers…</div>
        </div>

        <div className="flex flex-col items-center w-full">
          <div className="gap-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-[#181e29] shadow-xl mb-8 w-full overflow-hidden">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center transition duration-200 cursor-pointer ${idx < cards.length - 1 ? "border-r border-[#222]" : ""} min-w-0 relative bg-transparent shadow-none m-0 text-white py-8 px-2 min-h-[200px] z-1 rounded-none hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]`}
              >
                {card.icon}
                <h3 className="mt-6 mb-2 font-bold text-white text-lg">{card.heading}</h3>
                <p className="px-4 font-normal text-[#eee] text-base text-center">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="mx-auto mt-[2em] max-w-4xl font-light text-[1.35rem] text-white text-lg">
            ...too few financiers have provided fast, tech-enabled, scalable solutions
          </p>
        </div>
      </div>
    </section>
  )
}

function SolutionSection() {
  const cards = [
    {
      icon: (
        <div className="flex justify-center items-center gap-2 mb-4">
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
      heading: "Our systems are tailored for your industry",
      button: "INDUSTRY FOCUSED",
    },
  ]

  return (
    <section className="relative bg-[#f7f7f9] py-24 overflow-hidden text-gray-700">
      <div className="z-10 relative container">
        <div className="mb-10 text-center">
          <div className="inline-block bg-white shadow-lg mb-8 px-8 py-4 rounded-full text-black">
            <h2 className="font-bold text-2xl">OUR SOLUTION</h2>
          </div>
          <p className="mx-auto mb-12 max-w-4xl text-gray-600 text-xl">
            Our tech-platform integrates with accounts payable systems to give suppliers the option to receive immediate
            payment for approved invoices...
          </p>
        </div>
        <div className="bg-white shadow-lg mb-16 p-8 md:p-12 rounded-3xl">
          <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, idx) => (
              <div key={idx} className="flex flex-col items-center px-2 py-4 text-center">
                {card.icon}
                <h3 className="mt-2 mb-3 min-h-12 font-semibold text-gray-700 text-lg">{card.heading}</h3>
                <button className="bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md mt-auto px-6 py-3 rounded-full w-full max-w-[180px] font-bold text-white text-sm transition">
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

const HowItWorksSection = () => {
  return (
    <section className="relative bg-black py-24 overflow-hidden text-white">
      <div className="z-10 relative container">
        <div className="mb-16 text-center">
          <div className="inline-block bg-white mb-8 px-8 py-4 rounded-full text-black">
            <h2 className="font-bold text-2xl">HOW SUPPLY CHAIN FINANCE WORKS</h2>
          </div>
        </div>

        <div className="space-y-8 mx-auto max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="flex justify-center items-center bg-blue-600 rounded-full w-10 h-10 font-bold text-white text-xl shrink-0">
              1
            </div>
            <p className="text-lg">
              A <span className="underline">supplier delivers</span> goods to a company, and the{" "}
              <span className="underline">company approves their invoice</span>.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex justify-center items-center bg-blue-600 rounded-full w-10 h-10 font-bold text-white text-xl shrink-0">
              2
            </div>
            <p className="text-lg">
              <span className="underline">We notify the supplier</span> that their invoice is approved and offer them
              the choice of getting paid immediately at a discount or waiting for the standard payment terms.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex justify-center items-center bg-blue-600 rounded-full w-10 h-10 font-bold text-white text-xl shrink-0">
              3
            </div>
            <p className="text-lg">
              If the supplier chooses immediate payment, <span className="underline">we pay them</span> and the company
              pays us the full amount on the original due date.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex justify-center items-center bg-green-600 rounded-full w-10 h-10 font-bold text-white text-xl shrink-0">
              ✓
            </div>
            <p className="text-lg">
              The supplier gets improved cash flow, and we earn a small fee for providing the service.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

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
      description: "Banks and lenders provide capital at competitive rates based on buyer credit risk.",
    },
    {
      label: "BUYERS",
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M6 19l6-6 6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 13V5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      description:
        "Companies integrate their accounts payable to offer suppliers immediate discounted payment for invoices.",
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
        "Suppliers can elect to receive immediate discounted payment for their invoices already approved by the buyer.",
    },
  ]

  return (
    <section className="relative bg-[#f7f7f9] py-24 overflow-hidden text-gray-700">
      <div className="z-10 relative container">
        <div className="mb-10 text-center">
          <div className="inline-block bg-white shadow-lg mb-8 px-8 py-4 rounded-full text-black">
            <h2 className="font-bold text-2xl">OUR ECOSYSTEM</h2>
          </div>
          <p className="mx-auto mb-12 max-w-4xl text-gray-600 text-xl">
            We are a platform and ecosystem business, adding value by connecting capital from banks and funders with
            suppliers that need it most.
          </p>
        </div>
        <div className="space-y-6 mx-auto max-w-4xl">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex md:flex-row flex-col items-center gap-6 md:gap-8 bg-white shadow px-6 py-6 border border-gray-200 rounded-2xl"
            >
              <button className="bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md mb-4 md:mb-0 px-8 py-3 rounded-full font-bold text-white text-base transition">
                {item.label}
              </button>
              <span className="flex justify-center items-center w-12 md:w-16 h-12 md:h-16">{item.icon}</span>
              <p className="flex-1 text-gray-600 text-base md:text-lg md:text-left text-center">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Footer = () => {
  return (
    <footer className="bg-gray-900 py-16 text-gray-300">
      <div className="mx-auto px-4 container">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <LogoIcon className="w-8 h-8 text-primary" />
            <span className="font-bold text-white text-xl">Future Finance Cashflow</span>
          </div>
          <p className="mb-6 text-base">Future Mining Finance (Pty) Ltd is a registered Credit Provider NCRCP18174</p>
          <div className="text-sm">&copy; 2025 Future Mining Finance. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-[#f7f7f9] text-gray-700">
      <div className="flex flex-col justify-center items-center min-h-screen">
        <main className="flex flex-col justify-center items-center mx-auto p-4 max-w-4xl text-center">
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="flex flex-col mr-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 8L10 14H13L16 11L19 14H22L16 8Z" fill="#2563eb" className="animate-blink-1" />
                <path d="M16 16L10 22H13L16 19L19 22H22L16 16Z" fill="#2563eb" className="animate-blink-2" />
              </svg>
            </span>
            <span className="font-bold text-[#181e29] text-2xl md:text-3xl lg:text-4xl">Future</span>
            <span className="bg-[#2563eb] mx-2 w-px h-8"></span>
            <span className="font-bold text-blue-600 text-2xl md:text-3xl lg:text-4xl">Finance</span>
            <span className="ml-2 font-bold text-blue-600 text-2xl md:text-3xl lg:text-4xl">Cashflow</span>
          </div>

          <div className="space-y-6 mt-12 font-light text-gray-600 text-xl">
            <p>
              Future Finance is a fintech and funding platform enabling companies to offer{" "}
              <span className="bg-[#2563eb] px-3 py-1 rounded-full font-normal text-white">early payment programs</span>{" "}
              for SMEs in their supply chain.
            </p>
            <p>Our platform helps businesses make a greater impact on SMEs by enabling faster payments to suppliers.</p>
            <p>
              Through our platform, suppliers can receive immediate payments for approved invoices,{" "}
              <span className="decoration-[#2563eb] decoration-2 underline underline-offset-4">
                improving their cash flow
              </span>{" "}
              and fostering sustainable growth.
            </p>
          </div>

          <div className="flex gap-4 mt-12">
            <Link href="/login/admin" passHref>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 rounded-full font-normal text-white text-lg">
                Admin Login
              </Button>
            </Link>
            <Link href="/login/ap" passHref>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 rounded-full font-normal text-white text-lg">
                AP Login
              </Button>
            </Link>
            <Link href="/supplier/access" passHref>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 rounded-full font-normal text-white text-lg">
                Supplier Access
              </Button>
            </Link>
          </div>
        </main>
      </div>
      <CompanyDescriptionSection />
      <ProblemGridSection />
      <SolutionSection />
      <HowItWorksSection />
      <EcosystemSection />
      <Footer />
      <style>{`
  @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
  .animate-blink-1 { animation: blink 1.5s infinite; }
  .animate-blink-2 { animation: blink 1.5s 0.3s infinite; }
`}</style>
    </div>
  )
}
