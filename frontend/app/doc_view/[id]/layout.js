export const metadata = {
        title: 'SGM - Visualização de Documento',
        description: 'View document details',
    }
export default function DocViewLayout({ children }) {

    return (
        <div className="doc-view-layout">
            {children}
        </div>
    )
}
