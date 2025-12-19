'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      // Show user-friendly error messages
      let errorMessage = 'Login failed. Please check your credentials.';
      
      // Extract error message from various possible locations
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : 'Login failed';
      }
      
      // Make error messages more user-friendly
      if (errorMessage.includes('Network error') || errorMessage.includes('Unable to connect')) {
        errorMessage = 'Unable to connect to server. Please ensure the backend server is running on port 4000.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Invalid') || errorMessage.includes('credentials') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage === 'Something went wrong') {
        // If we get a generic error, check the status code
        const statusCode = err.response?.status || err.status;
        if (statusCode === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (statusCode === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = 'Login failed. Please check your credentials and try again.';
        }
      }
      
      // Log full error for debugging
      console.error('Login error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status || err.status,
        fullError: err
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




