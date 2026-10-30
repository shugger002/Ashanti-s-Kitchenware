import { CheckoutShell } from "@/components/store/checkout-shell";
import { MoolreOtpForm } from "@/app/(store)/checkout/moolre/form";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Confirm Moolre payment",
  description: "Enter the SMS code Moolre sent so we can send the mobile-money prompt.",
  path: "/checkout/moolre",
});

export default async function MoolreOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; channel?: string }>;
}) {
  const { ref, channel } = await searchParams;
  const momoChannel = channel === "6" || channel === "7" ? channel : "13";
  return (
    <CheckoutShell>
      <div className="mx-auto max-w-xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl">Confirm your number</h1>
        <p className="mt-3 text-sm text-muted">
          Moolre sent an SMS code for a first-time payer. Enter it here. We still do not mark the order paid until
          Moolre confirms the mobile-money debit.
        </p>
        {ref ? (
          <MoolreOtpForm publicRef={ref} momoChannel={momoChannel} />
        ) : (
          <p className="mt-6 text-sm text-muted">Missing order reference. Return to checkout and try again.</p>
        )}
      </div>
    </CheckoutShell>
  );
}
