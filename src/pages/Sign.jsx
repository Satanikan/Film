import React from "react";
import {Link} from 'react-router-dom'

const Sign = () => {
    return(
        <div className="main_section">
            <h1>Вход</h1>
            <div className="form">
                <input className="input-reg" type="text" placeholder="Введите логин"/>
                <input className="input-reg"  type="password" placeholder="Введите пароль" />
                <p>Нет аккаунта? <Link to='/registration'>Зарегистрируйтесь</Link></p>
            </div>
        </div>
    )
}



export default Sign;