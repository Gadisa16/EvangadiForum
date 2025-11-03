import { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import AskQuestion from "./Components/AskQuestion/AskQuestion";
import Footer from "./Components/Footer/Footer";
import Header from "./Components/Header/Header";
import HomePage from "./Components/HomePage/HomePage";
import HowItWorks from "./Components/HowItWorks/HowItWorks";
import Landing from "./Components/Landing/Landing.jsx";
import Loader from "./Components/Loader/Loader";
import Profile from "./Components/Profile/Profile";
import QuestionDetail from "./Components/QuestionDetail/QuestionDetail.jsx";
import SignUp from "./Components/SignUp/SignUp";
import VerifyEmail from "./Components/VerifyEmail/VerifyEmail";
import { NotificationProvider } from './Context/NotificationContext';
import PrivateRoute from "./Context/PrivateRoute.jsx";
import { QuestionProvider } from "./Context/QuestionContext"; // Import QuestionProvider
import { SocketProvider } from './Context/SocketContext';
import { userProvider } from "./Context/UserProvider";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useContext(userProvider);

  if (isLoading) {
    return <Loader message="Loading EvangadiForum…" />;
  }

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content" style={{minHeight:"100vh", position:"relative"}}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/question/:questionid"
          element={
            <PrivateRoute>
              <QuestionDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/ask"
          element={
            <PrivateRoute>
              <AskQuestion />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
      <Footer />
    </>
  );
}

function App() {
  return (
      <SocketProvider>
        <NotificationProvider>
          <QuestionProvider> {/* Use QuestionProvider instead of QuestionContext.Provider */}
            <AppRoutes />
          </QuestionProvider>
        </NotificationProvider>
      </SocketProvider>
  );
}

export default App;