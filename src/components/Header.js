export default function Header({ title }) {
  return <nav className="w-screen flex flex-row gap-8 py-8 bg-gray-950 border-b-[1px] justify-center border-light-grape fixed top-0 z-50 shadow-2xl">
      <a href="/" className="text-lg text-white font-mono hover:text-grape">About</a>
      <a href="/" className="text-white font-mono text-lg hover:text-grape">Notes</a>
      <a href="/" className="text-white font-mono text-lg hover:text-grape">Projects</a>
      <a href="/" className="text-white font-mono text-lg hover:text-grape">Articles</a>
      <a href="/" className="text-white font-mono text-lg hover:text-grape">Contact</a>
  </nav>
}
