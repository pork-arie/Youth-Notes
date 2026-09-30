import { createContext,useState,useEffect, useContext } from "react";
import {db} from "../lib/supabase"

const AuthContext = createContext();

export function AuthProvider({children}){
   const [user,setUser] = useState(null);
   const [loading,setLoading] = useState(true);

   useEffect(() => {
    const getInitSession = async() => {
       const {data:{session}} = await db.auth.getSession();
       setUser(session?.user ?? null);
       setLoading(false)

    }
     getInitSession();

     const {data:{subscription}} = db.auth.onAuthStateChange(
        (_event,session) => {
             setUser(session?.user ?? null);
             setLoading(false)
        }
     )
     return () => {
        subscription.unsubscribe();
     }

   },[])
  



    return(
        <AuthContext.Provider value={{user,loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("vuseAuth must be used within an AuthProvider")

    }
    return context;
}