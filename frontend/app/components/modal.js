import { CgClose } from "react-icons/cg";

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function ModalBase({ isOpen, onClose, title, children, size }) {
  if (!isOpen) return null;
  const maxW = sizeMap[size] ?? 'max-w-[70%]'
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
      <div onClick={(e) => e.stopPropagation()} className={`bg-branco_cinza rounded-xl shadow-2xl w-full ${maxW} max-h-[80%] flex flex-col overflow-hidden`}>
        <header className="flex items-center justify-between bg-azul_escuro text-white px-4 py-2 rounded-t-lg">
          <h2 className="text-lg font-semibold">{title}</h2>
          <CgClose
            onClick={onClose}
            size={32}
            className="cursor-pointer text-white font-bold rounded-full p-1 shadow-md hover:bg-red-100 hover:text-red-800 transition"
          />
        </header>
        {children}
      </div>
    </div>
  );
}
