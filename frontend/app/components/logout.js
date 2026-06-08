'use client'
import { FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function Logout() {
    const {logout} = useAuth()
    return (
        <button onClick={logout} className="flex items-center p-4 text-white text-xl text-left rounded-lg">
            <FaSignOutAlt className="mr-3" />
            <span>Sair</span>
        </button>
    )
}