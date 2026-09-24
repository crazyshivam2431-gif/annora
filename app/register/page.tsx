import Link from 'next/link';
import { HandHeart, ShieldCheck, Truck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

export default function RegisterPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap registration-page">
        <div className="registration-intro">
          <p className="eyebrow">Join the ANNORA network</p>
          <h1>Choose your way to create impact.</h1>
          <p>Each path has its own short, focused setup so you only see the information relevant to your role.</p>
        </div>

        <div className="registration-options">
          <Link href="/register/donor" className="registration-option donor-option">
            <span className="option-topline"><span className="option-number">01</span><span className="option-icon"><HandHeart size={19} /></span></span>
            <h2>Donate Food</h2>
            <p>Share surplus meals from your home, restaurant, kitchen, or event.</p>
            <span className="option-action">Create donor account <span aria-hidden="true">→</span></span>
          </Link>
          <Link href="/ngo/register" className="registration-option ngo-option">
            <span className="option-topline"><span className="option-number">02</span><span className="option-icon"><ShieldCheck size={19} /></span></span>
            <h2>Register NGO / Shelter</h2>
            <p>Register your organisation, capacity, food preferences, and service area.</p>
            <span className="option-action">Start NGO verification <span aria-hidden="true">→</span></span>
          </Link>
          <Link href="/volunteer" className="registration-option volunteer-option">
            <span className="option-topline"><span className="option-number">03</span><span className="option-icon"><Truck size={19} /></span></span>
            <h2>Become Driver / Volunteer</h2>
            <p>Join the delivery network for pickups, routes, and rescue coordination.</p>
            <span className="option-action">Create driver account <span aria-hidden="true">→</span></span>
          </Link>
        </div>

        <p className="registration-footer">Already have an account? <Link href="/login">Login here</Link></p>
      </section>
    </main>
  );
}
