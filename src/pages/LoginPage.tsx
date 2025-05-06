import React from 'react';
import Logo from '@/components/ui-components/Logo';
import LoginForm from '@/components/auth/LoginForm';
import PageContainer from '@/components/ui-components/PageContainer';
const LoginPage = () => {
  return <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <PageContainer className="flex flex-col items-center">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Sign in to MAWKFI</h1>
        
        <LoginForm />
      </PageContainer>
    </div>;
};
export default LoginPage;