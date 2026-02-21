import type { Item } from "@/lib/vegas-data";

type RouletteWheelProps = {
  items: Item[];
  isSpinning: boolean;
  spinAngle: number;
};

const colors = ["#7f1d1d", "#991b1b", "#b91c1c", "#dc2626"];

export function RouletteWheel({ items, isSpinning, spinAngle }: RouletteWheelProps) {
  return (
    <div className="relative mx-auto h-80 w-80">
      <div className="absolute inset-0 rounded-full border-8 border-yellow-400 shadow-2xl shadow-yellow-400/30">
        <div
          className="relative h-full w-full rounded-full overflow-hidden"
          style={{
            transform: `rotate(${spinAngle}deg)`,
            transition: isSpinning ? "transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
          }}
        >
          {items.map((item, index) => {
            const angle = (360 / items.length) * index;
            const nextAngle = (360 / items.length) * (index + 1);
            const midAngle = (angle + nextAngle) / 2;

            return (
              <div
                key={item.id}
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${50 + 50 * Math.sin((angle * Math.PI) / 180)}%, ${50 + 50 * Math.cos((nextAngle * Math.PI) / 180)}% ${50 + 50 * Math.sin((nextAngle * Math.PI) / 180)}%)`,
                  backgroundColor: colors[index % colors.length],
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `rotate(${midAngle}deg) translate(0, -90px)`,
                    transformOrigin: "0 0",
                  }}
                >
                  <span className="whitespace-nowrap text-xs font-semibold text-white">
                    ${item.estimatedValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-yellow-400">
        <span className="text-2xl text-black">🎰</span>
      </div>

      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
        <div className="h-0 w-0 border-l-20 border-r-20 border-t-30 border-l-transparent border-r-transparent border-t-yellow-400" />
      </div>
    </div>
  );
}
