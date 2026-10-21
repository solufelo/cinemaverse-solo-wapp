'use client';
 
import React from "react";
import { useId, useState } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Label } from '../../src/components/ui/label';
 
const PROJECT_NAME = 'Mvpblocks';
 
export default function DeleteProject() {
  const id = useId();
  const [inputValue, setInputValue] = useState('');
 
  // Simple fallback: just render the button and input for now
  return (
    <div>
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
          aria-hidden="true"
        >
          <CircleAlertIcon className="opacity-80" size={16} />
        </div>
        <div>
          <h2 className="sm:text-center font-bold">Final confirmation</h2>
          <p className="sm:text-center">
            This action cannot be undone. To confirm, please enter the project
            name <span className="text-primary">{PROJECT_NAME}</span>.
          </p>
        </div>
      </div>
      <form className="space-y-5">
        <div className="*:not-first:mt-2">
          <Label htmlFor={id}>Project name</Label>
          <Input
            id={id}
            type="text"
            placeholder={`Type ${PROJECT_NAME} to confirm`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={inputValue !== PROJECT_NAME}
          >
            Delete
          </Button>
        </div>
      </form>
    </div>
  );
}
 