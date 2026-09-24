'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function CinematicIntro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 650);
  };

  if (!visible) return null;

  return (
    <div className={`cinematic-intro ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-label="Welcome to ANNORA">
      <div className="cinematic-noise" />
      <div className="cinematic-content">
        <img className="cinematic-logo" src="/brand/annora-logo-dark.svg?v=2" alt="ANNORA — Rescue Food, Nourish Lives" />
        <div className="cinematic-tradition">परंपरा <span>•</span> सेवा <span>•</span> आशा</div>
        <p className="cinematic-kicker">A food rescue network for real people</p>
        <h1>ANNORA</h1>
        <h2>Every helping hand <em>feeds hope.</em></h2>
        <p className="cinematic-copy">ANNORA brings surplus food, trusted NGOs and caring volunteers together so no good meal goes to waste.</p>
        <div className="cinematic-actions">
          <Link href="/login" className="cinematic-primary" onClick={dismiss}>Login</Link>
          <Link href="/register" className="cinematic-secondary" onClick={dismiss}>Sign up</Link>
        </div>
        <button type="button" className="cinematic-skip" onClick={dismiss}>Enter ANNORA <span aria-hidden="true">→</span></button>
      </div>
      <div className="cinematic-progress" />
    </div>
  );
}
