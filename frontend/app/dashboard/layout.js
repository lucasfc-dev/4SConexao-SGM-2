import { FuncProvider } from "../context/funcContext";

export const generateMetadata = () => ({
  title: 'SGM - Home',
  description: 'Dashboard de Módulos do SGM.'
});

export default function DashboardLayout({ children }) {
  return (
    <FuncProvider>
      {children}
    </FuncProvider>
  );
}
