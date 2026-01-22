import { useState } from 'react';
import { Button } from './ui/button';
import { FileText } from 'lucide-react';
import { BackendLogsModal } from './BackendLogsModal';

export function Footer() {
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogsModalOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Logs
          </Button>
        </div>
      </footer>
      <BackendLogsModal open={logsModalOpen} onOpenChange={setLogsModalOpen} />
    </>
  );
}
