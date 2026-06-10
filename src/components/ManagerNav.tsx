import ManagerNav from "@/components/ManagerNav";

export default function ManagerLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <>
      <ManagerNav />
      <div className="pt-20">{children}</div>
    </>
  );
}
