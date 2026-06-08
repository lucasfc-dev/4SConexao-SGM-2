import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export const useRouterAsync = () => {
    const [isLoadingRouter, setIsLoadingRouter] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRoute = async (path) => {
        startTransition(() => {
            window.location.href = path
        });
    };

    useEffect(() => {
        if (isPending) {
            return setIsLoadingRouter(true);
        }
        setIsLoadingRouter(false);
    }, [isPending]);

    return { handleRoute, isLoadingRouter };
};
