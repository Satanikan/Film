import React from "react";

function Card (props) {
    return(
        <div className="main-card">
            <div className="card">
            <img className="card-image" src={props.url} alt="" />
            <span className="sezon">{props.title}</span>
            </div>
        </div>
    )
}

export default Card;