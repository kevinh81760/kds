"use client";

import { useEffect, useState } from "react";

type BurgerFormValues = {
  id: string;
  item: string;
  ingredients: string[];
};

type AddBurgerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  initialValues?: BurgerFormValues;
  onCreate?: (values: BurgerFormValues) => void | Promise<void>;
  onUpdate?: (values: BurgerFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
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
const availableIngredients = new Set<string>(ingredients);

export function AddBurgerModal({
  isOpen,
  onClose,
  mode = "create",
  initialValues,
  onCreate,
  onUpdate,
  onDelete,
}: AddBurgerModalProps) {
  const [burgerType, setBurgerType] = useState<string>(burgerTypes[0]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([...ingredients]);
  const [qrNumber, setQrNumber] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialValues) {
      setBurgerType(initialValues.item);
      setSelectedIngredients(
        initialValues.ingredients.filter((ingredient) => availableIngredients.has(ingredient)),
      );
      setQrNumber(initialValues.id);
      return;
    }

    setBurgerType(burgerTypes[0]);
    setSelectedIngredients([...ingredients]);
    setQrNumber("");
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((currentIngredients) =>
      currentIngredients.includes(ingredient)
        ? currentIngredients.filter((item) => item !== ingredient)
        : [...currentIngredients, ingredient],
    );
  };

  const currentValues: BurgerFormValues = {
    id: qrNumber.trim(),
    item: burgerType,
    ingredients: selectedIngredients,
  };

  const handlePrimaryAction = async () => {
    try {
      if (mode === "edit") {
        await onUpdate?.(currentValues);
      } else {
        await onCreate?.(currentValues);
      }
      onClose();
    } catch (error) {
      console.error("Save burger failed", error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete?.();
      onClose();
    } catch (error) {
      console.error("Delete burger failed", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-zinc-900">
            {mode === "edit" ? "Edit Burger" : "Build Burger"}
          </h2>
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
              value={burgerType}
              onChange={(event) => setBurgerType(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
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
                    checked={selectedIngredients.includes(ingredient)}
                    onChange={() => toggleIngredient(ingredient)}
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
              value={qrNumber}
              onChange={(event) => setQrNumber(event.target.value)}
              placeholder="Enter QR #"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
            />
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
