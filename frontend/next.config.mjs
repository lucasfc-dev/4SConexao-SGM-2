/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites(){
        return[
            {
                source:'/auth_api/:path*',
                destination:'http://auth_api:8001/:path*'
            },
            {
                source:'/doem_api/:path*',
                destination:'http://doem_api:8000/:path*'
            }
        ]
    }
};

export default nextConfig;