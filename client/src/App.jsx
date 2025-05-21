import { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AskQuestion from "./Components/AskQuestion/AskQuestion";
import Footer from "./Components/Footer/Footer";
import Header from "./Components/Header/Header";
import HomePage from "./Components/HomePage/HomePage";
import HowItWorks from "./Components/HowItWorks/HowItWorks";
import Landing from "./Components/Landing/Landing.jsx";
import QuestionDetail from "./Components/QuestionDetail/QuestionDetail.jsx";
import SignUp from "./Components/SignUp/SignUp";
import PrivateRoute from "./Context/PrivateRoute.jsx";
import { QuestionProvider } from "./Context/QuestionContext"; // Import QuestionProvider
import { userProvider } from "./Context/UserProvider";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useContext(userProvider);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="main-content" style={{minHeight:"100vh", position:"relative"}}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />
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
    <QuestionProvider> {/* Use QuestionProvider instead of QuestionContext.Provider */}
      <AppRoutes />
    </QuestionProvider>
  );
}

export default App;