import { db } from "../lib/supabase";
import { useAuth } from "../context/auth";
import { Navigate, useNavigate } from "react-router-dom";

function Profile(){

    const {user,loading} = useAuth()
  

    const handleLogout = async()=> {

        await db.auth.signOut()
       
    }
    return(
        <>
         <section id="profile">
            <h1>profile</h1>

            <h2>name:{user?.user_metadata?.full_name ?? "no name set"}</h2>
            <h2>email: {user?.email}</h2>

            <button onClick={handleLogout}>logout</button>
        </section>
        </>
    )
}
export default Profile;