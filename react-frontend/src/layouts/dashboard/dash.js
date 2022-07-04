import React,{useState,useEffect} from 'react';
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import ReactFileReader from 'react-file-reader';
import { useNavigate } from "react-router-dom";
import {Link} from 'react-router-dom';

const Dash = () => {
    const fileFormats=[".csv",".pdm",".pdf",".jpg",".png",".xls",".xlsx",".ppt",".pptx",".txt"];
  
    const [file, setFile] = useState("")
    const [file64,setFile64] = useState("")
    const [storage,setStorage] = useState("")

    const [data, setdata] = useState(null)

    //states for the share file form
    const [sEmail,setSEmail] = useState("");
    const [sProvider,setSProvider] = useState("");
    const [sFileName,setSFileName] = useState("");
    const [sActualFileName,setSActualFileName] = useState("");
    const [sDate,setSDate] = useState("");
    const [sTime,setSTime] = useState("");

    //states for the sharedFile list
    const [sharedFileData, setSharedFileData] = useState(null)
    const [shareReceived,setShareReceived] = useState(null)

    // states and function for the modal-0
    const [popupContent,setPopupContent]=useState("")
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // states and function for the modal-1
    const [show1, setShow1] = useState(false);
    const [accessType,setAccessType] = useState("");
    const handleClose1 = () => setShow1(false);
    const handleShow1 = () => setShow1(true);

    // states and function for the modal-2
    const [uploadFileID,setUploadFileID] = useState("");
    const [updateTimestamp,setUpdateTimestamp] = useState("");
    const [show2, setShow2] = useState(false);
    const handleClose2 = () => setShow2(false);
    const handleShow2 = () => setShow2(true);    

    //states for the auto update triggers
    const [myFilesTrigger,setMyFilesTrigger ] = useState(false);
    const MFT =()=> setMyFilesTrigger(!myFilesTrigger);
    const [accshrTrigger,setAccshrTrigger] = useState(false);
    const AST =()=> setAccshrTrigger(!accshrTrigger);

    const handleFiles = files => {
        setFile64(files.base64)
        setFile(files.fileList[0])
    }

    useEffect(()=>{     
        //API CALL for populating the shared files by the user          
        const json1 = {id:window.sessionStorage.getItem("userEmail"),filterExpression:"sharedFrom"};  
        const config  = {
                headers: {
                   'Content-Type': 'application/json',
                }}
        axios.post('http://localhost:3001/sharedList', 
        JSON.stringify(json1),config)
        .then(function (response) {
            setSharedFileData(response.data);            
        })
        .catch(function (error) {           
            console.log("error")
        });        
    },[accshrTrigger])

    useEffect(()=>{
         //API CALL for populating the access received files by the user
         const json2 = {id:window.sessionStorage.getItem("userEmail"),filterExpression:"sharedTo"};
         const config  = {headers: {'Content-Type': 'application/json'}}  
         axios.post('http://localhost:3001/sharedList', 
         JSON.stringify(json2),config)
         .then(function (response) {
             setShareReceived(response.data);             
         })
         .catch(function (error) {           
             console.log("error")
         });   
    },[])

    useEffect(()=>{
        //API CALL for populating the uploaded files by the user
        const json3 ={id:window.sessionStorage.getItem("userID")};     
        const config  = {headers: {'Content-Type': 'application/json'}}     
        axios.post('http://localhost:3001/view', JSON.stringify(json3),config)
            .then(function (response) {                           
                    if(response.data=="failed to load data"){
                        setPopupContent(response.data);
                        handleShow();
                    }else{
                        setdata(response.data.Items);
                    }                                    
            })
            .catch(function (error) {
                alert("error loading the data");
            });
    },[myFilesTrigger])

    const upload=(event)=>{
        event.preventDefault();       
        const id=window.sessionStorage.getItem("userID");
        const email=window.sessionStorage.getItem("userEmail");
        const json ={email:email,id:id,file:file64,fileData:file,provider:storage,type:file.type,fileName:file.name};                    
        const config  = {
                headers: {'Content-Type': 'application/json'}
        }
        axios.post('http://localhost:3001/upload', JSON.stringify(json),config)
            .then(function (response) {              
                    if(response.data=="uploaded"){
                        setPopupContent(response.data);
                        handleShow();       
                        MFT();                
                    }else{
                        setPopupContent(response.data);
                        handleShow();
                    }                                    
            })
            .catch(function (error) {                
                alert("error");
            });
    };

    const download=(provider,id,fileName,timestamp,access)=>{       
        let json;
        if(access==="owner"){
            json ={fileName:id,provider:provider,accessType:access};
        }else{
            json ={fileName:id,provider:provider,timestamp:timestamp,accessType:access};
        }                    
        const config  = {
                headers: {'Content-Type': 'application/json'},
                responseType: 'arraybuffer'
        }
        axios.post('http://localhost:3001/download', JSON.stringify(json),config)
        .then(function (response) { 
            if(response.status==405){
                setPopupContent("Your Access to the file Expired!");
                handleShow();                        
            } else {                                        
                const type = response.headers['content-type']
                const blob = new Blob([response.data], { type: type, encoding: 'UTF-8' })
                const link = document.createElement('a')
                link.href = window.URL.createObjectURL(blob)
                link.download = fileName
                link.click()
            }                                                                    
        })
        .catch(function (error) {
            if(error.response.status==405){
                setPopupContent("Your Access to the file Expired!");
                handleShow();  
            }else{
                alert("error loading the data");
            }  
        });       
    }

    const deleteFile=(provider,id,fileName)=>{                
            const json ={fileName:id,provider:provider};
            const config  = {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
            axios.post('http://localhost:3001/delete', JSON.stringify(json),config)
            .then(function (response) { 
                if(response.data=="deleted"){
                    setPopupContent(fileName +" is "+response.data);
                    handleShow(); 
                    MFT();
                    AST();
                } else{
                    setPopupContent(response.data);
                    handleShow();
                }                                        
            })
            .catch(function (error) {
                alert("error from frontend");
            });                
    };

    const share=(event)=>{
        event.preventDefault(); 
        handleClose1();      
        const id=window.sessionStorage.getItem("userID");
        const email=window.sessionStorage.getItem("userEmail");        
        const time = new Date();
        const offset=Date(1000 + time.getTime()).split(" ")[5];
        const json ={shareFrom:email,shareTo:sEmail,provider:sProvider,actualFileName:sActualFileName,storedFileName:sFileName,sharedTillDate:sDate,sharedTillTime:sTime,timezone:offset};
        const config  = {
                headers: {
                    'Content-Type': 'application/json',
                }
        }        
        axios.post('http://localhost:3001/share', JSON.stringify(json),config)
            .then(function (response) {              
                    if(response.data=="success"){
                        setPopupContent(response.data);
                        handleShow();   
                        setSFileName("");
                        setSActualFileName("");
                        setSProvider("");
                        setSEmail("");
                        setSDate("");
                        setSTime("");
                        AST();
                    }else{
                        setPopupContent(response.data);
                        handleShow();
                    }                                    
            })
            .catch(function (error) {                
                alert("error");
            });
    };

    const revoke=(id)=>{
        const json ={id:id};    
        const config  = {
                headers: { 'Content-Type': 'application/json' }
        }
        axios.post('http://localhost:3001/revoke', JSON.stringify(json),config)
        .then(function (response) { 
            if(response.data=="success"){
                setPopupContent("Access is removed successfully");
                handleShow(); 
                AST();
            } else{
                setPopupContent(response.data);
                handleShow();
            }                                    
        })
        .catch(function (error) {
            alert("error");
        });  
    }

    const update=(event)=>{
        event.preventDefault();  
        handleClose2();       
        const email=window.sessionStorage.getItem("userEmail");
        let json;        
        if(accessType=="owner"){
            json ={file:file64,type:file.type,email:email,provider:storage,storedFileName:uploadFileID,accessType:accessType};
        }else{
            json ={file:file64,type:file.type,email:email,provider:storage,storedFileName:uploadFileID,accessType:accessType,timestamp:updateTimestamp};
        }        
        const config  = {
                headers: { 'Content-Type': 'application/json' }
        }
        axios.post('http://localhost:3001/update', JSON.stringify(json),config)
            .then(function (response) {              
                    if(response.data=="uploaded"){
                        setPopupContent(response.data);
                        handleShow(); 
                        MFT();
                        AST();                      
                    }else{
                        setPopupContent(response.data);
                        handleShow();
                    }                                    
            })
            .catch(function (error) {                
                alert("error");
            });
    }

    return ( 
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-success fixed-top">
                <a className="navbar-brand font-weight-bold" href="#">Unified File Gateway</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse " id="navbarSupportedContent">
                    <ul className="navbar-nav ml-auto navbar-text">            
                    <li className="nav-item">
                        <a className="nav-link">Logout </a>
                    </li>                                       
                    </ul>                   
                </div>
            </nav>
            <div className='container mt-5 pt-4 pb-5'>
                <div className='mt-3 p-3'>
                    <div className='row'>
                        <div className='col-6 card shadow py-4'>
                            <h1 className='text-info h4 mb-2'>Upload Zone</h1>                            
                            <form onSubmit={upload}>                            
                                <div className="form-group">
                                    <div className="row px-4">
                                        <div className='col-12 card'>
                                            <ReactFileReader handleFiles={handleFiles} fileTypes={fileFormats} base64={true}>
                                                <div className="row px-3 pt-2 text-center">
                                                    <div className="col-xs-4">
                                                        <button type="button" className='btn btn-block btn-sm btn-outline-dark my-2'>Add File</button>
                                                    </div>
                                                    <div className="col-xs-8">
                                                        <p className="text-dark mt-3 pl-4 font-weight-bold">{file!==null?file.name:null}</p>
                                                    </div>
                                                </div>
                                            </ReactFileReader>
                                        </div>
                                        <div className='col-12 mt-2 p-0'>
                                            <div className="form-group">
                                                <label className="text-secondary font-italic">Storage Provider</label>
                                                <select 
                                                    className="form-control text-dark font-weight-bolder disabled muted"
                                                    onChange={(e)=>{
                                                        setStorage(e.target.value)
                                                    }}
                                                    value={storage}
                                                    >          
                                                    <option></option>                                           
                                                    <option>AWS</option>
                                                    <option>AZURE</option>                                                
                                                </select>
                                            </div>
                                        </div>                                    
                                    </div>                                
                                </div>
                                <button className='btn  btn-outline-success btn-block font-weight-bold px-5' type="submit">Upload File</button>
                            </form>
                        </div>
                        <div className='col-6 p-4'>                                 
                        </div>
                    </div>                        
                </div>
                <div className='card mt-3 mb-4 p-3 shadow'>
                    <div className='row'>
                        <div className='col-9'>
                            <h1 className='text-info h4'>My Files</h1>
                        </div>                      
                    </div>
                        
                        <table className='table table-striped table-hover table-scroll'>        
                            <thead>
                                <tr className='text-secondary'>
                                    <th scope="col">File Name</th>
                                    <th scope="col" className='text-center'>Provider</th>
                                    <th scope="col" className='text-center'>Last Modified By</th>
                                    <th scope="col" className='text-center'>Timestamp</th>                                    
                                    <th scope="col" className='text-center'></th>
                                    <th scope="col" className='text-center'></th>
                                    <th scope="col" className='text-center'></th>
                                    <th scope="col" className='text-center'></th>
                                </tr>                
                            </thead>                                
                        <tbody>
                        {data!=null ? 
                              data && data.map((entry,index)=>{
                                    return(
                                    <tr className='' key={entry.id}>
                                        <th scope="row" className='text-blue font-weight-normal font-weight-bold'>{entry.fileName}</th>                                        
                                        <td className='text-center '>{entry.provider}</td>
                                        <td className='text-center '>{entry.lastModifiedBy}</td>
                                        <td className='text-center '>{entry.timestamp.split("(")[0]}</td>                                       
                                        <td className='text-center'>
                                        <button 
                                                className='btn btn-sm  btn-block p-0'
                                                dataToggle="tooltip" dataPlacement="top" title="download"
                                                onClick={()=>{                                                    
                                                    download(entry.provider,entry.storedName,entry.fileName,"","owner");
                                                    
                                                }}
                                            ><img src="https://img.icons8.com/external-kiranshastry-gradient-kiranshastry/26/000000/external-download-interface-kiranshastry-gradient-kiranshastry.png"/></button>
                                        </td> 
                                        <td className='text-center '>
                                            <button 
                                                className='btn btn-sm btn-block p-0'
                                                dataToggle="tooltip" dataPlacement="top" title="delete"
                                                onClick={()=>{
                                                    deleteFile(entry.provider,entry.storedName,entry.fileName);
                                                }}
                                            ><img src="https://img.icons8.com/color/26/000000/delete-forever.png"/></button>
                                        </td>                                           
                                        <td>
                                            <button 
                                                    className='btn btn-sm  btn-block p-0'
                                                    dataToggle="tooltip" dataPlacement="top" title="update"
                                                    onClick={()=>{
                                                        handleShow2();
                                                        setUploadFileID(entry.id);
                                                        setAccessType("owner");
                                                        setStorage(entry.provider);
                                                    }}
                                                ><img src="https://img.icons8.com/fluency/26/000000/approve-and-update.png"/>
                                            </button> 
                                        </td>
                                        <td>
                                            <button 
                                                    className='btn btn-sm  btn-block p-0'
                                                    dataToggle="tooltip" dataPlacement="top" title="share"
                                                    onClick={()=>{                                                        
                                                        setSActualFileName(entry.fileName);
                                                        setSProvider(entry.provider);
                                                        setSFileName(entry.storedName);
                                                        handleShow1();
                                                    }}
                                                ><img src="https://img.icons8.com/color/28/000000/share--v1.png"/>
                                            </button> 
                                        </td>
                                    </tr>
                                    )
                                })
                                :null } 
                        </tbody>
                        </table>
                    </div>
                    <div className='card mt-3 mb-4 p-3 shadow'>                        
                        <h5 className="text-info mt-3">Access Received</h5>     
                        <table className='table table-striped table-hover table-scroll'>    
                            <thead>
                                <tr className='text-secondary'>
                                    <th scope="col">File Name</th>
                                    <th scope="col" >Shared By</th>
                                    <th scope="col" >Shared Till Date</th>
                                    <th scope="col" >Shared Till Time</th>
                                    <th scope="col" className='text-center'>Download</th>
                                    <th scope="col" className='text-center'>Update</th>
                                </tr>
                            </thead>                           
                            <tbody>
                                {shareReceived!=null ? 
                               shareReceived && shareReceived.Items.map((entry,index)=>{
                                    return(
                                    <tr className='' key={entry.id}>
                                        <th scope="row" className=' font-weight-normal font-weight-bold'>{entry.actualFileName}</th>
                                        <td >{entry.sharedFrom}</td>
                                        <td >{entry.sharedTillDate}</td>
                                        <td >{entry.sharedTillTime}</td>
                                        <td className='text-center'>
                                            <button 
                                                    className='btn btn-sm  btn-block pt-0'
                                                    onClick={()=>{
                                                        download(entry.provider,entry.storedFileName,entry.actualFileName,entry.shareTillTimestamp,"share");
                                                    }}
                                                ><img src="https://img.icons8.com/external-kiranshastry-gradient-kiranshastry/30/000000/external-download-interface-kiranshastry-gradient-kiranshastry.png"/>
                                            </button> 
                                        </td> 
                                        <td className='text-center '>
                                            <button 
                                                    className='btn btn-sm  btn-block'
                                                    onClick={()=>{
                                                        handleShow2();
                                                        setUploadFileID(entry.storedFileName);
                                                        setStorage(entry.provider);
                                                        setAccessType("share");
                                                        setUpdateTimestamp(entry.shareTillTimestamp);
                                                    }}
                                                ><img src="https://img.icons8.com/fluency/26/000000/approve-and-update.png"/>
                                            </button> 
                                        </td>                                           
                                    </tr>
                                    )
                                })
                                :null 
                                }                                                                                                           
                            </tbody>                                
                        </table>
                </div>                         
                <div className='card p-3 mt-3 shadow '>
                    <h5 className="text-info mb-3">Shared Files:</h5>                    
                    <table className='table table-striped table-hover table-scroll'>     
                        <thead>
                            <tr className='text-secondary'>
                                <th scope="col">File Name</th>
                                <th scope="col" >Shared to</th>
                                <th scope="col" >Shared Till Date</th>
                                <th scope="col" >Shared Till Time</th>
                                <th scope="col" className='text-center'>revoke permission</th>
                            </tr>
                        </thead>                          
                        <tbody>
                            {sharedFileData!=null ? 
                            sharedFileData && sharedFileData.Items.map((entry,index)=>{
                                return(
                                <tr className='' key={entry.id}>
                                    <th scope="row" className=' font-weight-normal font-weight-bold'>{entry.actualFileName}</th>
                                    <td >{entry.sharedTo}</td>
                                    <td >{entry.sharedTillDate}</td>
                                    <td >{entry.sharedTillTime}</td>
                                    <td className='text-center'>
                                        <button 
                                            className='btn btn-outline-light text-danger font-weight-bold btn-sm badge-pill px-3 border-dark'
                                            onClick={()=>{revoke(entry.id)}}>                                                    
                                            X
                                        </button>    
                                    </td>                                            
                                </tr>
                                )
                            })
                            :null 
                            }                                                                                                           
                        </tbody>                                
                    </table>
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

            <Modal
                show={show1}
                onHide={handleClose1}                
                keyboard={false}
                size="lg"
                centered                
                >
                <Modal.Header>
                <Modal.Title>Unified File Gateway</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h5 className="text-info mb-3">Share File</h5>
                    <form onSubmit={share}>
                        <div className='row'>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label className="text-secondary font-italic">Share to: (EMAIL ID:)</label>
                                    <input 
                                        type="email" 
                                        value={sEmail}
                                        className="form-control text-secondary font-weight-bolder" 
                                        onChange={(e)=>{
                                            setSEmail(e.target.value);
                                        }}                                        
                                        required/>                                    
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label className="text-secondary font-italic">Storage Provider</label>
                                    <select 
                                        className="form-control text-secondary font-weight-bolder disabled muted"
                                        value={sProvider}
                                        disabled
                                        >          
                                        <option></option>                                           
                                        <option>AWS</option>
                                        <option>AZURE</option>                                        
                                    </select>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label className="text-secondary font-italic">File Name</label>
                                    <input 
                                        type="text" 
                                        value={sActualFileName}
                                        className="form-control text-secondary font-weight-bolder"
                                        disabled
                                        required/>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label className="text-secondary font-italic">File Name ( as on storage) </label>
                                    <input 
                                        type="text" 
                                        value={sFileName}
                                        className="form-control text-secondary font-weight-bolder"
                                        disabled
                                        required/>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label>Share till Date:</label>
                                    <input 
                                        type="date" 
                                        className="form-control text-secondary" 
                                        placeholder="DD/MM/YYY"
                                        value={sDate}
                                        onChange={(e)=>{setSDate(e.target.value)}}
                                        required                                        
                                        />
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className="form-group">
                                    <label>Share till time: (* till this time on mentioned date)</label>
                                    <input 
                                        type="time" 
                                        className="form-control text-secondary" 
                                        placeholder="enter railway time HHMM"
                                        value={sTime}
                                        onChange={(e)=>{setSTime(e.target.value)}}
                                        required                                        
                                        />
                                </div>
                            </div>
                            <div className='col-6'></div>
                            <div className='col-6'>                            
                                <button 
                                    type="submit" 
                                    className="btn btn-success btn-block font-weight-bold"                              
                                >Submit</button>
                            </div>
                        </div>                            
                    </form>
                </Modal.Body>               
            </Modal>

            <Modal
                show={show2}
                onHide={handleClose2}                
                keyboard={false}
                centered
                >
                <Modal.Header>
                <Modal.Title>Unified File Gateway</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <form onSubmit={update}>     
                            <div className="form-group">
                                <div className="row px-2">
                                    <div className='col-12 card'>
                                        <ReactFileReader handleFiles={handleFiles} fileTypes={fileFormats} base64={true}>
                                            <div className="row px-3 pt-2 text-center">
                                                <div className="col-xs-4">
                                                    <button type="button" className='btn btn-block btn-sm btn-outline-dark my-2'>Select File</button>
                                                </div>
                                                <div className="col-xs-8">
                                                    <p className="text-dark mt-3 pl-4 font-weight-bold">{file!==null?file.name:null}</p>
                                                </div>
                                            </div>
                                        </ReactFileReader>
                                    </div>                                    
                                </div>                                
                            </div>
                            <button className='btn  btn-outline-success font-weight-bold px-5' type="submit">Update File</button>
                        </form>
                </Modal.Body>               
            </Modal>
        </div>        
    )
}
export default React.memo(Dash);