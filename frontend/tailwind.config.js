/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        laranja_claro: "#F27405",
        laranja_escuro: "#F24607",
        azul_escuro: "#010440",
        azul_claro: "#0097B2",
        verde: '#007A45',
        branco_cinza:"#F2F2F2"
      },
    },
  },
  plugins: [],
};
