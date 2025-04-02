// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, BuildingIcon, KeyIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Simplify Property Management in Kenya
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A comprehensive solution for landlords, caretakers, and agents to manage properties, 
                  tenants, and payments with ease.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-up">
                  <Button size="lg" className="animate-buttonheartbeat">
                    Get Started
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative w-full aspect-video overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-grid-small-white/[0.2] bg-primary/10" />
              <img
                src="/images/dashboard-preview.png"
                alt="Dashboard Preview"
                className="object-cover w-full h-full"
                width={550}
                height={310}
              />
            </div>
          </div>
        </div>
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
            <div
              className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Tailored For Everyone in Property Management
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform is designed to meet the needs of property owners, caretakers, and agents
                with role-specific features and access control.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {/* Landlord Features */}
            <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg shadow-sm bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <BuildingIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Landlords & Property Owners</h3>
              <p className="text-muted-foreground text-center">
                Add properties, track rent payments, view financial reports, and manage tenants all in one place.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Property portfolio management
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Financial analytics and reporting
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Assign caretakers and agents
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Maintenance request approval
                </li>
              </ul>
            </div>

            {/* Caretaker Features */}
            <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg shadow-sm bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <KeyIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Caretakers & On-site Managers</h3>
              <p className="text-muted-foreground text-center">
                Efficiently manage day-to-day operations, record rent payments, and handle maintenance requests.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Tenant management
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Rent collection tracking
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Maintenance request handling
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Direct communication with tenants
                </li>
              </ul>
            </div>

            {/* Agent Features */}
            <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg shadow-sm bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                {/* <UserGroup className="h-10 w-10 text-primary" /> */}
              </div>
              <h3 className="text-xl font-bold">Agents & Property Marketers</h3>
              <p className="text-muted-foreground text-center">
                Market properties, manage tenant acquisition, and handle property viewings seamlessly.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Property listing management
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Tenant onboarding
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Lease agreement generation
                </li>
                <li className="flex items-center">
                  <ChevronRightIcon className="mr-2 h-4 w-4 text-primary" />
                  Property viewing scheduling
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Why Choose Our Property Management System?
              </h2>
              <p className="text-muted-foreground">
                Designed specifically for the Kenyan real estate market, our platform offers:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="mt-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span>Integration with local payment services like M-Pesa</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="mt-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span>Compliance with Kenyan housing regulations and tax requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="mt-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span>Automatic rent reminders customized to local payment cycles</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="mt-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span>Efficient communication between all stakeholders</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="mt-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span>Easy-to-use interface optimized for mobile devices</span>
                </li>
              </ul>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-up">
                  <Button size="lg">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
            <div className="w-full aspect-video overflow-hidden rounded-xl">
              <div className="relative w-full h-full">
                <img
                  src="/images/benefits-illustration.png"
                  alt="Property Management Benefits"
                  className="object-cover w-full h-full"
                  width={550}
                  height={310}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Trusted by Property Owners Across Kenya
            </h2>
            <p className="text-muted-foreground md:text-xl">
              Hear what our users have to say about our property management solution
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {/* Testimonial 1 */}
            <div className="flex flex-col p-6 space-y-4 border rounded-lg shadow-sm bg-card">
              <div className="flex items-center space-x-4">
                <div className="rounded-full overflow-hidden w-12 h-12 bg-muted">
                  <img src="/images/testimonial-1.jpg" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">James Kamau</h3>
                  <p className="text-sm text-muted-foreground">Property Owner, Nairobi</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "This system has transformed how I manage my rental properties. I can now track rent payments
                and maintenance issues from anywhere, saving me countless hours each month."
              </p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="flex flex-col p-6 space-y-4 border rounded-lg shadow-sm bg-card">
              <div className="flex items-center space-x-4">
                <div className="rounded-full overflow-hidden w-12 h-12 bg-muted">
                  <img src="/images/testimonial-2.jpg" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">Grace Wanjiku</h3>
                  <p className="text-sm text-muted-foreground">Caretaker, Mombasa</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "As a caretaker managing multiple buildings, the system helps me organize tenant information
                and track maintenance requests efficiently. The mobile app is especially useful."
              </p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="flex flex-col p-6 space-y-4 border rounded-lg shadow-sm bg-card">
              <div className="flex items-center space-x-4">
                <div className="rounded-full overflow-hidden w-12 h-12 bg-muted">
                  <img src="/images/testimonial-3.jpg" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">David Ochieng</h3>
                  <p className="text-sm text-muted-foreground">Real Estate Agent, Kisumu</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "This platform has streamlined my property marketing and tenant placement process.
                The ability to generate lease agreements and track viewings has been invaluable."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Transform Your Property Management?
            </h2>
            <p className="max-w-[700px] md:text-xl">
              Join hundreds of property owners, caretakers, and agents who are already benefiting from our system.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/sign-up">
                <Button size="lg" variant="secondary">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kenya Property Manager. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}