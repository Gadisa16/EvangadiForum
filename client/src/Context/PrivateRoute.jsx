import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { userProvider } from "./UserProvider";
import Loader from "../Components/Loader/Loader";

function PrivateRoute({ children }) {
    const { isAuthenticated, isLoading } = useContext(userProvider);
    const location = useLocation();

    if (isLoading) {
        return <Loader message="Loading EvangadiForum…" />; // You can replace this with a proper loading component
    }

    if (!isAuthenticated) {
        // Save the attempted URL for redirecting after login
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}

export default PrivateRoute;
