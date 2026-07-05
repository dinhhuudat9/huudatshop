import { useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Eye, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Blog() {
  const { data, isLoading } = useListPosts(
    { limit: 12, page: 1 },
    { query: { queryKey: getListPostsQueryKey({ limit: 12, page: 1 }) } }
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Tin tức & Kiến thức MMO
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Cập nhật những thông tin mới nhất về thị trường MMO, chia sẻ kiến thức lập trình, thủ thuật và công cụ hỗ trợ kiếm tiền online.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="w-full aspect-video rounded-none" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.posts?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.posts.map((post) => (
            <Link key={post.id} href={`/tin-tuc/${post.id}`}>
              <Card className="h-full overflow-hidden flex flex-col hover:border-primary/50 transition-colors bg-card/40 backdrop-blur-sm cursor-pointer group">
                {post.thumbnailUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader className="flex-none p-5 pb-2">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {post.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] bg-background">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-5 py-2">
                  <CardDescription className="line-clamp-3">
                    {post.excerpt || "Đọc bài viết để biết thêm chi tiết..."}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex-none p-5 pt-4 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center bg-muted/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{post.authorName || "Admin"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{post.viewCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg">
          Chưa có bài viết nào
        </div>
      )}
    </div>
  );
}
