import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { getBeforeAfters, deleteBeforeAfter, type BeforeAfter } from "@/lib/api";
import { useBranch } from "@/context/BranchContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import { BeforeAfterDialog } from "@/components/BeforeAfterDialog";

export function BeforeAfterManagementPage() {
    const { branchSlug } = useBranch();
    const [posts, setPosts] = useState<BeforeAfter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BeforeAfter | null>(null);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchPosts = useCallback(async () => {
      if (!branchSlug) return;
      try {
        setIsLoading(true);
        const data = await getBeforeAfters(branchSlug, debouncedSearchTerm);
        setPosts(data);
      } catch (error) { console.error("Failed to fetch posts:", error); }
      finally { setIsLoading(false); }
    }, [branchSlug, debouncedSearchTerm]);
  
    useEffect(() => { fetchPosts(); }, [fetchPosts]);
  
    const handleDelete = async (id: number) => {
      try { await deleteBeforeAfter(id); fetchPosts(); }
      catch (error) { console.error("Failed to delete post:", error); }
    };

    const openDialog = (post: BeforeAfter | null) => {
        setSelectedPost(post);
        setIsDialogOpen(true);
    }
  
    return (
      <div className="p-6 sm:p-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>전후사진 관리</CardTitle>
            <CardDescription>고객 시술 전후사진을 관리합니다. 제목, 설명, 의사 코멘트, 고객 후기 내용으로 검색할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Input placeholder="검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-10 text-muted-foreground"><Search className="h-4 w-4" /></Button>
              </div>
              <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> 신규 등록</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>제목</TableHead><TableHead>고객 후기</TableHead><TableHead>등록일</TableHead><TableHead className="text-right">관리</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={5} className="text-center">로딩 중...</TableCell></TableRow> : posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{post.id}</TableCell>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{post.customerReview || 'N/A'}</TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog(post)}>수정</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
                              handleDelete(post.id);
                            }
                          }} className="text-destructive">삭제</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {branchSlug && <BeforeAfterDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} post={selectedPost} onSave={fetchPosts} branchSlug={branchSlug} />}
      </div>
    );
  }
