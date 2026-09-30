import { useState } from "react";
import { db } from "../lib/supabase";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";

function Login(){

    const [email,setEmail] = useState('');
    const [pass,setPass] = useState('');
    const [isSignup,setIsSignup] = useState(false)
    const [sub,setSub] = useState(false)
    const [error,setError] = useState(null)

    const {user} = useAuth()

    if(user) return <Navigate to="/"/>
 

  const handleSub = async(e) => {
    e.preventDefault()
    setError(null);
    setSub(true)

    const {data,error:loginError} = await db.auth.signInWithPassword({
        email:email,
        password:pass
    });

    setSub(false)

    if(loginError){
        setError(loginError.message)
    }
    
  }
    return(
        <>
        <section>
            <form onSubmit={handleSub}>
                <label >email:<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label >password:<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>

                <button type="submit">submit</button>

                {error && <p style={{ color: "red" }}>❌ {error}</p>}

                <p>dont have a acc signup <Link to="/signup">create acc</Link></p>
            </form>
        </section>
        </>
    )
}
export default Login;