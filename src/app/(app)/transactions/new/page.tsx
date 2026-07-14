import { TransactionForm } from "@/components/transaction-form";
import { getCategories, getPockets, getProfiles } from "@/lib/data";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, categories, profiles, pockets] = await Promise.all([
    searchParams,
    getCategories(),
    getProfiles(),
    getPockets(),
  ]);

  const initialCategoryId = categories.some((c) => c.id === category) ? category : undefined;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8">
      <TransactionForm
        categories={categories}
        profiles={profiles}
        pockets={pockets}
        initialCategoryId={initialCategoryId}
      />
    </div>
  );
}
