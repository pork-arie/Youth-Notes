import Bottomnav from "./components/bottomnav";
import Group from "./screens/group";
import Home from "./screens/home";
import Notes from "./screens/notes";
import Profile from "./screens/profile";
import { BrowserRouter,Route,Routes } from "react-router-dom";


function App() {
  
  return (
    <>
    <BrowserRouter>
     <Routes>
       <Route path="/" element={<Home/>}/>
       <Route path="/group" element={<Group/>}/>
       <Route path="/notes" element={<Notes/>}/>
       <Route path="/profile" element={<Profile/>}/>
       
     </Routes>
     <Bottomnav/>
    </BrowserRouter>

    </>
  )
}
 
export default App;
