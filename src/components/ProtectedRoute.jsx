import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import Bottomnav from "./bottomnav";


function ProtectedRoute(){
 const {user,loading} = useAuth();

 if(loading) return <p>loading....</p>

 if(!user) return <Navigate to="/login" />

 return(
    <>
    <Outlet/>
    <Bottomnav/>
    </>
 )

}

export default ProtectedRoute;