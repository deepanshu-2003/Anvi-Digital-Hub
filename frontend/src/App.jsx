import './App.css';
import { Route, Routes } from 'react-router-dom';
import Home from './Components/Home';
import About from './Components/About';
import Courses from './Components/Courses';
import Contact from './Components/Contact';
import Services from './Components/Services';
import Login from './Components/Login';
import Register from './Components/Register';
import Account from './Components/Account';
function App() {
  return (
    <>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={< Account/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>} />
      </Routes>
      
    </>
  );
}

// export default TypesExample;
// function App() {
//   return (
//     <div className="App">
      
//     </div>
//   );
// }

export default App;
