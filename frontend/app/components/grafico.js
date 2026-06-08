import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function Grafico({ data, fillCor, dataKeyX, dataKeyY}) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" barSize={30}>
                <XAxis type="number" tick={{ fill: '#444', fontSize: 14 }} allowDecimals={false} />
                <YAxis dataKey={dataKeyX} type="category" width={150} tick={{ fill: '#222', fontSize: 14 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.07)' }} />
                <Bar dataKey={dataKeyY} fill={fillCor}>
                    <LabelList dataKey={dataKeyY} position="right" fill={fillCor} fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}