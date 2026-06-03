import { useMemo, useRef, useState, useEffect } from 'react';
import { statsService } from '../../services/api.js';

const navigation = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Recursos', href: '#explora' },
  { label: 'Planes', href: '#premium' },
  { label: 'Mi escuela', href: '#studio' },
  { label: 'Contacto', href: '#contacto' },
];

const features = [
  {
    title: 'Lecciones en video',
    description: 'Lecciones prácticas en video y rutas de aprendizaje estructuradas.',
  },
  {
    title: 'Piezas y acompañamientos',
    description: 'Pistas y partituras para práctica y estudio.',
  },
  {
    title: 'Lecciones estructuradas',
    description: 'Módulos y ejercicios organizados para avanzar paso a paso.',
  },
  {
    title: 'Teoría y partituras',
    description: 'Artículos, escalas y partituras para profundizar el conocimiento musical.',
  },
];

const premiumPlans = [
  {
    label: 'Básico',
    price: '$9.99',
    features: ['Acceso a recursos', 'Lecciones guiadas', 'Comunidad privada'],
    details: 'Un plan ideal para comenzar, con acceso completo a recursos y una comunidad dedicada al aprendizaje.',
  },
  {
    label: 'Pro',
    price: '$24.99',
    features: ['Feedback de IA', 'Clases 1:1', 'Partituras exclusivas'],
    highlight: true,
    details: 'El plan más equilibrado para acelerar tu progreso con apoyo guiado y contenido exclusivo.',
  },
  {
    label: 'Master',
    price: '$49.99',
    features: ['Plan personalizado', 'Sesiones premium', 'Análisis avanzado'],
    details: 'Para quienes quieren una experiencia VIP completa con seguimiento premium y soporte prioritario.',
  },
];

const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const scaleTypes = [
  {
    name: 'Mayor',
    formula: [2, 2, 1, 2, 2, 2, 1],
    description: 'Escala mayor clásica para prácticas brillantes y melodías claras.',
  },
  {
    name: 'Menor natural',
    formula: [2, 1, 2, 2, 1, 2, 2],
    description: 'Escala menor natural con carácter profundo y expresivo.',
  },
  {
    name: 'Menor armónica',
    formula: [2, 1, 2, 2, 1, 3, 1],
    description: 'Escala menor armónica con un color más dramático y resonante.',
  },
  {
    name: 'Pentatónica mayor',
    formula: [2, 2, 3, 2, 3],
    description: 'Escala abierta, ideal para improvisar con fluidez desde el comienzo.',
  },
  {
    name: 'Blues',
    formula: [3, 2, 1, 1, 3, 2],
    description: 'Escala de blues con color y estilo moderno para explorar nuevos sonidos.',
  },
];

function LandingPage() {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScaleType, setSelectedScaleType] = useState(scaleTypes[0]);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [sustainMode, setSustainMode] = useState(false);
  const [sustainActive, setSustainActive] = useState(false);
  const audioContextRef = useRef(null);
  const audioStartedRef = useRef(false);
  const sustainHoldRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem('tecliaVisitCounted')) return;
    statsService.recordVisit()
      .then(() => sessionStorage.setItem('tecliaVisitCounted', '1'))
      .catch(() => {});
  }, []);

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
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
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

  return (
    <div className="page-shell">
      <header className="topbar" id="inicio">
        <nav className="nav-links">
          {navigation.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero section-surface">
          <div className="hero-copy">
            <p className="eyebrow">Teclia · Academia de piano</p>
            <h1>Aprende piano directamente con tu profesor.</h1>
            <p className="hero-text">
              Mis lecciones y recursos están diseñados para que los estudiantes practiquen con claridad.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#explora">
                Ver recursos
              </a>
              <a className="button button-secondary" href="#premium">
                Ver planes
              </a>
              <a className="button button-secondary" href="/auth/login">
                Ingresar como alumno
              </a>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-card">
              <span className="hero-badge">Nuevo</span>
              <h2>Una plataforma profesional</h2>
              <p>Contenido preparado para que los estudiantes avancen con confianza y enfoque.</p>
              <ul className="hero-list">
                <li>Lecciones estructuradas para alumnos</li>
                <li>Recursos listos para tu escuela</li>
                <li>Control total sobre cada lección</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-surface section-grid">
          <div className="section-intro">
            <p className="eyebrow">¿Por qué Teclia?</p>
            <h2>Un espacio pensado para aprender y enseñar piano con profesionalismo.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Claridad visual</h3>
              <p>Un diseño limpio que deja el centro de atención en la música y el contenido.</p>
            </article>
            <article className="feature-card">
              <h3>Contenido organizado</h3>
              <p>Lecciones, partituras y recursos accesibles con una estructura clara.</p>
            </article>
            <article className="feature-card">
              <h3>Control profesional</h3>
              <p>Publica, administra y comparte cada recurso desde una interfaz sobria.</p>
            </article>
          </div>
        </section>

        <section className="section-surface section-studio" id="studio">
          <div>
            <p className="eyebrow">Tu estudio</p>
            <h2>Contenido curado para cada práctica.</h2>
            <p className="section-copy">
              Recursos bien organizados para que avances con confianza y disfrutes una práctica clara y profesional.
            </p>
          </div>
          <div className="studio-grid">
            {features.map((item) => (
              <article className="studio-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-surface section-preview" id="premium">
          <div className="preview-copy">
            <p className="eyebrow">Teclia Pro</p>
            <h2>Experiencia premium para alumnos motivados</h2>
            <p>Accede a planes, análisis de progreso y contenido premium para mejorar tu práctica.</p>
          </div>
          <div className="pricing-grid">
            {premiumPlans.map((plan) => (
              <div key={plan.label} className={`pricing-card ${plan.highlight ? 'pricing-card-highlight' : ''}`}>
                {plan.highlight && <span className="plan-badge">Recomendado</span>}
                <h3>{plan.label}</h3>
                <p className="plan-price">{plan.price}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="plan-actions">
                  <button
                    type="button"
                    className="button button-primary plan-buy-button"
                    onClick={() => {
                      setSelectedPlan(plan.label);
                      setActivePlan(plan.label);
                      setPaymentStatus(null);
                      setTimeout(() => {
                        document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 150);
                    }}
                  >
                    Comprar {plan.label}
                  </button>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setActivePlan(activePlan === plan.label ? null : plan.label)}
                  >
                    {activePlan === plan.label ? 'Ocultar detalles' : 'Más información'}
                  </button>
                </div>
                {activePlan === plan.label && (
                  <div className="plan-extra">
                    <p>{plan.details}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="payment-section" id="payment-section">
            <div className="payment-panel">
              <div className="payment-panel-header">
                <h2>Compra tu plan</h2>
                <p>Selecciona un plan y completa los datos de la tarjeta para avanzar. Esto te ayuda a ver el flujo de pago con claridad.</p>
              </div>

              {selectedPlan ? (
                <>
                  <div className="selected-plan-card">Plan seleccionado: <strong>{selectedPlan}</strong></div>
                  <form className="payment-form" onSubmit={(e) => {
                    e.preventDefault();
                    const raw = paymentInfo.cardNumber.replace(/\s+/g, '');
                    if (!/^[0-9]{16}$/.test(raw)) {
                      setPaymentStatus({ type: 'error', message: 'Ingresa un número de tarjeta válido de 16 dígitos.' });
                      return;
                    }
                    if (!/^[0-9]{2}\/([0-9]{2})$/.test(paymentInfo.expiry)) {
                      setPaymentStatus({ type: 'error', message: 'Ingresa fecha de expiración en formato MM/AA.' });
                      return;
                    }
                    if (!/^[0-9]{3,4}$/.test(paymentInfo.cvc)) {
                      setPaymentStatus({ type: 'error', message: 'Ingresa un CVC válido de 3 o 4 dígitos.' });
                      return;
                    }
                    setPaymentStatus({ type: 'success', message: `Pago simulado recibido para ${selectedPlan}. Gracias por tu compra.` });
                  }}>
                    <div className="payment-row">
                      <label>
                        Número de tarjeta
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={paymentInfo.cardNumber}
                          onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cardNumber: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        Expiración
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={paymentInfo.expiry}
                          onChange={(e) => setPaymentInfo((prev) => ({ ...prev, expiry: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        CVC
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={paymentInfo.cvc}
                          onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cvc: e.target.value }))}
                          required
                        />
                      </label>
                    </div>
                    <button type="submit" className="button button-primary">Pagar ahora</button>
                    {paymentStatus && (
                      <div className={`payment-status ${paymentStatus.type}`}>{paymentStatus.message}</div>
                    )}
                    <p className="payment-note">Pago simulado. La pasarela real se integrará en la siguiente fase.</p>
                  </form>
                </>
              ) : (
                <p className="payment-hint">Haz clic en "Comprar" en alguno de los planes para ver el formulario de pago.</p>
              )}
            </div>
          </div>
        </section>

        <section className="section-surface section-explore" id="explora">
          <div className="explore-copy">
            <p className="eyebrow">Explora</p>
            <h2>Recursos gratuitos que hacen que aprender sea intuitivo.</h2>
            <p>Biblioteca de escalas, teoría musical, notas en pentagrama y ejercicios interactivos. Todo en un solo lugar.</p>
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
                  onClick={() => setSelectedScaleType(scale)}
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
              <p className="keyboard-note">Mantén S para sustain; usa este botón en pantalla táctil.</p>
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
            <p className="keyboard-caption">Presiona cualquier tecla para activar el audio y escuchar cada nota.</p>
          </div>
        </section>

        <section className="section-surface section-about" id="contacto">
          <div className="about-copy">
            <p className="eyebrow">Conecta conmigo</p>
            <h2>Teclia se construye como tu próxima escuela de piano.</h2>
            <p>Una experiencia elegante y profesional para estudiantes y creadores que valoran contenido claro y bien presentado.</p>
            <div className="contact-cards">
              <div className="contact-card">
                <p className="contact-label">Teléfono</p>
                <p className="contact-value">+506 62608415</p>
              </div>
              <div className="contact-card">
                <p className="contact-label">Email</p>
                <p className="contact-value">austinrmz2007@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="social-panel">
            <p className="social-title">Redes sociales</p>
            <div className="social-links">
              <a href="https://www.instagram.com/tecliaacademy?utm_source=qr" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="YouTube">YouTube</a>
              <a href="#" aria-label="TikTok">TikTok</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <p>© 2026 Teclia. Todos los derechos reservados.</p>
          <p className="footer-copy">Aprendizaje de piano con estilo profesional y contenidos claros.</p>
        </div>
        <div className="footer-links">
          <a href="#inicio">Inicio</a>
          <a href="#explora">Explora</a>
          <a href="#premium">Premium</a>
          <a href="#contacto">Contacto</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
