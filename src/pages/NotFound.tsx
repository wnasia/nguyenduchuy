
import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Check if this is a valid route that should exist
    const validRoutes = ['/stories', '/gallery', '/videos', '/submit', '/login', '/dashboard'];
    const isValidRoute = validRoutes.some(route => location.pathname.startsWith(route));
    
    if (isValidRoute) {
      // This is likely a SPA routing issue, redirect to home and let React Router handle it
      console.log("Redirecting to home to let React Router handle the route");
      setShouldRedirect(true);
    }
  }, [location.pathname]);

  if (shouldRedirect) {
    return <Navigate to={location.pathname} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
