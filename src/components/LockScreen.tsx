
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SayWithLogo } from './SayWithLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KeyRound } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const { toast } = useToast();
  const correctPin = process.env.NEXT_PUBLIC_PIN_CODE;

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      toast({ title: 'Success', description: 'Access granted.' });
      onUnlock();
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect PIN',
        description: 'Please try again.',
      });
      setPin('');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-sm border-border">
          <CardHeader className="text-center">
              <SayWithLogo className="h-12 w-auto mx-auto mb-4" />
              <CardTitle className="text-2xl">Enter Access PIN</CardTitle>
              <CardDescription>This area is restricted. Please enter your 4-digit PIN to continue.</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          type="password"
                          value={pin}
                          onChange={handlePinChange}
                          maxLength={4}
                          placeholder="••••"
                          className="pl-10 text-center text-2xl tracking-[0.5em]"
                      />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Unlock
                  </Button>
              </form>
          </CardContent>
      </Card>
    </div>
  );
}
