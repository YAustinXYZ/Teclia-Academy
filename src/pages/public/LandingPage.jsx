import { CheckoutFlow } from '../../components/payments/CheckoutFlow.jsx';
import { CheckoutModal } from '../../components/payments/CheckoutModal.jsx';
import { useMemo, useRef, useState, useEffect } from 'react';
import { statsService } from '../../services/api.js';
import StripeCardForm from '../../components/payments/StripeCardForm.jsx';
import { SiteFooter } from '../../components/common/SiteFooter.jsx';
import { UIIcon } from '../../components/common/Icons.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { getLandingContent } from '../../i18n/landingContent.js';

const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function LandingPage() {
  const { t, language } = usePreferences();
  const {
    demoSlides,
    trustChips,
    steps,
    features,
    premiumPlans,
    testimonials,
    scaleTypes,
  } = useMemo(() => getLandingContent(t), [t, language]);

  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScaleIndex, setSelectedScaleIndex] = useState(0);
  const selectedScaleType = scaleTypes[selectedScaleIndex] || scaleTypes[0];
  const [sustainMode, setSustainMode] = useState(false);
  const [sustainActive, setSustainActive] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const checkoutBuying = useRef(false);
  const closeCheckout = () => {
    setCheckoutPlan(null);
    checkoutBuying.current = false;
    sessionStorage.removeItem('checkout_plan');
    sessionStorage.removeItem('checkout_resume');
  };
  const audioContextRef = useRef(null);
  const audioStartedRef = useRef(false);
  const sustainHoldRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem('tecliaVisitCounted')) return;
    statsService.recordVisit()
      .then(() => sessionStorage.setItem('tecliaVisitCounted', '1'))
      .catch(() => { });
  }, []);

  // Resume checkout only after login redirect, not on every visit
  useEffect(() => {
    if (sessionStorage.getItem('checkout_resume') !== '1') return;
    sessionStorage.removeItem('checkout_resume');
    const savedPlan = sessionStorage.getItem('checkout_plan');
    if (savedPlan) setCheckoutPlan(savedPlan);
  }, []);

  // Auto-cycling hero mini-demo (respects reduced motion)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const id = setInterval(() => {
      setDemoStep((s) => (s + 1) % demoSlides.length);
    }, 2600);
    return () => clearInterval(id);
  }, [demoSlides.length]);

  const selectedScaleNotes = useMemo(() => {
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = allNotes.indexOf(selectedRoot);
    const notes = [selectedRoot];
    let index = rootIndex;
    selectedScaleType.formula.forEach((step) => {
      index = (index + step) % 12;
      notes.push(allNotes[index]);
    });
    return notes;
  }, [selectedRoot, selectedScaleType]);

  const selectedScale = useMemo(() => ({
    name: `${selectedRoot} ${selectedScaleType.name}`,
    notes: selectedScaleNotes,
    description: selectedScaleType.description,
  }), [selectedRoot, selectedScaleType, selectedScaleNotes]);

  const playAmbientAura = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = audioContextRef.current || new AudioContext();
    const now = audioCtx.currentTime;
    audioContextRef.current = audioCtx;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    const harmonics = 7;
    const real = new Float32Array(harmonics + 1);
    const imag = new Float32Array(harmonics + 1);
    real[1] = 1;
    real[2] = 0.55;
    real[3] = 0.28;
    real[4] = 0.16;
    real[5] = 0.08;
    real[6] = 0.04;
    real[7] = 0.02;
    const wave = audioCtx.createPeriodicWave(real, imag, { disableNormalization: true });

    osc1.setPeriodicWave(wave);
    osc1.frequency.value = 110;

    osc2.type = 'sine';
    osc2.frequency.value = 220;
    osc2.detune.value = -12;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 3);
    filter.frequency.exponentialRampToValueAtTime(420, now + 12);
    filter.Q.value = 0.9;

    gain.gain.setValueAtTime(0.00001, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 2.2);
    gain.gain.setTargetAtTime(0.005, now + 3.5, 3.5);
    gain.gain.exponentialRampToValueAtTime(0.00005, now + 14);

    noise.buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.4, audioCtx.sampleRate);
    const bufferData = noise.buffer.getChannelData(0);
    for (let i = 0; i < bufferData.length; i += 1) {
      bufferData[i] = (Math.random() * 2 - 1) * 0.002;
    }
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.01, now + 1.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.00008, now + 8);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);

    osc1.stop(now + 12);
    osc2.stop(now + 12);
    noise.stop(now + 2.4);
  };

  const startAmbient = async () => {
    if (audioStartedRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = audioContextRef.current || new AudioContext();
    audioContextRef.current = audioCtx;

    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        return;
      }
    }

    audioStartedRef.current = true;
    playAmbientAura();
  };

  useEffect(() => {
    const tryStartAmbient = (event) => {
      if (event?.target?.closest && event.target.closest('a[href^="#"]')) {
        return;
      }
      startAmbient();
    };

    const handleSustainDown = (event) => {
      if (event.code !== 'KeyS') return;
      if (sustainHoldRef.current) return;
      sustainHoldRef.current = true;
      setSustainActive(true);
    };

    const handleSustainUp = (event) => {
      if (event.code !== 'KeyS') return;
      sustainHoldRef.current = false;
      setSustainActive(sustainMode);
    };

    const timer = setTimeout(() => {
      startAmbient();
    }, 800);

    document.addEventListener('click', tryStartAmbient, { once: true });
    document.addEventListener('keydown', tryStartAmbient, { once: true });
    document.addEventListener('keydown', handleSustainDown);
    document.addEventListener('keyup', handleSustainUp);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', tryStartAmbient);
      document.removeEventListener('keydown', tryStartAmbient);
      document.removeEventListener('keydown', handleSustainDown);
      document.removeEventListener('keyup', handleSustainUp);
    };
  }, []);

  const playPianoNote = (noteLabel) => {
    const noteFrequencies = {
      C4: 261.63,
      'C#4': 277.18,
      D4: 293.66,
      'D#4': 311.13,
      E4: 329.63,
      F4: 349.23,
      'F#4': 369.99,
      G4: 392.0,
      'G#4': 415.3,
      A4: 440.0,
      'A#4': 466.16,
      B4: 493.88,
      C5: 523.25,
      'C#5': 554.37,
      D5: 587.33,
      'D#5': 622.25,
      E5: 659.25,
      F5: 698.46,
      'F#5': 739.99,
      G5: 783.99,
      'G#5': 830.61,
      A5: 880.0,
      'A#5': 932.33,
      B5: 987.77,
    };
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = audioContextRef.current || new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
    audioContextRef.current = audioCtx;
    const now = audioCtx.currentTime;
    const frequency = noteFrequencies[noteLabel] || 440;

    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();

    const harmonics = new Float32Array([0, 1, 0.6, 0.33, 0.17, 0.08, 0.04, 0.02]);
    const imag = new Float32Array(harmonics.length);
    const periodicWave = audioCtx.createPeriodicWave(harmonics, imag, { disableNormalization: true });

    osc1.setPeriodicWave(periodicWave);
    osc1.frequency.value = frequency;
    osc1.detune.value = -1;

    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 2;
    osc2.detune.value = 3;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(600, now + 1.0);
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.00001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.14);
    gain.gain.setTargetAtTime(0.02, now + 0.22, 0.35);
    gain.gain.setTargetAtTime(0.00005, now + 0.9, 0.5);

    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.45, audioCtx.sampleRate);
    const channelData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * 0.0018;
    }
    noise.buffer = noiseBuffer;
    noise.loop = false;

    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.009, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.00008, now + 0.75);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);

    const sustainEngaged = sustainMode || sustainHoldRef.current;
    const noteRelease = sustainEngaged ? 3.4 : 0.85;
    const noiseRelease = sustainEngaged ? 0.75 : 0.25;

    osc1.stop(now + noteRelease);
    osc2.stop(now + noteRelease);
    noise.stop(now + noiseRelease);
  };

  const keyboardKeys = useMemo(() => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return [
      ...notes.map((note) => ({
        label: note,
        octave: 4,
        noteId: `${note}4`,
        type: note.includes('#') ? 'black' : 'white',
      })),
      ...notes.map((note) => ({
        label: note,
        octave: 5,
        noteId: `${note}5`,
        type: note.includes('#') ? 'black' : 'white',
      })),
    ];
  }, []);

  const openCheckout = (label) => {
    if (checkoutBuying.current) return;
    checkoutBuying.current = true;
    setCheckoutPlan(label);
  };

  return (
    <div className="lp">
      <main>
        {/* ============ HERO: copy + animated demo ============ */}
        <section className="lp-hero lp-hero-split bg-grid" id="inicio">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-inner">
            <div className="hero-copy animate-fade-up">
              <span className="lp-badge"><span className="dot" /> {t('lp.hero.badge')}</span>
              <h1>{t('lp.hero.title')} <span className="grad">{t('lp.hero.titleAccent')}</span></h1>
              <p className="lp-lead">
                {t('lp.hero.sub')}
              </p>
              <div className="lp-cta-row">
                <a className="button button-primary" href="/auth/signup">{t('lp.hero.ctaPrimary')}</a>
                <a className="button button-secondary" href="#planes">{t('lp.hero.ctaSecondary')}</a>
              </div>
              <ul className="lp-trust">
                {trustChips.map((chip) => (
                  <li className="chip" key={chip.label}>
                    <UIIcon name={chip.icon} size={14} />
                    {chip.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero-panel">
              <div className="lp-demo animate-fade-up" style={{ '--delay': '120ms' }}>
                <span className="lp-note-float" style={{ top: '14%', right: '10%' }} aria-hidden="true">♪</span>
                <span className="lp-note-float" style={{ bottom: '12%', left: '8%', animationDelay: '1.5s' }} aria-hidden="true">♫</span>
                <div className="lp-demo-head">
                  <div className="lp-demo-dots"><span /><span /><span /></div>
                  <span className="lp-demo-title">{t('lp.demo.label')}</span>
                </div>
                <div className="lp-demo-stage">
                  <div className="lp-demo-slide" key={demoStep}>
                    <div className="lp-demo-icon" aria-hidden="true">
                      <UIIcon name={demoSlides[demoStep].icon} size={28} />
                    </div>
                    <h4>{demoSlides[demoStep].title}</h4>
                    <p>{demoSlides[demoStep].text}</p>
                  </div>
                </div>
                <div className="lp-demo-progress" role="tablist" aria-label={t('lp.demo.aria')}>
                  {demoSlides.map((slide, i) => (
                    <button
                      key={slide.title}
                      type="button"
                      className={i === demoStep ? 'on' : ''}
                      onClick={() => setDemoStep(i)}
                      aria-label={slide.title}
                      aria-selected={i === demoStep}
                      role="tab"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CÓMO FUNCIONA ============ */}
        <section className="lp-section" id="como-funciona">
          <div className="lp-section-head">
            <p className="lp-kicker">{t('lp.how.kicker')}</p>
            <h2>{t('lp.how.title')}</h2>
          </div>
          <ol className="lp-steps">
            {steps.map((step, i) => (
              <li className="lp-step" key={step.title}>
                <span className="lp-step-index">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="lp-section" id="features">
          <div className="lp-section-head">
            <p className="lp-kicker">{t('lp.features.kicker')}</p>
            <h2>{t('lp.features.title')}</h2>
          </div>
          <div className="lp-features">
            {features.map((f) => (
              <article className="lp-feature" key={f.title}>
                <div className="lp-feature-icon" aria-hidden="true"><UIIcon name={f.icon} size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ PLANES ============ */}
        <section className="lp-section" id="planes">
          <div className="lp-section-head">
            <p className="lp-kicker">{t('lp.plans.kicker')}</p>
            <h2>{t('lp.plans.title')}</h2>
            <p className="lp-section-copy">{t('lp.plans.sub')}</p>
          </div>
          <div className="lp-pricing">
            {premiumPlans.map((plan) => (
              <div key={plan.label} className={`lp-plan ${plan.highlight ? 'featured' : ''}`}>
                {plan.highlight && <span className="lp-plan-tag">{t('lp.plans.recommended')}</span>}
                <h3>{plan.label}</h3>
                <p className="lp-plan-sub">{plan.sub}</p>
                <div className="lp-plan-price">
                  <span className="amount">{plan.price}</span>
                  <span className="per">{t('lp.plans.perMonth')}</span>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <UIIcon name="check" size={16} className="lp-check" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`button ${plan.highlight ? 'button-primary' : 'button-secondary'} button-block`}
                  onClick={() => openCheckout(plan.label)}
                >
                  {t('lp.plans.choose', { plan: plan.label })}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ============ HERRAMIENTA INTERACTIVA ============ */}
        <section className="lp-section lp-explore" id="explora">
          <div className="explore-copy">
            <p className="lp-kicker">{t('lp.explore.kicker')}</p>
            <h2>{t('lp.explore.title')}</h2>
            <p>{t('lp.explore.sub')}</p>
            <div className="scale-sign-selector">
              {rootNotes.map((note) => (
                <button
                  key={note}
                  type="button"
                  className={`scale-sign ${note === selectedRoot ? 'active' : ''}`}
                  onClick={() => setSelectedRoot(note)}
                >
                  {note}
                </button>
              ))}
            </div>
            <div className="scale-selector">
              {scaleTypes.map((scale) => (
                <button
                  key={scale.name}
                  className={scale.name === selectedScaleType.name ? 'scale-button active' : 'scale-button'}
                  onClick={() => setSelectedScaleIndex(scaleTypes.indexOf(scale))}
                >
                  {scale.name}
                </button>
              ))}
            </div>
            <div className="scale-details">
              <p className="scale-description">{selectedScale.description}</p>
              <div className="scale-notes">
                {selectedScale.notes.map((note) => (
                  <span key={note} className="scale-note">{note}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="keyboard-shell">
            <div className="keyboard-actions">
              <button
                type="button"
                className={`button button-secondary keyboard-sustain-toggle ${sustainActive ? 'active' : ''}`}
                onClick={() => {
                  const nextMode = !sustainMode;
                  setSustainMode(nextMode);
                  setSustainActive(nextMode || sustainHoldRef.current);
                }}
              >
                Sustain {sustainActive ? 'On' : 'Off'}
              </button>
              <p className="keyboard-note">{t('lp.keyboard.sustainHint')}</p>
            </div>
            <div className="keyboard">
              {keyboardKeys.map((key) => {
                const scaleNotes = new Set(selectedScale.notes);
                const isActive = scaleNotes.has(key.label);
                return (
                  <button
                    key={key.noteId}
                    className={`piano-key ${key.type} ${isActive ? 'active' : ''}`}
                    type="button"
                    onClick={() => {
                      startAmbient();
                      playPianoNote(key.noteId);
                    }}
                    aria-label={`${key.label}${key.octave}`}
                  >
                    <span>
                      {key.label}
                      <small>{key.octave}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="keyboard-caption">{t('lp.keyboard.caption')}</p>
          </div>
        </section>

        {/* ============ TESTIMONIOS ============ */}
        <section className="lp-section" id="testimonios">
          <div className="lp-section-head">
            <p className="lp-kicker">{t('lp.testimonials.kicker')}</p>
            <h2>{t('lp.testimonials.head')}</h2>
          </div>
          <div className="lp-testimonials">
            {testimonials.map((item) => (
              <article className="lp-quote" key={item.name}>
                <p>“{item.quote}”</p>
                <div className="lp-quote-author">
                  <span className="lp-quote-avatar" aria-hidden="true">{item.initial}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="lp-finale" id="contacto">
          <div className="lp-finale-inner">
            <p className="lp-kicker">{t('lp.finale.kicker')}</p>
            <h2>{t('lp.finale.title')}</h2>
            <p>{t('lp.finale.sub')}</p>
            <div className="lp-cta-row">
              <a className="button button-invert" href="/auth/signup">{t('lp.hero.ctaPrimary')}</a>
              <a className="button button-secondary" href="#planes">{t('lp.hero.ctaSecondary')}</a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {checkoutPlan && (
        <CheckoutModal onClose={closeCheckout}>
          <CheckoutFlow
            initialPlan={checkoutPlan}
            onComplete={closeCheckout}
            renderPaymentForm={({ plan, onSuccess }) => (
              <StripeCardForm
                submitLabel="Pagar ahora"
                successMessage={`Método de pago del plan ${plan.label} enviado correctamente.`}
                onSuccess={onSuccess}
              />
            )}
          />
        </CheckoutModal>
      )}
    </div>
  );
}

export default LandingPage;
