'use client'
import { usePathname } from "next/navigation"
import Link from 'next/link'
import Logout from "./logout"

export default function MenuLateral({ navItems }) {
    const pathname = usePathname()
    return (
        <nav className="flex flex-col hidden sm:flex min-w-56 bg-azul_escuro shadow-2xl text-white min-h-screen">
            <Link href={'/dashboard'}
                className="flex items-center gap-4 hover:bg-opacity-85 transition-all transition-colors bg-branco_cinza bg-opacity-90 text-azul_escuro w-full min-h-32 px-8 border-b-2 border-azul_escuro border-opacity-90">
                <img src='/logo.png' className="h-14 rounded-full"></img>
                <span className="text-4xl font-semibold">SGM</span>
            </Link>
            <ul className="flex flex-col overflow-y-auto h-[900px] mt-6 gap-4 pl-4 pr-4">
                {navItems.map(item => (
                    <li key={item.href}>
                        <Link className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${pathname === item.href
                                ? 'items-center p-3 bg-laranja_escuro bg-opacity-100 rounded-lg shadow-md transition-transform transform scale-105'
                                : 'text-white bg-opacity-20'
                            }`} href={item.href}>
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="flex pl-6 mt-auto">
                <Logout></Logout>
            </div>
        </nav>
    )
}
