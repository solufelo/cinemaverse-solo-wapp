'use client';

import React from "react";
import { useRef, useState } from 'react';
import { Button } from '../../src/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../src/components/ui/dialog';

export default function TocDialog() {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const content = contentRef.current;
    if (!content) return;
    
    const { scrollTop, scrollHeight, clientHeight } = content;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasReadToBottom(true);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Terms</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read our terms of service carefully.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto space-y-4 text-sm"
        >
          <p>
            By using our service, you agree to these terms and conditions...
          </p>
          {/* Add more terms content here */}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!hasReadToBottom}>
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}