import Bottomnav from "./components/bottomnav";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/auth";
import Login from "./credscreen/login";
import Sign from "./credscreen/Signup";
import Group from "./screens/group";
import Home from "./screens/home";
import Notes from "./screens/notes";
import Profile from "./screens/profile";
import { BrowserRouter,Route,Routes } from "react-router-dom";


function App() {
  
  return (
    <>
    <AuthProvider>
    <BrowserRouter>
    
     <Routes>
       <Route element={<ProtectedRoute/>}>
       <Route path="/" element={<Home/>}/>
       <Route path="/group" element={<Group/>}/>
       <Route path="/notes" element={<Notes/>}/>
       <Route path="/profile" element={<Profile/>}/>
       </Route>

       <Route path="/login" element={<Login />} />
       <Route path="/signup" element={<Sign />} />
       
     </Routes>
     
    </BrowserRouter>
    </AuthProvider>

    </>
  )
}
 
export default App;
