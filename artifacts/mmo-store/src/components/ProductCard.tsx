import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/format";
import { Eye, ShoppingCart, Star, Terminal } from "lucide-react";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/san-pham/${product.id}`}>
      <Card className="group h-full overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(91,77,242,0.15)] bg-card/50 backdrop-blur-sm">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {product.thumbnailUrl ? (
            <img 
              src={product.thumbnailUrl} 
              alt={product.name} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Terminal className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {product.featured && (
              <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-md">Nổi bật</Badge>
            )}
            {product.categoryName && (
              <Badge variant="secondary" className="bg-background/60 backdrop-blur-md">{product.categoryName}</Badge>
            )}
          </div>

          {discount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="font-bold">-{discount}%</Badge>
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-0 flex-1">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {product.techStack?.slice(0, 3).map((tech: string) => (
              <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border/50">
                {tech}
              </span>
            ))}
            {(product.techStack?.length || 0) > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border/50">
                +{(product.techStack?.length || 0) - 3}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 py-3 flex-none">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{product.soldCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{product.viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-end justify-between border-t border-border/50 mt-auto bg-muted/20">
          <div className="flex flex-col mt-3">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatVND(product.originalPrice)}
              </span>
            )}
            <span className="text-lg font-bold font-mono text-primary text-glow">
              {formatVND(product.price)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
