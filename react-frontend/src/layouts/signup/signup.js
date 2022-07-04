import React,{useState} from 'react';
import axios from 'axios';
import './signup.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";

const Signup=()=>{
    let navigate = useNavigate();
    const [email,setemail]=useState("");
    const [name,setname]=useState("");
    const [password,setpassword]=useState("");
    const [passwordTest, setpasswordTest] = useState(null)

    const [popupContent,setPopupContent]=useState("")

    // states and function for the modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

     const passwordTestfunc=(data)=>{
        if(!data.match(/[a-z]/g)){
            setpasswordTest(false)
          document.getElementById("password-validation-text").innerHTML = "you must use a small letter";         
        }else if(!data.match(/[A-Z]/g)){
            setpasswordTest(false)
          document.getElementById("password-validation-text").innerHTML = "you must use a capital letter";         
        } else if(!data.match(/[0-9]/g)){
            setpasswordTest(false)
          document.getElementById("password-validation-text").innerHTML = "you must use a number";         
        }else if(!(data.length >= 8)){
            setpasswordTest(false)
          document.getElementById("password-validation-text").innerHTML = "minimum password lenght must be 8";         
        }else{
            setpasswordTest(true)    
          document.getElementById("password-validation-text").innerHTML = ""; 
        }
      }
    
    const submitHandlerRegister=(event)=>{
        event.preventDefault();
        if(passwordTest ===false){           
                alert("Kindly enter a password as per our Password Policy.");
        }else{            
            const json ={Email: email,Name:name,Password: password};                            
            const config  = {
                    headers: {
                        'Content-Type': 'application/json',
                    }
            }            
            axios.post('http://localhost:3001/signup', JSON.stringify(json),config)
                .then(function (response) {                    
                    setPopupContent(response.data);
                    handleShow();
                })
                .catch(function (error) {                    
                    alert("error from frontend");
                });
        }
    }

    return(
        <div className="register">
            <div className=" form-signin-1 card shadow m-automt-5 px-3 py-4 width-register custom-background-12" >
                <div className="text-center ">
                    <h3 className="font-weight-bold h4 text-light pb-3" style={{opacity:"1"}}>Let's create a user account</h3>                                               
                    <hr className='divider'/>                    
                </div>
                   
                <form onSubmit={submitHandlerRegister} className="mt-3">                  
                    <div className="form-group mb-4">
                        <label className="text-dark font-italic font-weight-bold">Email address</label>
                        <input 
                            type="email" 
                            value={email}
                            className="form-control text-info font-weight-bolder" 
                            onChange={(e)=>{
                                setemail(e.target.value);
                            }}
                            required 
                            autoFocus/>                         
                    </div>
                    <div className="form-group my-4">
                        <label className="text-dark font-italic font-weight-bold">Name</label>
                        <input 
                            type="text" 
                            value={name}
                            className="form-control text-info font-weight-bolder"
                            onChange={(e)=>{
                                setname(e.target.value);
                            }} 
                            required/>
                    </div>                    
                    <div className="form-group pb-3">
                        <label className="text-dark font-italic font-weight-bolder">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            className="form-control text-info font-weight-bold" 
                            onChange={(e)=>{
                                setpassword(e.target.value)
                                passwordTestfunc(e.target.value);
                            }}
                            required/>
                        <p id="password-validation-text" className="text-danger text-center pt-1"></p>
                    </div>                   
                    <div className='row mb-2'>
                        <div className='col-md-6'>
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary btn-block mt-2 mb-2 font-weight-bold "
                                onClick={()=>{navigate("/login")}}
                                >Login</button>
                        </div>
                        <div className='col-md-6'>
                            <button type="submit" className="btn btn-info btn-block mt-2 mb-2 font-weight-bold font-style-01" style={{letterSpacing:"2px"}}>SUBMIT</button>
                        </div>
                    </div>                    
                </form>
            </div>        
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
                    <Button 
                        variant="info" 
                        onClick={()=>{
                            handleClose();
                            navigate("/");
                        }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}
export default React.memo(Signup);