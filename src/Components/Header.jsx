
import Home from "../pages/Home";
import {Route, Routes, NavLink, Link} from 'react-router-dom'
import Error from "../pages/Error";
import Serials from "../pages/Serials";
import Anime from "../pages/Anime";
import Films from "../pages/Films";
import BestTitle from "../pages/BestTitle";
import Registration from "../pages/Registration";
import Sign from "../pages/Sign";


const  Header = () => {
  
   return(

      <>
     <div className="wrapper">
        <header className="main-header">
        <h1 className="title">
            <a className="title-text" href="#">Walking Dead</a>
            </h1>
            <input className="search_box" placeholder="Поиск по сайту..." />
            <ul className="ul">
               <li className="ul-li"><NavLink to="/home" className="NavLinks">Главная</NavLink></li>
               <li className="ul-li"><NavLink to="/best" className="NavLinks">Лучшее</NavLink></li>
               <li className="ul-li"><NavLink to="/films" className="NavLinks">Фильмы</NavLink></li>
               <li className="ul-li"><NavLink to="/anime" className="NavLinks">Аниме</NavLink></li>
               <li className="ul-li"><NavLink to="/serials" className="NavLinks">Сериалы</NavLink></li>
               <li className="ul-li"><NavLink to="/error" className="NavLinks">Сообщить об ошибке</NavLink></li>
            </ul>
            <div className="signin-link">
               <button className="btn-sign"><Link className="btn-link" to="/registration">Регистрация</Link></button>
               <button className="btn-sign"><Link className="btn-link" to="/sign">Вход</Link></button>
            </div>
        </header>
     </div>
   

   <Routes>
     <Route path="/home" element={<Home/>} />
     <Route path="/best" element={<BestTitle/>} />
     <Route path="/films" element={<Films/>} />
     <Route path="/anime" element={<Anime/>} />
     <Route path="/serials" element={<Serials/>} />
     <Route path="/error" element={<Error/>} />
     <Route path="/registration" element={<Registration/>} />
     <Route path="/sign" element={<Sign/>} />
   </Routes>
   </>
  )
}



export default Header;