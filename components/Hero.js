import Calender from "./Calender";
import CallToAction from "./CallToAction";
import Quote from "./Quote";

export default function Hero() {
  return (
    <div className="py-4 md:py-10 flex flex-col gap-6 sm:gap-8 md:gap-10">
      <h1 className="fugaz text-5xl sm:text-6xl md:text-7xl text-center">
        <span className="textGradient">Moody</span> helps you track your <span className="textGradient">daily</span> mood!
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-center w-full mx-auto max-w-[600px]">Create your mood record and see how you feel on <span className="font-semibold">every day of every year.</span></p>

      <CallToAction />

      <Quote />

      <Calender demo showJournalPopup={false} />
    </div>
  )
}
