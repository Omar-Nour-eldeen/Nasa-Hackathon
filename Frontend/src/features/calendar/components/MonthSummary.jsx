import { decimal, number, sensorLabel } from "../../../lib/format";

export default function MonthSummary({ data, dailyStats }) {
  if (!data) return null;

  const cards = [
    { label: "Total detections", value: number(data.total) },
    { label: "MODIS", value: number(data.modis) },
    { label: "VIIRS", value: number(data.viirs) },
    { label: "Days with detections", value: number(dailyStats?.activeDays) },
    { label: "Mean FRP", value: `${decimal(data.mean_frp)} MW` },
    { label: "Max FRP", value: `${decimal(data.max_frp)} MW` },
    {
      label: "Multi-year median",
      value: data.historical_median !== null ? number(data.historical_median) : "Not available",
    },
    {
      label: "Anomaly",
      value:
        data.anomaly_percentage !== null
          ? `${data.anomaly_percentage > 0 ? "+" : ""}${decimal(data.anomaly_percentage)}%`
          : "Needs 2+ years",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="min-w-0 rounded-xl border border-(--border-color) bg-(--surface) p-3.5 sm:p-4"
        >
          <p className="text-xs text-(--text-secondary)">{card.label}</p>
          <p className="mt-1.5 break-words text-lg font-bold sm:mt-2 sm:text-xl">{card.value}</p>
        </div>
      ))}

      {dailyStats?.perSensor && (
        <div className="col-span-2 rounded-xl border border-(--border-color) bg-(--surface-secondary) p-3.5 sm:p-4 xl:col-span-4">
          <p className="text-xs leading-5 text-(--text-secondary)">
            {Object.entries(dailyStats.perSensor)
              .map(([sensor, days]) => `${sensorLabel(sensor)}: ${days} days`)
              .join(" · ")}
            . FRP is instantaneous radiative power (MW) and is never summed into energy.
          </p>
        </div>
      )}
    </section>
  );
}
