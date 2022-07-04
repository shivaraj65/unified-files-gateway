import './App.css';
import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import Landing from './layouts/landing/landing';
import Signup from './layouts/signup/signup';
import Login from './layouts/login/login';
import Dash from './layouts/dashboard/dash';

function App() {
  return (
    <div className="App">
      <HashRouter>
      <Routes>
        <Route exact path="/" element={<Landing/>} />
          <Route exact path="/login" element={<Login/>} />
          <Route exact path="/signup" element={<Signup/>} />
          <Route exact path="/dashboard/:id" element={<Dash/>} />
          
          {/* <Route exact path="mailauth" element={<Landing/>} > */}
            {/* <Route path="/mailauth/:id" element={<Redirecter/>} /> */}
          {/* </Route> */}
        
      </Routes>
    </HashRouter>
    </div>
  );
}

export default App;
