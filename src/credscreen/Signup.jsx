import { useState,useEffect } from "react";
import { db } from "../lib/supabase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";


function Sign(){
 const [name,setName] = useState('');
 const [email,setEmail] = useState('');
 const [pass,setPass] = useState('');
 const [isSignup,setIsSignup] = useState(false)
 const [sub,setSub] = useState(false)
 const [error,setError] = useState(null)

 const {user} = useAuth();

 if(user) return <Navigate to="/"/>

 const handlesub = async(e) => {
    e.preventDefault()
    setSub(true);
    setError(null)

    const {data,error:Signuperror} = await db.auth.signUp({
        email:email,
        password:pass,
        options:{
            data:{
                full_name: name,
            }
        }
    })

    setSub(false)

    if(Signuperror){
        setError(Signuperror.message)
    }
 }


    return(
        <>
        <form onSubmit={handlesub}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" value={pass} onChange={(e) =>setPass( e.target.value)} />
            {error && <p>{error}</p>}
            <button type="submit">{sub ? "loading" : "submit"}</button>
            <p>already have a acc <Link to="/login">login</Link></p>
        </form>
        </>
    )
}

export default Sign;