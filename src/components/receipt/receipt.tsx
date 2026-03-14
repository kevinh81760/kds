type ReceiptProps = {
  id: string;
  item: string;
  status: string;
  ingredients: readonly string[];
  onEdit?: (id: string) => void;
};

const getStatusDotClassName = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "in progress") {
    return "bg-yellow-400";
  }

  if (normalizedStatus === "queued") {
    return "bg-zinc-400";
  }

  return "bg-green-500";
};

export function Receipt({ id, item, status, ingredients, onEdit }: ReceiptProps) {
  return (
    <article className="grid min-h-70 h-full grid-rows-[auto_auto_1fr] gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          QR #{id}
        </p>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          <span
            className={`h-2.5 w-2.5 rounded-full ${getStatusDotClassName(status)}`}
            aria-hidden="true"
          />
          <span>{status}</span>
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="text-xl font-semibold leading-tight text-zinc-900">{item}</h2>
        <button
          type="button"
          onClick={() => onEdit?.(id)}
          className="justify-self-end rounded-md border border-zinc-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Edit
        </button>
      </div>
      <div className="border-t border-dotted border-zinc-300 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Ingredients
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-zinc-700 marker:text-zinc-500">
          {ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
