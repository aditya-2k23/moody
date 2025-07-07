import GlowBackground from "./GlowBackground";

export default function Main(props) {
  const { children } = props;
  return (
    <main className="flex-1 flex flex-col p-4 sm:p-8 relative overflow-x-clip">
      <GlowBackground />
      {children}
    </main>
  );
}
