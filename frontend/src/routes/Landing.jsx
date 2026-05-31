import CTA from '../features/landing/components/CTA.jsx'
import FeatureGrid from '../features/landing/components/FeatureGrid.jsx'
import Hero from '../features/landing/components/Hero.jsx'
import HowItWorks from '../features/landing/components/HowItWorks.jsx'
import LandingFooter from '../features/landing/components/LandingFooter.jsx'
import LandingNavbar from '../features/landing/components/LandingNavbar.jsx'
import Stats from '../features/landing/components/Stats.jsx'

export default function LandingRoute() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <FeatureGrid />
        <HowItWorks />
        <CTA />
      </main>
      <LandingFooter />
    </div>
  )
}
