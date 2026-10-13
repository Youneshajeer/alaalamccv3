
import { getTranslation } from "@/utils/getTranslation";


export default async function  Services() {
const { lang, t } = await getTranslation();
 const serviceText =t.services;
  const commonText = t.common;

  const servicesList = [
    {
      id: 'inbound',
      num: serviceText.inbound.number,
      icon: serviceText.inbound.icon,
      title: serviceText.inbound.title,
      desc: serviceText.inbound.description,
      badge: serviceText.inbound.badge,
      features: serviceText.inbound.features
    },
    {
      id: 'outbound',
      num: serviceText.outbound.number,
      icon: serviceText.outbound.icon,
      title: serviceText.outbound.title,
      desc: serviceText.outbound.description,
      badge: serviceText.outbound.badge,
      features: serviceText.outbound.features
    },
    {
      id: 'technical-support',
      num: serviceText.technicalSupport.number,
      icon: serviceText.technicalSupport.icon,
      title: serviceText.technicalSupport.title,
      desc: serviceText.technicalSupport.description,
      badge: serviceText.technicalSupport.badge,
      features: serviceText.technicalSupport.features
    },
    {
      id: 'omni-channel',
      num: serviceText.omnichannel.number,
      icon: serviceText.omnichannel.icon,
      title: serviceText.omnichannel.title,
      desc: serviceText.omnichannel.description,
      badge: serviceText.omnichannel.badge,
      features: serviceText.omnichannel.features
    }
  ];

  const qualityMetrics = [
    { label: serviceText.infrastructure.stats.sla.label, value: serviceText.infrastructure.stats.sla.value },
    { label: serviceText.infrastructure.stats.csat.label, value: serviceText.infrastructure.stats.csat.value },
    { label: serviceText.infrastructure.stats.hosting.label, value: serviceText.infrastructure.stats.hosting.value },
  ];

  return (
    <section 
      id="services" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`py-20 bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
    >
      <div className="absolute -top-24 right-10 w-96 h-96 bg-emerald-100/60 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-100/60 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {serviceText.hero.eyebrow}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black leading-tight">
            {serviceText.hero.title} <br />
            <span className="bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
              {serviceText.hero.titleHighlight}
            </span>
          </h2>

          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-normal">
            {serviceText.hero.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesList.map((service, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {service.icon}
                    </span>
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors">
                      {service.num}
                    </span>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                    {service.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {service.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  {service.desc}
                </p>

                <hr className="border-slate-100 dark:border-slate-800 my-4" />

                <ul className="space-y-2.5">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <a
                  href={`/request-service?service=${service.id}`}
                  className="block text-center w-full bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm shadow-md active:scale-95"
                >
                  {commonText.cta.requestService}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
            {qualityMetrics.map((metric, idx) => (
              <div key={idx} className="pt-4 md:pt-0 space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
              <span>🇸🇦</span> {serviceText.infrastructure.title}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
              {serviceText.infrastructure.description}
            </p>
          </div>

          <a
            href={`/request-service?service=infrastructure`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm whitespace-nowrap active:scale-95"
          >
            {commonText.cta.requestQuote}
          </a>
        </div>

      </div> 
    </section>
  );
}