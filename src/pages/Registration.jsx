import React from "react";
import {Link} from 'react-router-dom'

const Registration = () => {
    return(
        <div className="main_section">
            <h1>Регистрация</h1>
            <div className="form">
                <input className="input-reg"  type="text" placeholder="Введите имя" />
                <input className="input-reg"  type="text" placeholder="Введите Логин" />
                <input className="input-reg"  type="password" placeholder="Введите пароль" />
                <input className="input-reg"  type="password" placeholder="Повторите пароль" />
                <p>Уже есть аккаунт?<Link to='/sign'>Войти</Link></p>
            </div>
        </div>
    )
}



export default Registration;