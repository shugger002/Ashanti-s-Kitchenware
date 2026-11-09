import { CheckoutPaper, CheckoutShell } from "@/components/store/checkout-shell";
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
      <CheckoutPaper>
        <h1 className="font-sans text-3xl font-bold uppercase tracking-[0.12em]">Confirm your number</h1>
        <p className="mt-3 text-pretty text-sm text-muted">
          Moolre sent an SMS code for a first-time payer. Enter it here. We still do not mark the order paid until
          Moolre confirms the mobile-money debit.
        </p>
        {ref ? (
          <MoolreOtpForm publicRef={ref} momoChannel={momoChannel} />
        ) : (
          <p className="mt-6 text-sm text-muted">Missing order reference. Return to checkout and try again.</p>
        )}
      </CheckoutPaper>
    </CheckoutShell>
  );
}
