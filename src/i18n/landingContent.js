/** Localized marketing content for the landing page. */
export const getLandingContent = (t) => ({
  demoSlides: [
    { icon: 'video', title: t('lp.demo.1.title'), text: t('lp.demo.1.text') },
    { icon: 'piano', title: t('lp.demo.2.title'), text: t('lp.demo.2.text') },
    { icon: 'star', title: t('lp.demo.3.title'), text: t('lp.demo.3.text') },
    { icon: 'trophy', title: t('lp.demo.4.title'), text: t('lp.demo.4.text') },
  ],
  trustChips: [
    { icon: 'video', label: t('lp.chip.video') },
    { icon: 'sheet', label: t('lp.chip.sheet') },
    { icon: 'star', label: t('lp.chip.plans') },
  ],
  steps: [
    { title: t('lp.step.1.title'), text: t('lp.step.1.text') },
    { title: t('lp.step.2.title'), text: t('lp.step.2.text') },
    { title: t('lp.step.3.title'), text: t('lp.step.3.text') },
    { title: t('lp.step.4.title'), text: t('lp.step.4.text') },
  ],
  features: [
    { icon: 'video', title: t('lp.feat.1.title'), text: t('lp.feat.1.text') },
    { icon: 'sheet', title: t('lp.feat.2.title'), text: t('lp.feat.2.text') },
    { icon: 'piano', title: t('lp.feat.3.title'), text: t('lp.feat.3.text') },
    { icon: 'book', title: t('lp.feat.4.title'), text: t('lp.feat.4.text') },
  ],
  premiumPlans: [
    {
      label: t('plan.basico'),
      sub: t('lp.plan.basico.sub'),
      price: '$9.99',
      features: [t('lp.plan.basico.f1'), t('lp.plan.basico.f2'), t('lp.plan.basico.f3')],
    },
    {
      label: t('plan.pro'),
      sub: t('lp.plan.pro.sub'),
      price: '$24.99',
      features: [t('lp.plan.pro.f1'), t('lp.plan.pro.f2'), t('lp.plan.pro.f3'), t('lp.plan.pro.f4')],
      highlight: true,
    },
    {
      label: t('plan.master'),
      sub: t('lp.plan.master.sub'),
      price: '$49.99',
      features: [t('lp.plan.master.f1'), t('lp.plan.master.f2'), t('lp.plan.master.f3'), t('lp.plan.master.f4')],
    },
  ],
  testimonials: [
    { quote: t('lp.t1.quote'), name: 'María F.', role: t('lp.t1.role'), initial: 'M' },
    { quote: t('lp.t2.quote'), name: 'Diego R.', role: t('lp.t2.role'), initial: 'D' },
    { quote: t('lp.t3.quote'), name: 'Ana L.', role: t('lp.t3.role'), initial: 'A' },
  ],
  scaleTypes: [
    { name: t('lp.scale.major'), formula: [2, 2, 1, 2, 2, 2, 1], description: t('lp.scale.major.desc') },
    { name: t('lp.scale.natMin'), formula: [2, 1, 2, 2, 1, 2, 2], description: t('lp.scale.natMin.desc') },
    { name: t('lp.scale.harmMin'), formula: [2, 1, 2, 2, 1, 3, 1], description: t('lp.scale.harmMin.desc') },
    { name: t('lp.scale.penta'), formula: [2, 2, 3, 2, 3], description: t('lp.scale.penta.desc') },
    { name: t('lp.scale.blues'), formula: [3, 2, 1, 1, 3, 2], description: t('lp.scale.blues.desc') },
  ],
});
