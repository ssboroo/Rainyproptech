import Studio from "@/components/studio-app";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Studio />
      {children}
    </>
  );
}
