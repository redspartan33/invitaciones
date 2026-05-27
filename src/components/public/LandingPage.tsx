type Plan = {
  name: string
  setup: string
  monthly: string
  featured?: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    name: 'Essential',
    setup: '$6,900 MXN',
    monthly: '$790 MXN / mes',
    features: [
      'Menú digital personalizado',
      'Optimizado para celular',
      'QR personalizado',
      'Hosting incluido',
      'Sin publicidad ni expiración',
    ],
  },
  {
    name: 'Signature',
    setup: '$14,900 MXN',
    monthly: '$2,490 MXN / mes',
    featured: true,
    features: [
      'Todo lo de Essential',
      'EN / ES / FR integrado',
      'Menús por temporada',
      'Preview personalizado al compartir',
      'Experiencia visual premium',
    ],
  },
  {
    name: 'Multi-Location',
    setup: '$34,900 MXN',
    monthly: '$5,900 MXN / mes',
    features: [
      'Todo lo de Signature',
      'Múltiples restaurantes',
      'Métricas y analytics',
      'Menús independientes por sucursal',
      'Escalable para nuevas aperturas',
    ],
  },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f4f1] text-[#121212] font-sans">
      <section className="px-8 md:px-16 pt-10 pb-24">
        <nav className="flex items-center justify-between mb-20">
          <img
            src="/la-martina-logo.svg"
            alt="La Martina"
            className="h-14 w-auto"
          />

          <button className="bg-[#121212] text-white px-6 py-3 rounded-full text-sm">
            Contactar
          </button>
        </nav>

        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="uppercase tracking-[0.3em] text-[#ff2f68] text-sm mb-5">
              Premium Digital Hospitality
            </p>

            <h2 className="text-6xl md:text-7xl leading-[0.95] font-light mb-8">
              Experiencias digitales para restaurantes premium.
            </h2>

            <p className="text-lg text-[#555] leading-relaxed mb-10 max-w-xl">
              Diseñamos menús digitales premium optimizados para restaurantes modernos,
              turismo internacional y experiencias de marca memorables.
            </p>

            <div className="flex gap-4 flex-wrap">
              <button className="bg-[#ff2f68] text-white px-8 py-4 rounded-full">
                Ver propuesta
              </button>

              <button className="border border-[#121212] px-8 py-4 rounded-full">
                Agendar reunión
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#ece4dd] rounded-[32px] overflow-hidden shadow-2xl h-[700px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ece4dd] bg-[#faf7f4]">
              <div>
                <p className="font-medium">Marulier Digital Menu</p>
                <p className="text-sm text-[#666]">lamartinasma.com</p>
              </div>

              <div className="bg-[#ff2f68] text-white text-xs px-4 py-2 rounded-full">
                LIVE
              </div>
            </div>

            <iframe
              src="https://lamartinasma.com/?id=Nd91r6yVt#ensaladas-24f6e5"
              title="Marulier Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      <section className="px-8 md:px-16 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="uppercase tracking-[0.3em] text-[#ff2f68] text-sm mb-4">
              Planes
            </p>

            <h2 className="text-5xl md:text-6xl font-light">
              Mucho más que un QR.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[28px] p-8 border ${
                  plan.featured
                    ? 'bg-[#121212] text-white border-[#121212]'
                    : 'bg-[#f8f4f1] border-[#ece4dd]'
                }`}
              >
                <p className="uppercase tracking-[0.2em] text-xs text-[#ff2f68] mb-4">
                  {plan.name}
                </p>

                <h3 className="text-4xl font-light mb-2">{plan.setup}</h3>
                <p className="mb-8 opacity-70">{plan.monthly}</p>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#ff2f68] mt-2" />
                      <p className="text-sm leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 md:px-16 py-24 bg-[#121212] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="uppercase tracking-[0.3em] text-[#ff7fa3] text-sm mb-4">
              Marulier Proposal
            </p>

            <h2 className="text-5xl md:text-6xl font-light leading-tight mb-8">
              Sistema multi restaurante premium.
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl">
              Diseñado para acompañar el crecimiento de Marulier manteniendo una experiencia visual consistente y premium.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Multi menús',
                'Multi restaurantes',
                'EN / ES / FR',
                'QRs personalizados',
                'Menús por temporada',
                'Analytics y métricas',
                'Hosting incluido',
                'Escalable para nuevas aperturas',
              ].map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-[#ff2f68] mt-2" />
                  <p className="text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white text-[#121212] rounded-[32px] p-10 shadow-2xl">
            <p className="uppercase tracking-[0.2em] text-[#ff2f68] text-sm mb-6">
              Inversión
            </p>

            <div className="mb-8">
              <p className="text-[#666] mb-2">Setup inicial</p>
              <h3 className="text-5xl font-light">$24,900 MXN</h3>
            </div>

            <div className="mb-8">
              <p className="text-[#666] mb-2">Mensualidad</p>
              <h3 className="text-5xl font-light">$4,900 MXN</h3>
            </div>

            <p className="text-[#555] leading-relaxed mb-10">
              Incluye sistema multi restaurante, hosting, soporte, traducciones y métricas.
            </p>

            <button className="w-full bg-[#ff2f68] text-white py-5 rounded-2xl">
              Comenzar proyecto
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
