import clsx from 'clsx'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function MobileMenu() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


    function toggleNavMenu() {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }


    return (
        <nav class="bg-gray-950">
            <div class="mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-8">
                <div class="relative flex h-16 items-center justify-between">
                    <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button type="button" class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset" aria-controls="mobile-menu" aria-expanded="false" onClick={toggleNavMenu}>
                            <span class="absolute -inset-0.5"></span>
                            <span class="sr-only">Open main menu</span>

                            <svg class="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>

                            <svg class="hidden size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class={clsx('absolute bg-gray-950 w-10/12 h-screen transform transition-transform duration-300', { '-translate-x-full': !isMobileMenuOpen, 'translate-x-0': isMobileMenuOpen })} id="mobile-menu">
                <div class="space-y-1 px-2 pt-2 pb-3">

                    <Link href="/" className=" block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white " >About</Link>
                    <Link href="/articles" className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white">Articles</Link>
                    <Link href="/notes" className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white ">Notes</Link>
                    <Link key={'projects'} href='/projects' className=" block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white ">Projects</Link>
                    <Link href="/contact" className=" block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white font-mono ">Contact</Link>

                </div>
            </div>
        </nav>
    )
}