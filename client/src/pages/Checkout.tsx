/*
  EXCELLENT Implementation — Checkout Page
  - setUserData called with all PII before events fire
  - Purchase event with complete params (content_ids, content_type, num_items)
  - Lead event with value and currency
*/

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { trackPurchase, trackLead, setUserData } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { generateFakeCheckoutData } from "@/lib/fake-data";

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    email: "", firstName: "", lastName: "", address: "",
    city: "", state: "", zip: "", phone: "",
  });

  // Auto-fill with random fake data on mount
  useEffect(() => { fillRandom(); }, []);

  const fillRandom = () => {
    const fake = generateFakeCheckoutData();
    setFormData({ email: fake.email, firstName: fake.firstName, lastName: fake.lastName, address: fake.address, city: fake.city, state: fake.state, zip: fake.zip, phone: fake.phone });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set user data for advanced matching and CAPI before firing events
    setUserData({
      email: formData.email,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zip,
    });

    // Fire Lead event with value for optimization
    trackLead("checkout_form", 10, "USD");

    // Fire Purchase event with complete parameters
    const contentIds = items.map((item) => item.product.id);
    trackPurchase(totalPrice, "USD", contentIds, totalItems);

    clearCart();
    setStep("success");
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Your cart is empty</h1>
          <Link href="/shop"><Button variant="outline">Continue Shopping</Button></Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <CheckCircle size={64} className="text-primary mx-auto mb-6" />
          <h1 className="text-3xl mb-3">Thank You!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">Your order has been placed successfully. You'll receive a confirmation email shortly.</p>
          <Link href="/shop"><Button size="lg" className="px-8">Continue Shopping</Button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={14} />Continue Shopping
        </Link>
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl lg:text-4xl">Checkout</h1>
          <Button variant="outline" size="sm" onClick={fillRandom} className="gap-1.5 text-xs"><RefreshCw size={12} />Randomize Data</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="text-lg font-[family-name:var(--font-display)] mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="mt-1.5" /></div>
                <div><Label htmlFor="phone">Phone (optional)</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-[family-name:var(--font-display)] mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="mt-1.5" /></div>
                  <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="mt-1.5" /></div>
                </div>
                <div><Label htmlFor="address">Address</Label><Input id="address" name="address" required value={formData.address} onChange={handleChange} className="mt-1.5" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label htmlFor="city">City</Label><Input id="city" name="city" required value={formData.city} onChange={handleChange} className="mt-1.5" /></div>
                  <div><Label htmlFor="state">State</Label><Input id="state" name="state" required value={formData.state} onChange={handleChange} className="mt-1.5" /></div>
                  <div><Label htmlFor="zip">ZIP Code</Label><Input id="zip" name="zip" required value={formData.zip} onChange={handleChange} className="mt-1.5" /></div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-[family-name:var(--font-display)] mb-4">Payment</h2>
              <div className="p-6 border border-border rounded-sm bg-secondary/30 text-center">
                <p className="text-sm text-muted-foreground">This is a demo store. No real payment will be processed.</p>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">Place Order — ${totalPrice.toFixed(2)}</Button>
          </motion.form>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="sticky top-24 border border-border rounded-sm p-6">
              <h2 className="text-lg font-[family-name:var(--font-display)] mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img src={item.product.image} alt={item.product.name} className="w-14 h-16 object-cover rounded-sm bg-muted" />
                    <div className="flex-1"><p className="text-sm font-medium">{item.product.name}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity}</p></div>
                    <p className="text-sm font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({totalItems} items)</span><span>${totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="text-primary">{totalPrice >= 75 ? "Free" : "$8.00"}</span></div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-border"><span>Total</span><span>${(totalPrice >= 75 ? totalPrice : totalPrice + 8).toFixed(2)}</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
