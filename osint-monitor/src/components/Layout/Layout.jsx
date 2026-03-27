import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}