
import React from 'react';
import Logo from '@/components/ui-components/Logo';
import RegisterForm from '@/components/auth/RegisterForm';
import PageContainer from '@/components/ui-components/PageContainer';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <PageContainer className="flex flex-col items-center">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Create a mawkfi Account</h1>
        
        <RegisterForm />
      </PageContainer>
    </div>
  );
};

export default RegisterPage;
