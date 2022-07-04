import React, {useState} from 'react';
import './landing.css';
import Wallpaper from '../../assets/images/bg-side-001-clean.jpg'
import axios from 'axios'
import { useNavigate } from "react-router-dom";

const Landing=()=>{
    let navigate = useNavigate();   
    return(
        <div>
            <div className="container-fluid">
            <div className="row">
                <div className="col-sm-7 px-0 mx-0 d-none d-sm-block">
                    <img src={Wallpaper} alt="login image1" className="login-img"/>
                </div>
                <div className="col-sm-5 login-section-wrapper">
                <div className="brand-wrapper">
                    <h5 className="text-blue font-weight-bold h3" style={{letterSpacing: "2px"}}>Unified File Gateway</h5>
                </div>
                <div className="login-wrapper my-auto py-1">
                    <button 
                        className='btn btn-success py-2 btn-block font-weight-bold'
                        onClick={()=>{
                            navigate("/signup");
                        }}
                        >Create User</button>
                    <hr/>
                    <button 
                        className='btn btn-dark py-2 btn-block font-weight-bold'
                        onClick={()=>{
                            navigate("/login");
                        }}
                        >Login</button>                       
                </div>
                </div>                
            </div>
            </div>

           
        </div>
    )
}

export default React.memo(Landing);