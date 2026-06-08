'use client'
import { useState, useEffect } from "react"
import { FaCalendar, FaChevronRight, FaSpinner } from "react-icons/fa"
import { getDiarios } from '../page'
import { useParams } from "next/navigation";
export function getServerTime() {
  return {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    currentDate: new Date().getDate()
  };
}

export async function getDiariosByMonth(id, year, month) {
     const lastDay = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');
    const filtros = {
      is_published: true,
      data_pub__gte: `${year}-${monthStr}-01`,
      data_pub__lte: `${year}-${monthStr}-${lastDay}`,
      count: false,
    };
    return getDiarios({ filtros, id });
}

export default function Calendar({ diarios = [], onDiarioSelect, selectedDiario }) {
    const id = useParams().id
    const serverTime = getServerTime()
    const [selectedMonth, setSelectedMonth] = useState(serverTime.currentMonth)
    const [selectedYear, setSelectedYear] = useState(serverTime.currentYear)
    const [selectedDay, setSelectedDay] = useState(null)
    const [currentDiarios, setCurrentDiarios] = useState(diarios)
    const [loading, setLoading] = useState(false)
    
    const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]
    
    const baseYear = serverTime.currentYear
    const anos = Array.from({ length: 12 }, (_, i) => baseYear + 1 - i)
    
    useEffect(() => {
        if (selectedDiario?.published_at) {
            const [year, month, day] = selectedDiario.published_at.split('-').map(Number)
            setSelectedMonth(month - 1)
            setSelectedYear(year)
            setSelectedDay(day)
        }
    }, [selectedDiario])

    const loadDiariosByMonth = async (year, month) => {
        setLoading(true)
        try {
            const monthNumber = month + 1 
            const diariosData = await getDiariosByMonth(id, year, monthNumber)
            setCurrentDiarios(diariosData)
        } catch (error) {
            console.error('Erro ao carregar diários do mês:', error)
            setCurrentDiarios([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        
        if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
            loadDiariosByMonth(selectedYear, selectedMonth)
        }
    }, [selectedMonth, selectedYear])

    useEffect(() => {
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        
        if (selectedMonth === currentMonth && selectedYear === currentYear) {
            setCurrentDiarios(diarios)
        }
    }, [diarios, selectedMonth, selectedYear])

    
    const isDateInSelectedMonth = (dateStr) => {
        const [year, month] = dateStr.split('-').map(Number)
        return (month - 1) === selectedMonth && year === selectedYear
    }
    
    const diariosDoMes = currentDiarios.filter(diario => {
        return isDateInSelectedMonth(diario.published_at)
    })
    

    const diasComPublicacao = [...new Set(
        diariosDoMes.map(diario => parseInt(diario.published_at.split('-')[2]))
    )].sort((a, b) => a - b)


    const getDiariosDodia = (dia) => {
        return diariosDoMes.filter(diario => 
            parseInt(diario.published_at.split('-')[2]) === dia
        )
    }

    const generateCalendar = () => {
        const firstDay = new Date(selectedYear, selectedMonth, 1)
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())

        const calendar = []
        const current = new Date(startDate)

        while (current <= lastDay || current.getDay() !== 0) {
            calendar.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }

        return calendar
    }

    return (

<div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden lg:sticky lg:top-4">
                <div className="bg-gradient-to-r from-azul_escuro to-azul_escuro/90 text-white p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                            <FaCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Calendário</span>
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <select
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(parseInt(e.target.value))
                                setSelectedDay(null)
                            }}
                            disabled={loading}
                            className="text-azul_escuro text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border-white border-1 focus:ring-2 focus:ring-white focus:outline-none flex-1 font-medium disabled:opacity-50"
                        >
                            {meses.map((mes, index) => (
                                <option key={mes} className="text-azul_escuro" value={index}>
                                    {mes.charAt(0).toUpperCase() + mes.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(parseInt(e.target.value))
                                setSelectedDay(null)
                            }}
                            disabled={loading}
                            className="text-azul_escuro text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none font-medium disabled:opacity-50 sm:w-auto w-full"
                        >
                            {anos.map(ano => (
                                <option className="text-azul_escuro" key={ano} value={ano}>{ano}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-3 sm:p-4">
                    {loading && (
                        <div className="flex items-center justify-center py-3 sm:py-4 mb-3 sm:mb-4">
                            <FaSpinner className="w-4 h-4 sm:w-5 sm:h-5 text-azul_escuro animate-spin mr-2" />
                            <span className="text-xs sm:text-sm text-gray-600">Carregando diários...</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-3">
                        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, index) => (
                            <div key={index} className="text-center text-xs font-bold text-gray-500 py-1 sm:py-2">
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div className={`grid grid-cols-7 gap-1 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                        {generateCalendar().map((date, index) => {
                            const isCurrentMonth = date.getMonth() === selectedMonth
                            const hasPublication = diasComPublicacao.includes(date.getDate()) && isCurrentMonth
                            const isToday = date.toDateString() === new Date().toDateString()
                            const isSelected = selectedDay === date.getDate() && isCurrentMonth

                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        if (hasPublication && !loading) {
                                            const clickedDay = date.getDate()
                                            if (selectedDay === clickedDay) {
                                                setSelectedDay(null)
                                            } else {
                                                setSelectedDay(clickedDay)
                                            }
                                        }
                                    }}
                                    className={`
                                                text-center py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer transition-all duration-200 rounded-lg relative min-h-[28px] sm:min-h-[32px] flex items-center justify-center
                                                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}
                                                ${hasPublication ? 'bg-gradient-to-br from-laranja_escuro to-laranja_escuro/90 text-white font-bold hover:shadow-md transform hover:scale-105' : ''}
                                                ${isToday && !hasPublication ? 'bg-gradient-to-br from-azul_escuro to-azul_escuro/90 text-white font-semibold' : ''}
                                                ${isSelected ? 'ring-2 ring-azul_escuro ring-offset-1 sm:ring-offset-2 shadow-lg' : ''}
                                            `}
                                >
                                    {date.getDate()}
                                    {hasPublication && (
                                        <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-lg flex items-center justify-center">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-laranja_escuro rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>


                    {selectedDay && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fadeIn">
                            <h5 className="text-xs sm:text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span>Publicações do dia {selectedDay}:</span>
                            </h5>
                            <div className="max-h-48 sm:max-h-60 overflow-y-auto w-full break-words space-y-2 p-1">
                                {getDiariosDodia(selectedDay).map((diario, index) => {
                                    const isCurrentlySelected = selectedDiario?.id === diario.id
                                    return (
                                        <div 
                                            key={index} 
                                            onClick={() => onDiarioSelect?.(diario)}
                                            className={`text-xs p-2 rounded border transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
                                                isCurrentlySelected 
                                                    ? 'bg-blue-100 border-blue-300 shadow-md ring-2 ring-blue-200' 
                                                    : 'bg-white border-blue-100 hover:bg-blue-50'
                                            }`}
                                        >
                                            <p className="font-medium text-blue-900 line-clamp-2 text-xs sm:text-xs leading-tight">
                                                {diario.titulo}
                                            </p>
                                            <p className="text-blue-600 mt-1 text-xs">
                                                {diario.published_at.split('-').reverse().join('/')}
                                            </p>
                                            <p className={`text-xs mt-1 ${isCurrentlySelected ? 'text-blue-700 font-medium' : 'text-blue-500'}`}>
                                                {isCurrentlySelected ? 'Visualizando' : 'Clique para visualizar'}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    )
}