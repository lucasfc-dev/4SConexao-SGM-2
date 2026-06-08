export const metadata = {
        title: 'SGM - Visualização de DOEM',
        description: 'View doem details',
    }
export default function DocViewLayout({ children }) {

    return (
        <div className="doem-view-layout">
            {children}
        </div>
    )
}
