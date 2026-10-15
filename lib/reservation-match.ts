type ReservedRequest = {
  kind: string;
  model: string;
  prompt: string;
  source_path: string;
  parent_id?: string | null;
  credits_cost: number;
  price_quote?: {
    apiUsd?: number;
    duration?: number | null;
    resolution?: string;
    version?: string;
  } | null;
};
// A UUID retry can reuse its reservation only for the exact source and priced configuration.
// This prevents a longer input from claiming a shorter concurrent request's reservation.
export function reservationMatches(
  existing: ReservedRequest,
  requested: ReservedRequest,
) {
  return (
    ["kind", "model", "prompt", "source_path", "credits_cost"].every(
      (k) =>
        existing[k as keyof ReservedRequest] ===
        requested[k as keyof ReservedRequest],
    ) &&
    (existing.parent_id || null) === (requested.parent_id || null) &&
    !!existing.price_quote &&
    !!requested.price_quote &&
    ["apiUsd", "duration", "resolution", "version"].every(
      (k) =>
        existing.price_quote![
          k as keyof NonNullable<ReservedRequest["price_quote"]>
        ] ===
        requested.price_quote![
          k as keyof NonNullable<ReservedRequest["price_quote"]>
        ],
    )
  );
}
