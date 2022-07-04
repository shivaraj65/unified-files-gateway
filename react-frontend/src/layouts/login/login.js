import React, {useState} from 'react';
import './login.css';
import Wallpaper from '../../assets/images/bg-side-001-clean.jpg'
import axios from 'axios'

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Login=()=>{
    let navigate = useNavigate();

    // states and function for the modal
    const [popupContent,setPopupContent]=useState("")
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    //states to hold the data of the input fields
    const [emailid, setemailid] = useState("")
    const [pass, setpass] = useState("")

    //form submit handler
    const submitHandlerLogin=(event)=>{
        event.preventDefault();    
        // axios 
        const json ={Email: emailid,Password: pass};    
        // console.log(QueryString.stringify(formData));  
        //header configuration for the CORS
        const config  = {
                headers: {
                    'Content-Type': 'application/json',
                }
        }
        axios.post('http://localhost:3001/login', JSON.stringify(json),config)
            .then(function (response) {
                // alert(response.data);                
                if(response.data.name){
                    window.sessionStorage.setItem('userName', response.data.name);
                    window.sessionStorage.setItem('userEmail',response.data.id);
                    window.sessionStorage.setItem('userID',response.data.user_id);
                    navigate("/dashboard/"+response.data.user_id);
                }else{
                    setPopupContent(response.data);
                    handleShow();
                }
            })
            .catch(function (error) {
                alert("error from frontend");
            });
    }
    return(
        <div>
            <div className="container-fluid">
            <div className="row">
                <div className="col-sm-7 px-0 mx-0 d-none d-sm-block">
                    <img src={Wallpaper} alt="login image1" className="login-img"/>
                </div>
                <div className="col-sm-5 login-section-wrapper">
                <div className="brand-wrapper">
                    <h5 className="text-blue font-weight-bold h3 " style={{letterSpacing: "2px"}}>Unified File Gateway</h5>
                </div>
                <div className="login-wrapper my-auto py-1 ">
                    <h1 className="login-title text-success">Log in</h1>
                    <form onSubmit={submitHandlerLogin}>
                    <div className="form-group">
                        <label htmlFor="email" className='text-secondary'>Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            id="email"
                            required 
                            className="form-control text-success font-weight-bold" 
                            placeholder="email@example.com"
                            value={emailid}
                            onChange={(e)=>{setemailid(e.target.value)}}
                            />
                    </div>
                    <div className="form-group mb-4">
                        <label htmlFor="password" className='text-secondary'>Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            required
                            className="form-control text-success font-weight-bold" 
                            placeholder="enter your passsword"
                            value={pass}
                            onChange={(e)=>{setpass(e.target.value)}}
                            />
                    </div>
                    <button 
                        className="btn btn-block login-btnn  font-weight-bold" 
                        type="submit"
                        style={{letterSpacing: "4px"}}
                        >Login</button>
                    </form>                    
                    <p className="login-wrapper-footer-text">Don't have an account? <Link to="/signup" className='pl-2'>Signup here</Link></p>
                </div>
                </div>                
            </div>
            </div>

            {/* popup */}
            <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                centered
                >
                <Modal.Header>
                <Modal.Title>Unified File Gateway</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {popupContent}
                </Modal.Body>
                <Modal.Footer>
                <Button variant="primary" onClick={handleClose}>
                    Close
                </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default React.memo(Login);