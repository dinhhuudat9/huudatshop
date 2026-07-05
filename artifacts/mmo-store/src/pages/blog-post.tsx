import { useParams, Link } from "wouter";
import { useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Eye, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BlogPost() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;
  
  const { data: post, isLoading, error } = useGetPost(String(id), {
    query: {
      enabled: !!id,
      queryKey: getGetPostQueryKey(String(id))
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-3/4 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h2>
        <Button asChild>
          <Link href="/tin-tuc">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href="/tin-tuc">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Trở về trang tin tức
        </Link>
      </Button>

      {post.thumbnailUrl && (
        <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 border border-border/50 shadow-lg">
          <img 
            src={post.thumbnailUrl} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {post.tags?.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {tag}
          </Badge>
        ))}
      </div>

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
        {post.title}
      </h1>

      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/50 font-mono">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{post.authorName || "Admin"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{post.viewCount || 0} lượt xem</span>
        </div>
      </div>

      {post.excerpt && (
        <p className="text-lg md:text-xl font-medium text-foreground/80 mb-8 border-l-4 border-primary pl-4 italic">
          {post.excerpt}
        </p>
      )}

      <div 
        className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
