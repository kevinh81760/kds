"use client";

type AddBurgerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
};

const burgerTypes = [
  "Classic Burger",
  "Cheese Burger",
  "Double Burger",
  "Veggie Burger",
  "Bacon Burger",
] as const;

const ingredients = [
  "Lettuce",
  "Tomatoes",
  "Onions",
  "Pickles",
  "Gochujang",
  "Ketchup",
] as const;

export function AddBurgerModal({ isOpen, onClose, mode = "create" }: AddBurgerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-zinc-900">Build Burger</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close add burger modal"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <section>
            <label
              htmlFor="burger-type"
              className="mb-2 block text-sm font-semibold text-zinc-800"
            >
              Burger Type
            </label>
            <select
              id="burger-type"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
              defaultValue={burgerTypes[0]}
            >
              {burgerTypes.map((burgerType) => (
                <option key={burgerType} value={burgerType}>
                  {burgerType}
                </option>
              ))}
            </select>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-zinc-800">Ingredients</p>
            <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
              {ingredients.map((ingredient) => (
                <label key={ingredient} className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  />
                  {ingredient}
                </label>
              ))}
            </div>
          </section>

          <section>
            <label htmlFor="qr-number" className="mb-2 block text-sm font-semibold text-zinc-800">
              QR #
            </label>
            <input
              id="qr-number"
              type="text"
              placeholder="Enter QR #"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
            />
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
