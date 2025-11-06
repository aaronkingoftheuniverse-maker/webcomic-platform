export default function Header() {
  return (
    <header className="border-b p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-magenta-600">My Webcomic</h1>
      <nav>
        <a href="/" className="mr-4 hover:underline">Home</a>
        <a href="/login" className="hover:underline">Login</a>
      </nav>
    </header>
  );
}
