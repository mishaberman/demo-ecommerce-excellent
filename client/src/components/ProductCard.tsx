import type { Product } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import { trackAddToCart } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, setIsOpen } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    // AddToCart with content_name and num_items
    trackAddToCart(product.id, product.name, product.price, product.currency, 1);
    toast.success(`${product.name} added to cart`);
    setIsOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
      <Link href={`/product/${product.id}`} className="group block">
        <div className="relative overflow-hidden bg-muted rounded-sm aspect-[4/5]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button onClick={handleAddToCart} className="w-full gap-2" size="sm"><ShoppingBag size={14} />Add to Cart</Button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h3 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
