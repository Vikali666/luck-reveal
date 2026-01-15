import { useEffect, useState } from "react";
import { onAuthChange, signInAnon } from "../lib/firebase";

export default function useAuth() {
    const [user, setUser] = useState<{ uid: string } | null>(null);
    useEffect(() => {
        const unsub = onAuthChange((u) => {
            if (u) setUser({ uid: u.uid });
            else {
                // iniciar sesión anónimo si no hay usuario
                signInAnon().catch(console.warn);
            }
        });
        return unsub;
    }, []);
    return { user };
}
