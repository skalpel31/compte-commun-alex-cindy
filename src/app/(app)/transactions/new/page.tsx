import { TransactionForm } from "@/components/transaction-form";
import { getCategories, getProfiles } from "@/lib/data";

export default async function NewTransactionPage() {
  const [categories, profiles] = await Promise.all([getCategories(), getProfiles()]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8">
      <TransactionForm categories={categories} profiles={profiles} />
    </div>
  );
}
