
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to ParkDZ!",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
      
      <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
      
      <div className="text-center text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
