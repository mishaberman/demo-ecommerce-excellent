import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, User, Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/lib/products";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function getRandomItems() {
  // Pick 1-3 random products with random quantities 1-3
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((p) => ({
    product: p,
    quantity: Math.floor(Math.random() * 3) + 1,
  }));
}

export default function Navbar() {
  const { totalItems, setIsOpen, addItem } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleQuickCheckout = useCallback(() => {
    const randomItems = getRandomItems();
    let totalAdded = 0;
    randomItems.forEach(({ product, quantity }) => {
      addItem(product, quantity);
      totalAdded += quantity;
    });
    const names = randomItems.map((i) => i.product.name).join(", ");
    toast.success(`Added ${totalAdded} item${totalAdded > 1 ? "s" : ""} to cart`, {
      description: names,
    });
    // Small delay so the toast shows before navigating
    setTimeout(() => navigate("/checkout"), 300);
  }, [addItem, navigate]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16 lg:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl lg:text-3xl font-medium tracking-tight text-foreground">
            Elevé
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-primary ${
                location === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Quick Add & Checkout */}
          <button
            onClick={handleQuickCheckout}
            className="flex items-center gap-1.5 text-sm font-medium tracking-wide uppercase text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors"
          >
            <Zap size={14} />
            <span>Quick Checkout</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <User size={18} />
            <span>Account</span>
          </Link>

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border/50"
          >
            <nav className="container py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium tracking-wide uppercase py-2 ${
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleQuickCheckout();
                }}
                className="flex items-center gap-1.5 text-sm font-medium tracking-wide uppercase py-2 text-primary"
              >
                <Zap size={14} />
                Quick Checkout
              </button>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium tracking-wide uppercase py-2 text-muted-foreground"
              >
                Account
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
