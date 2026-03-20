/*
  EXCELLENT Implementation — Register Page
  - setUserData called with all PII
  - CompleteRegistration with value, currency, content_name
  - Lead with value and currency
*/

import { useState } from "react";
import { trackCompleteRegistration, trackLead, setUserData } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set user data for CAPI advanced matching
    setUserData({
      email: formData.email,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      externalId: 'user_' + Date.now(),
    });

    // Fire CompleteRegistration with full params
    trackCompleteRegistration("email", 5, "USD");

    // Fire Lead with value
    trackLead("registration_form", 5, "USD");

    setSubmitted(true);
    toast.success("Account created successfully!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <CheckCircle size={64} className="text-primary mx-auto mb-6" />
          <h1 className="text-3xl mb-3">Welcome to Elevé</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">Your account has been created. Start exploring our curated collection of everyday essentials.</p>
          <Link href="/shop"><Button size="lg" className="px-8">Start Shopping</Button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl mb-3">Create Account</h1>
          <p className="text-muted-foreground">Join Elevé for exclusive access to new collections, early releases, and member-only offers.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="mt-1.5" /></div>
            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="mt-1.5" /></div>
          </div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="mt-1.5" /></div>
          <div><Label htmlFor="phone">Phone (optional)</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} placeholder="At least 8 characters" className="mt-1.5" /></div>
          <Button type="submit" size="lg" className="w-full">Create Account</Button>
          <p className="text-center text-sm text-muted-foreground">By creating an account, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.</p>
        </form>
      </motion.div>
    </div>
  );
}
