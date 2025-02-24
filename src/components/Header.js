import clsx from 'clsx'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'



export default function Header({ title }) {
  const router = useRouter()

  // how to make this mobile responsible ?
  return (
    <nav className="md:flex w-screen flex flex-row gap-8 py-8 bg-gray-950 border-b-[1px] justify-center border-light-grape fixed top-0 z-50 shadow-2xl">
      <Link href="/" className="text-lg text-white font-mono hover:text-grape" >About</Link>
      <Link href="/articles" className="text-white font-mono text-lg hover:text-grape">Articles</Link>
      <Link href="/notes" className="text-white font-mono text-lg hover:text-grape">Notes</Link>
      <Link key={'projects'} href='/projects' className="text-white font-mono text-lg hover:text-grape">Projects</Link>
      <Link href="/contact" className="text-white font-mono text-lg hover:text-grape">Contact</Link>

    </nav>
  )
}
