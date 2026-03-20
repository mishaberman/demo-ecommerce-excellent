/*
  EXCELLENT Implementation — Product Detail
  - ViewContent fires with content_name, content_category
  - AddToCart fires with content_name, num_items
*/

import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { getProductById, products } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import { trackViewContent, trackAddToCart } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { ShoppingBag, Minus, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const product = getProductById(params.id || "");
  const { addItem, setIsOpen } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      // ViewContent with content_name and content_category
      trackViewContent(product.id, product.name, product.price, product.currency, product.category);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><h1 className="text-2xl mb-4">Product Not Found</h1><Link href="/shop"><Button variant="outline">Back to Shop</Button></Link></div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    // AddToCart with content_name and num_items
    trackAddToCart(product.id, product.name, product.price * quantity, product.currency, quantity);
    toast.success(`${product.name} added to cart`);
    setIsOpen(true);
  };

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div className="min-h-screen">
      <div className="container py-4">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"><ArrowLeft size={14} />Back to Shop</Link>
      </div>
      <section className="container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative aspect-[4/5] bg-muted rounded-sm overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3">{product.category}</p>
            <h1 className="text-3xl lg:text-4xl mb-4">{product.name}</h1>
            <p className="text-2xl font-[family-name:var(--font-display)] text-foreground mb-6">${product.price.toFixed(2)}</p>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">{product.description}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.map((tag) => (<span key={tag} className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground border border-border rounded-sm">{tag}</span>))}
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-muted transition-colors"><Minus size={16} /></button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-muted transition-colors"><Plus size={16} /></button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 gap-2"><ShoppingBag size={16} />Add to Cart — ${(product.price * quantity).toFixed(2)}</Button>
            </div>
            <p className="text-xs text-muted-foreground">Free shipping on orders over $75. 30-day returns.</p>
          </motion.div>
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section className="py-16 border-t border-border/50">
          <div className="container">
            <h2 className="text-2xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">{relatedProducts.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}</div>
          </div>
        </section>
      )}
    </div>
  );
}
