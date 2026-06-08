export default function PaginacaoDOEM({ totalItems, itemsPerPage, currentPage, setCurrentPage }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (

    <div className="flex justify-between items-center mb-4">
      <button
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {currentPage - 1}
      </button>
      <span className="text-lg font-semibold">
        Página {currentPage} de {totalPages}
      </span>
      <button
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        {currentPage + 1}
      </button>
    </div>
  )
}
