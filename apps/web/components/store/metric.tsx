export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/6 bg-white/70 p-3.5">
      <span className="block text-black/60 text-xs uppercase tracking-[0.18em]">
        {label}
      </span>
      <strong className="mt-1.5 block text-[22px] tracking-[-0.04em]">
        {value}
      </strong>
    </div>
  );
}
