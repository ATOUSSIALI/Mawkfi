
import React, { useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, CreditCard, Settings } from 'lucide-react';

const ProfilePage = () => {
  const { toast } = useToast();
  
  // Mock user data - would normally come from user context/state
  const [user, setUser] = useState({
    fullName: 'Mohamed Allaoua',
    email: 'mohamed.allaoua@example.com',
    phone: '+213 555 123 456',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSaveProfile = () => {
    setUser(formData);
    setIsEditing(false);
    
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    
    // Navigate to welcome page
    window.location.href = '/';
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarFallback className="bg-primary text-white text-xl">
            {user.fullName.split(' ').map(name => name[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{user.fullName}</h2>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button
              className="flex-1"
              onClick={handleSaveProfile}
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFormData({ ...user });
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <User size={18} className="mr-2 text-primary" />
              Personal Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => setIsEditing(true)}
          >
            <Settings size={16} className="mr-2" />
            Edit Profile
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => window.location.href = '/wallet'}
          >
            <CreditCard size={16} className="mr-2" />
            Wallet & Payments
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default ProfilePage;
