import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { trackInitiateCheckout } from "@/lib/meta-pixel";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  const handleCheckout = () => {
    // InitiateCheckout with content_ids, num_items, content_type
    const contentIds = items.map(item => item.product.id);
    trackInitiateCheckout(totalPrice, "USD", totalItems, contentIds);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-[family-name:var(--font-display)] text-xl">Your Cart ({totalItems})</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingBag size={48} className="text-muted-foreground/30" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <img src={item.product.image} alt={item.product.name} className="w-20 h-24 object-cover rounded-sm bg-muted" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div><h3 className="text-sm font-medium leading-tight">{item.product.name}</h3><p className="text-sm text-muted-foreground mt-0.5">${item.product.price.toFixed(2)}</p></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 border border-border rounded-sm">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-muted transition-colors"><Minus size={14} /></button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-muted transition-colors"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeItem(item.product.id)} className="text-xs text-muted-foreground underline hover:text-destructive transition-colors">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${totalPrice.toFixed(2)}</span></div>
                <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
                <Link href="/checkout" onClick={handleCheckout}><Button className="w-full" size="lg">Proceed to Checkout</Button></Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
