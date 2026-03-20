/*
  EXCELLENT Implementation — Shop Page
  - Search functionality with trackSearch event
  - Category filters
*/

import { useState, useCallback } from "react";
import { products, getCategories } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { trackSearch } from "@/lib/meta-pixel";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function Shop() {
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (query.length >= 2) {
      const timeout = setTimeout(() => {
        const results = products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        );
        trackSearch(query, results.map(r => r.id), 0, "USD");
      }, 500);
      setSearchTimeout(timeout);
    }
  }, [searchTimeout]);

  let filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  if (searchQuery.length >= 2) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16 border-b border-border/50">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-2">The Collection</p>
            <h1 className="text-4xl lg:text-5xl mb-4">Shop All</h1>
            <p className="text-muted-foreground max-w-lg">Browse our complete range of curated essentials. Each piece is selected for quality, craftsmanship, and lasting appeal.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          {/* Search bar */}
          <div className="relative mb-8 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-sm border transition-colors ${activeCategory === null ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-sm border transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>{cat}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {filtered.map((product, i) => (<ProductCard key={product.id} product={product} index={i} />))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20"><p className="text-muted-foreground">No products found.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
