import { getTranslation } from "@/utils/getTranslation";
export default async function HowItWorks() {
 const { lang, t } =  await getTranslation();
 const howItWorksText=t.howItWorks
 const commonText=t.common

  const stepsList = [howItWorksText.steps.step1, howItWorksText.steps.step2, howItWorksText.steps.step3, howItWorksText.steps.step4];

  return (
    <section 
      id="how-it-works" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
    >
      
      {<div className="absolute top-1/4 -left-20 w-112.5 h-112.5 bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>}
      <div className="absolute bottom-10 -right-20 w-112.5 h-112.5 bg-sky-100/50 dark:bg-sky-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {howItWorksText.hero.eyebrow}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
            {howItWorksText.hero.title} <br />
            <span className="bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
              {howItWorksText.hero.titleHighlight}
            </span>
          </h2>

          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-normal">
            {howItWorksText.hero.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {stepsList.map((step, idx) => (
            <div
              key={idx}
              className={`group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-2xl hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between ${lang === 'ar' ? 'text-right' : 'text-left'}`}
            >
              <div className="space-y-4">
                <div className={`flex items-center justify-between ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-3xl font-black text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors">
                    {step.number}
                  </span>
                  <span className="text-3xl p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    {step.icon}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400">
                    {step.badge}
                  </span>
                  <h3 className="text-lg font-bold group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {step.title}
                  </h3>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {step.description}
                </p>

                <hr className="border-slate-100 dark:border-slate-800 my-3" />

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {step.outputsTitle}:
                  </span>
                  <ul className="space-y-2">
                    {step.outputs.map((out, i) => (
                      <li 
                        key={i} 
                        className={`flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 ${
                          lang === 'ar' ? 'flex-row text-right' : 'flex-row text-left'
                        }`}
                      >
                        <span className="text-emerald-500 font-extrabold mt-0.5 shrink-0">✓</span>
                        <span className="leading-relaxed">{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <div className="h-1 w-10 bg-slate-200 dark:bg-slate-800 rounded-full group-hover:w-full group-hover:bg-linear-to-r group-hover:from-emerald-400 group-hover:to-amber-400 transition-all duration-500"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black">
              {howItWorksText.cta.title}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              {howItWorksText.cta.description}
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
         <a
  href={`/request-service?service=consultation&lang=${lang}`}
  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-center text-sm whitespace-nowrap active:scale-95"
>
              {commonText.cta.startSession}
            </a>
          </div>
        </div>

      </div> 
    </section>
  );
}