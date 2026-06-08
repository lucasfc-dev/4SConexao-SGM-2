import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "SGM - Login",
  description: "Acesse o SGM com suas credenciais",
  icons: {
    icon: "/favicon.ico",
  },
};

const opensans = Open_Sans({
  weight: ['400', '800'],
  subsets: ['latin']
})

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfill for Promise.withResolvers for Safari compatibility
              if (!Promise.withResolvers) {
                Promise.withResolvers = function() {
                  let resolve, reject;
                  const promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                  });
                  return { promise, resolve, reject };
                };
              }
            `,
          }}
        />
      </head>
      <body className={`${opensans.className} antialiased transition-all duration-300`}>
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}
