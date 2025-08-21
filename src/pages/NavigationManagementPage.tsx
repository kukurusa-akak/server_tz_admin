import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import {
  getNavigationLinks,
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
  bulkUpdateNavigationLinks,
  setHomepageNavigationLink,
  NavigationLink,
} from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PlusCircle, Edit, Trash2, GripVertical, Save, Star } from "lucide-react";

// --- Types ---
type LinkItem = NavigationLink;

// --- Helper: LinkForm ---
const LinkForm = ({ link, onSubmit, onCancel, type, isParent }: { link?: Partial<LinkItem>, onSubmit: (data: Omit<LinkItem, 'id' | 'children'>) => void, onCancel: () => void, type: 'PORTAL' | 'ADMIN', isParent: boolean }) => {
  const [formData, setFormData] = useState({
    title: link?.title || '',
    path: isParent ? '#' : link?.path || '',
    order: link?.order || 0,
    type: link?.type || type,
    icon: link?.icon || '',
    category: null,
    parentId: link?.parentId || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: name === 'order' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-100 border rounded-md my-2 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>이름</Label><Input name="title" value={formData.title} onChange={handleChange} required /></div>
        {isParent && type === 'ADMIN' ? (
          <div><Label>경로</Label><Input name="path" value={formData.path} readOnly disabled title="최상위 그룹의 경로는 변경할 수 없습니다." /></div>
        ) : (
          <div><Label>경로</Label><Input name="path" value={formData.path} onChange={handleChange} required /></div>
        )}
        {type === 'ADMIN' && <div><Label>아이콘 (Lucide)</Label><Input name="icon" value={formData.icon || ''} onChange={handleChange} placeholder="e.g., Home" /></div>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>취소</Button>
        <Button type="submit" size="sm">저장</Button>
      </div>
    </form>
  );
};

// --- Helper: SortableLinkItem ---
const SortableLinkItem = ({ link, isDragging, onEdit, onDelete, onSetHomepage, onAddSubLink, isParent, onOrderChange, isDirty, children }: { link: LinkItem, isDragging?: boolean, onEdit: () => void, onDelete: () => void, onSetHomepage: () => void, onAddSubLink?: () => void, isParent: boolean, onOrderChange: (order: number) => void, isDirty: boolean, children?: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id, disabled: isParent });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div className={`flex items-center p-2 rounded-md shadow-sm border justify-between transition-colors ${isParent ? 'bg-slate-50' : 'bg-white'} ${isDirty ? 'border-blue-500' : 'border-slate-200'}`}>
        <div className="flex items-center">
          {isParent ? (
            <Input type="number" value={link.order} onChange={(e) => onOrderChange(parseInt(e.target.value) || 0)} className="w-16 h-8 mr-2 text-center" />
          ) : (
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
              <GripVertical className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div>
            <p className={`font-semibold ${isParent ? 'text-slate-900' : 'text-slate-800'}`}>{link.title}</p>
            {!isParent && <p className="text-sm text-slate-600 font-mono">{link.path}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isParent && onAddSubLink && (
            <Button variant="ghost" size="icon" onClick={onAddSubLink} title="하위 링크 추가">
              <PlusCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
          {!isParent && (
            <Button variant="ghost" size="icon" onClick={onSetHomepage} title="Set as homepage for this group">
              <Star className={`h-4 w-4 ${link.isHomepage ? 'text-yellow-500 fill-yellow-400' : 'text-slate-400'}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      </div>
      {children && <div className="pl-8 pt-2 space-y-2 border-l-2 border-slate-200 ml-4">{children}</div>}
    </div>
  );
};

// --- Main Component ---
export function NavigationManagementPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const initialLinks = useRef<LinkItem[]>([]);
  const [, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const data = await getNavigationLinks();
      setLinks(data);
      initialLinks.current = JSON.parse(JSON.stringify(data));
      setHasChanges(false);
    } catch (error) { console.error("Failed to fetch links:", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setLinks(currentLinks => {
      const newLinks = JSON.parse(JSON.stringify(currentLinks));
      const flatLinks: LinkItem[] = newLinks.flatMap((l: LinkItem) => [l, ...(l.children || [])]);
      
      const activeLink = flatLinks.find(l => l.id === active.id);
      const overLink = flatLinks.find(l => l.id === over.id);

      if (!activeLink || !overLink || activeLink.type !== overLink.type) {
        return currentLinks;
      }

      // Determine the new parent and the index for the dragged item
      const newParentId = overLink.parentId ?? overLink.id;
      const oldParentId = activeLink.parentId;

      // If it's a child item being moved
      if (oldParentId) {
        const oldParent = newLinks.find((l: LinkItem) => l.id === oldParentId);
        const newParent = newLinks.find((l: LinkItem) => l.id === newParentId);

        if (!oldParent || !newParent) return currentLinks;

        // Find the index of the item being dragged
        const oldIndex = oldParent.children?.findIndex((l: LinkItem) => l.id === active.id) ?? -1;
        if (oldIndex === -1) return currentLinks;

        // Remove the item from its old parent
        const [movedItem] = oldParent.children!.splice(oldIndex, 1);
        movedItem.parentId = newParentId;

        // Determine the new index in the new parent's children array
        let newIndex = newParent.children?.findIndex((l: LinkItem) => l.id === over.id) ?? -1;
        
        // If dropping on the parent container itself, add to the end.
        if (over.id === newParentId) {
          newIndex = newParent.children?.length ?? 0;
        }
        
        if (newIndex === -1) { // Fallback if overLink is not in children
            newIndex = newParent.children?.length ?? 0;
        }

        // Add the item to its new parent
        if (!newParent.children) newParent.children = [];
        newParent.children!.splice(newIndex, 0, movedItem);

        // Re-order both old and new parent's children
        oldParent.children!.forEach((child: LinkItem, index: number) => child.order = index);
        newParent.children!.forEach((child: LinkItem, index: number) => child.order = index);

        return newLinks;
      }
      
      // This part handles reordering of top-level items
      const activeIndex = newLinks.findIndex((l: LinkItem) => l.id === active.id);
      const overIndex = newLinks.findIndex((l: LinkItem) => l.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const [movedItem] = newLinks.splice(activeIndex, 1);
        newLinks.splice(overIndex, 0, movedItem);
        
        // Update order for all top-level items of the same type
        newLinks.filter((l: LinkItem) => l.type === activeLink.type && !l.parentId)
          .forEach((item: LinkItem, index: number) => {
            const originalItem = newLinks.find((li: LinkItem) => li.id === item.id);
            if(originalItem) originalItem.order = index;
          });
      }

      return newLinks;
    });

    setHasChanges(true);
  };
  
  const handleOrderChange = (linkId: number, newOrder: number) => {
    setLinks(currentLinks => {
      const newLinks = currentLinks.map(l => l.id === linkId ? { ...l, order: newOrder } : l);
      return newLinks.sort((a, b) => a.order - b.order);
    });
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (window.confirm("순서 변경사항을 저장하시겠습니까?")) {
      try {
        const flattenedLinks = links.flatMap(l => [l, ...(l.children || [])]);
        const bulkUpdateData = flattenedLinks.map((l) => ({ 
          id: l.id, 
          order: l.order,
          parentId: l.parentId 
        }));
        await bulkUpdateNavigationLinks(bulkUpdateData);
        await fetchLinks();
      } catch (error) {
        console.error("Failed to save changes:", error);
        alert("저장에 실패했습니다.");
      }
    }
  };

  const handleFormSubmit = async (data: Omit<LinkItem, 'id' | 'children'>) => {
    try {
      if (typeof editingId === 'number') {
        await updateNavigationLink(editingId, data);
      } else {
        await createNavigationLink(data);
      }
      setEditingId(null);
      setAddingToParentId(null);
      await fetchLinks();
    } catch (error) { console.error("Failed to save link:", error); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 이 링크를 삭제하시겠습니까? 자식 링크도 모두 삭제됩니다.')) {
      try {
        await deleteNavigationLink(id);
        await fetchLinks();
      } catch (error) { console.error("Failed to delete link:", error); }
    }
  };

  const handleSetHomepage = async (id: number, type: 'ADMIN' | 'PORTAL') => {
    // Optimistic UI update
    setLinks(currentLinks =>
      currentLinks.map(link => ({
        ...link,
        isHomepage: link.type === type ? link.id === id : link.isHomepage,
        children: link.children?.map(child => ({
          ...child,
          isHomepage: child.type === type ? child.id === id : child.isHomepage,
        })),
      }))
    );
  
    // API call
    try {
      await setHomepageNavigationLink(id);
      await fetchLinks(); // Re-sync with DB
    } catch (error) {
      console.error("Failed to set homepage:", error);
      alert("홈페이지 설정에 실패했습니다.");
      setLinks(initialLinks.current); // Revert on failure
    }
  };

  const activeItem = useMemo(() => links.flatMap(l => [l, ...(l.children || [])]).find(item => item.id === activeId) as LinkItem | undefined, [activeId, links]);
  
  const dirtyIds = useMemo(() => {
    const flatInitial = initialLinks.current.flatMap(l => [l, ...(l.children || [])]);
    const flatCurrent = links.flatMap(l => [l, ...(l.children || [])]);
    const changed = new Set<number>();
    flatCurrent.forEach(currentLink => {
      const initialLink = flatInitial.find(il => il.id === currentLink.id);
      if (!initialLink || currentLink.order !== initialLink.order || currentLink.parentId !== initialLink.parentId) {
        changed.add(currentLink.id);
      }
    });
    return changed;
  }, [links]);

  const renderLinks = (linksToRender: LinkItem[], type: 'PORTAL' | 'ADMIN') => {
    return (
      <SortableContext items={linksToRender.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {linksToRender.map(link => (
          <div key={link.id}>
            {editingId === link.id ?
              <LinkForm link={link} onSubmit={handleFormSubmit} onCancel={() => setEditingId(null)} type={type} isParent={!link.parentId} /> :
              <SortableLinkItem 
                link={link} 
                onEdit={() => { setEditingId(link.id); setAddingToParentId(null); }} 
                onDelete={() => handleDelete(link.id)} 
                onSetHomepage={() => {}} 
                onAddSubLink={() => { setAddingToParentId(link.id); setEditingId(null); }}
                isParent={!link.parentId} 
                onOrderChange={(order) => handleOrderChange(link.id, order)} 
                isDirty={dirtyIds.has(link.id)}
              >
                {link.children && (
                  <SortableContext items={link.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {link.children.map(child => (
                      editingId === child.id ?
                        <LinkForm key={child.id} link={child} onSubmit={handleFormSubmit} onCancel={() => setEditingId(null)} type={type} isParent={false} /> :
                        <SortableLinkItem key={child.id} link={child} onEdit={() => { setEditingId(child.id); setAddingToParentId(null); }} onDelete={() => handleDelete(child.id)} onSetHomepage={() => handleSetHomepage(child.id, type)} isParent={false} onOrderChange={() => {}} isDirty={dirtyIds.has(child.id)} />
                    ))}
                  </SortableContext>
                )}
                {addingToParentId === link.id && (
                  <LinkForm 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => setAddingToParentId(null)} 
                    type={type} 
                    isParent={false} 
                    link={{ parentId: link.id, type: type, order: (link.children?.length || 0) }} 
                  />
                )}
              </SortableLinkItem>
            }
          </div>
        ))}
      </SortableContext>
    );
  };

  return (
    <div className="p-6 sm:p-10 min-h-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">네비게이션 메뉴 관리</h2>
          <p className="text-slate-500">드래그 앤 드롭으로 순서와 그룹을 변경하고, 링크를 관리하세요.</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveChanges} size="lg">
            <Save className="h-5 w-5 mr-2" />
            순서 변경사항 저장
          </Button>
        )}
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
        <Tabs defaultValue="portal">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portal">포털</TabsTrigger>
            <TabsTrigger value="admin">관리자 (Admin)</TabsTrigger>
          </TabsList>

          <TabsContent value="portal">
            <Card className="mt-4">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>포털 메뉴</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setEditingId('new-portal'); setAddingToParentId(null); }}><PlusCircle className="h-4 w-4 mr-2" /> 최상위 링크 추가</Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderLinks(links.filter(l => l.type === 'PORTAL' && !l.parentId), 'PORTAL')}
                {editingId === 'new-portal' && <LinkForm onSubmit={handleFormSubmit} onCancel={() => setEditingId(null)} type="PORTAL" isParent={true} />}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
             <Card className="mt-4">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>관리자 메뉴</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setEditingId('new-admin'); setAddingToParentId(null); }}><PlusCircle className="h-4 w-4 mr-2" /> 최상위 그룹 추가</Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderLinks(links.filter(l => l.type === 'ADMIN' && !l.parentId), 'ADMIN')}
                {editingId === 'new-admin' && <LinkForm onSubmit={handleFormSubmit} onCancel={() => setEditingId(null)} type="ADMIN" isParent={true} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DragOverlay>{activeItem ? <SortableLinkItem link={activeItem} isDragging onEdit={()=>{}} onDelete={()=>{}} onSetHomepage={()=>{}} isParent={!activeItem.parentId} onOrderChange={()=>{}} isDirty={false} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
