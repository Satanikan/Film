import React from "react";
import Walking from '../Images/logo_walking.webp'
import Data from "../Components/Data";
import Card from "../Card";



const Home = () => {
    const dataImp = Data.map((data) =>{
        return(
          <Card 
          key = {data.key}
          title={data.title}
          url ={data.url}
          info ={data.info}
          />
        )
    })
    
    return(
        <div className="wrapper-home">
            <h1 className="home_title">Ходячие Мертвецы</h1>
       <p className="title_p"><strong>Ходячие мертвецы</strong> — американский сериал в жанре постапокалипсиса,с элементами триллера и ужасов. Создателем, шоураннером и продюсером проекта выступил Фрэнк Дарабонт, который адаптировал для телевидения серию одноименных комиксов Роберта Киркмана, Тони Мура и Чарли Адларда.На экраны уже вышло 10 сезонов, и на этом история не заканчивается: 11-й сезон «Ходячих мертвецов» будет показан в 2021 году. Драма<br></br> собрала большое фан-сообщество и не раз становилась номинантом таких престижных премий, как «Золотой глобус», «Сатурн», «Спутник», «Гильдия сценаристов Америки» и др.</p>
       <hr className="hr" />
         <div className="section-film">
            <div className="Cards">
            {dataImp}
            </div>
            <div>
                <p className="main-sezon">Все Сезоны</p>
            </div>
            <hr className="hr" />
         </div>
        </div>
      
    )
}

export default Home;