import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#0047FF]/10 border border-[#0047FF]/25 text-[#0047FF] flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-extrabold font-mono text-dark-text light:text-light-text">
            404
          </div>
          <h1 className="text-xl font-bold font-headline text-dark-text light:text-light-text">
            Page Not Found
          </h1>
          <p className="text-sm text-dark-muted light:text-light-muted">
            The workspace route or resource you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go Back
          </Button>
          <Link to="/">
            <Button variant="primary" size="sm">
              <Home className="w-4 h-4 mr-1.5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
