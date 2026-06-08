'use client';
import Grafico from '@/app/components/grafico';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useGED } from '../context/docsGEDContext';
import { FaFilePdf } from 'react-icons/fa';

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function Dashboard() {
    const token = Cookies.get('auth-token')
    const { user } = useAuth()
    const [dadosVereadores, setDadosVereadores] = useState([])
    const { listaDocumentos } = useGED()
    const [docsTipo, setDocsTipo] = useState([])
    const [docsOrgao, setDocsOrgao] = useState([])
    const [docsSituacao, setDocsSituacao] = useState([])
    const isCamara = user?.estabelecimento.config.tipo === "DA CÂMARA MUNICIPAL"
    
    const fetchVereadoresData = async (e) => {
        try {
            const response = await fetch(`${gedUrl}/statistic/docs_vereador/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDadosVereadores(await response.json())
        }
        catch (error) {

        }
    }

    const fetchDocsTipo = async (e) => {
        try {
            const response = await fetch(`${gedUrl}/statistic/docs_tipo/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDocsTipo(await response.json())
        }
        catch (error) {

        }
    }

    const fetchDocsOrgao = async (e) => {
        try {
            const response = await fetch(`${gedUrl}/statistic/docs_orgao/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDocsOrgao(await response.json())
        }
        catch (error) {

        }
    }

    const fetchDocsSituacao = async (e) => {
        try {
            const response = await fetch(`${gedUrl}/statistic/docs_situacao/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDocsSituacao(await response.json())
        }
        catch (error) {

        }
    }

    useEffect(() => {
        if (isCamara) {
            fetchVereadoresData()
        }
    }, [isCamara])

    useEffect(() => {
        fetchDocsTipo()
        fetchDocsOrgao()
        fetchDocsSituacao()
    }, [])

    return (
        <section className="flex flex-col flex-grow gap-6 p-4 md:flex-row overflow-auto bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="w-full md:w-1/2 space-y-4">
                {isCamara ?
                    <div className="bg-white p-6 flex flex-grow flex-col shadow-lg transition-all hover:shadow-xl rounded-xl border-t-4 border-azul_escuro">
                        <h2 className="text-xl font-bold text-azul_escuro mb-4">Documentos por Vereador</h2>
                        {dadosVereadores &&
                            <Grafico
                                data={dadosVereadores
                                    .sort((a, b) => b.acoes - a.acoes)
                                    .slice(0, 10)}
                                fillCor={'#010440'}
                                dataKeyX={'vereador'}
                                dataKeyY={'docs'}
                            />}
                    </div> :
                    <div>
                        <div className="bg-white p-6 h-[396px] flex flex-grow flex-col shadow-lg transition-all hover:shadow-xl rounded-xl border-t-4 border-azul_escuro">
                            <h2 className="text-xl font-bold text-azul_escuro mb-4">Últimos documentos</h2>
                            <ul className="space-y-3">
                                {listaDocumentos.slice(-5).map(doc => (
                                    <li
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <FaFilePdf className="text-red-800 text-xl" />
                                        <span className="text-gray-800 font-medium">{doc.titulo}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>}

                <div className="bg-white p-6 shadow-lg flex flex-grow flex-col transition-all hover:shadow-xl rounded-xl border-t-4 border-laranja_claro">
                    <h2 className="text-xl font-bold text-laranja_claro mb-4">Documentos por Tipo</h2>
                    <Grafico
                        data={docsTipo.sort((a, b) => b.quantidade - a.quantidade).slice(0, 7)}
                        fillCor={'#F27405'}
                        dataKeyX={'tipo'}
                        dataKeyY={'docs'}
                    />
                </div>
            </div>

            <div className='md:w-1/2 w-full space-y-4'>
                <div className="bg-white p-6 flex flex-grow flex-col shadow-lg transition-all hover:shadow-xl rounded-xl border-t-4 border-azul_claro">
                    <h2 className="text-xl font-bold text-azul_claro mb-4">Documentos por Órgão</h2>
                    {docsOrgao &&
                        <Grafico
                            data={docsOrgao
                                .sort((a, b) => b.acoes - a.acoes)
                                .slice(0, 10)}
                            fillCor={'#0097B2'}
                            dataKeyX={'orgao'}
                            dataKeyY={'docs'}
                        />}
                </div>
                <div className="bg-white p-6 flex flex-grow flex-col shadow-lg transition-all hover:shadow-xl rounded-xl border-t-4 border-verde">
                    <h2 className="text-xl font-bold text-verde mb-4">Documentos por Situação</h2>
                    {docsSituacao &&
                        <Grafico
                            data={docsSituacao
                                .sort((a, b) => b.acoes - a.acoes)
                                .slice(0, 10)}
                            fillCor={'#007A45'}
                            dataKeyX={'situacao'}
                            dataKeyY={'docs'}
                        />}
                </div>
            </div>

        </section>
    );
}
