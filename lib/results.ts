export type ResultItem = {
  id: string;
  kind: "image" | "video";
  status: string;
  output_url?: string | null;
  project_subtype?: string;
  created_at?: string;
  model?: string;
};
export function completedResults<T extends ResultItem>(
  jobs: T[],
  filter: "all" | "image" | "video" = "all",
) {
  return jobs.filter(
    (g) =>
      g.status === "completed" &&
      !!g.output_url &&
      (filter === "all" || g.kind === filter),
  );
}
