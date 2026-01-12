import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import mindmakerLogo from "@/assets/mindmaker-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="h-[var(--mobile-vh)] overflow-hidden flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full shadow-sm border rounded-xl max-h-full overflow-y-auto">
        <CardContent className="p-8 text-center">
          <img 
            src={mindmakerLogo} 
            alt="Mindmaker" 
            className="w-32 h-auto mx-auto mb-6"
          />
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-xl text-foreground mb-2">Page not found</p>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link to="/">
              <Button className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
