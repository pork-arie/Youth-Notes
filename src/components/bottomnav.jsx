import {Link} from 'react-router-dom'

function Bottomnav(){
    return(
        <>
         <nav>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/group">Group</Link></li>
                <li><Link to="/notes">Notes</Link></li>
                 <li><Link to="/profile">Profile</Link></li>
            </ul>
         </nav>
        </>
    )
}
export default Bottomnav;