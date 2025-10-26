import DumpCard from "./DumpCard";

const topRowDumps = [
  "Slept through my 8am again 😴",
  "Why is the wifi in the library so bad??",
  "That awkward moment when you wave at someone who wasn't waving at you 👋",
  "Coffee is the only thing keeping me alive rn ☕",
  "Group projects are just me doing everything alone",
  "When the professor says 'this won't be on the exam' 📝",
  "Submitted assignment 2 mins before deadline 💀",
  "Why does the cafeteria food hit different at 2am?",
];

const middleRowDumps = [
  "Saw my crush today and forgot how to walk normally",
  "Changed my major for the 3rd time this semester",
  "That one friend who never studies but gets straight A's 😤",
  "Me pretending to understand the lecture 🤡",
  "Broke but still ordered food delivery",
  "When you realize the exam is tomorrow not next week",
  "Living off ramen and regret",
  "My sleep schedule is a joke at this point",
];

const bottomRowDumps = [
  "Joined a club just for the free pizza 🍕",
  "Changed outfits 5 times before class",
  "That professor who makes everything sound complicated",
  "Napping between classes is my new hobby",
  "Walking to class in the rain without umbrella",
  "When the syllabus says 'attendance is mandatory'",
  "My GPA vs my expectations 📉",
  "Sitting in the wrong classroom for 10 minutes",
];

const FloatingCards = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Single row - scrolling right - clearly visible */}
      <div className="absolute top-16 left-0 w-full opacity-80">
        <div className="flex gap-6 w-max animate-scroll-right">
          {[...topRowDumps, ...topRowDumps].map((msg, i) => (
            <div key={`top-${i}`} className="flex-shrink-0">
              <DumpCard message={msg} delay={0} direction="right" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row - scrolling left - clearly visible */}
      <div className="absolute bottom-16 left-0 w-full opacity-80">
        <div className="flex gap-6 w-max animate-scroll-left">
          {[...bottomRowDumps, ...bottomRowDumps].map((msg, i) => (
            <div key={`bot-${i}`} className="flex-shrink-0">
              <DumpCard message={msg} delay={0} direction="right" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingCards;

