/*
  EXCELLENT Implementation — Contact Page
  - setUserData called with form PII
  - Contact event with content_name
  - Lead event with value and currency
*/

import { useState } from "react";
import { trackContact, trackLead, setUserData } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { CheckCircle, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set user data for CAPI advanced matching
    const nameParts = formData.name.split(' ');
    setUserData({
      email: formData.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    });

    // Fire Contact event with content_name
    trackContact("contact_form");

    // Fire Lead event with value for optimization
    trackLead("contact_form", 5, "USD");

    setSubmitted(true);
    toast.success("Message sent successfully!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <CheckCircle size={64} className="text-primary mx-auto mb-6" />
          <h1 className="text-3xl mb-3">Message Sent</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">Thank you for reaching out. We'll get back to you within 24 hours.</p>
          <Button onClick={() => setSubmitted(false)} variant="outline">Send Another Message</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16 border-b border-border/50">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-2">Get in Touch</p>
            <h1 className="text-4xl lg:text-5xl mb-4">Contact Us</h1>
            <p className="text-muted-foreground max-w-lg">Have a question about our products or need assistance? We'd love to hear from you.</p>
          </motion.div>
        </div>
      </section>
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-2 space-y-8">
              <div className="flex gap-4"><div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center shrink-0"><Mail size={18} className="text-primary" /></div><div><h3 className="text-sm font-semibold mb-1">Email</h3><p className="text-sm text-muted-foreground">hello@eleve-store.com</p></div></div>
              <div className="flex gap-4"><div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center shrink-0"><Phone size={18} className="text-primary" /></div><div><h3 className="text-sm font-semibold mb-1">Phone</h3><p className="text-sm text-muted-foreground">+1 (555) 123-4567</p></div></div>
              <div className="flex gap-4"><div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center shrink-0"><MapPin size={18} className="text-primary" /></div><div><h3 className="text-sm font-semibold mb-1">Studio</h3><p className="text-sm text-muted-foreground">123 Artisan Lane<br />Portland, OR 97201</p></div></div>
              <div className="pt-4 border-t border-border"><h3 className="text-sm font-semibold mb-2">Hours</h3><p className="text-sm text-muted-foreground">Monday – Friday: 9am – 6pm PST<br />Saturday: 10am – 4pm PST<br />Sunday: Closed</p></div>
            </motion.div>
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Jane Doe" className="mt-1.5" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="jane@example.com" className="mt-1.5" /></div>
              </div>
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required value={formData.subject} onChange={handleChange} placeholder="How can we help?" className="mt-1.5" /></div>
              <div><Label htmlFor="message">Message</Label><textarea id="message" name="message" required value={formData.message} onChange={handleChange} rows={6} placeholder="Tell us more..." className="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" /></div>
              <Button type="submit" size="lg" className="w-full sm:w-auto px-12">Send Message</Button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}
