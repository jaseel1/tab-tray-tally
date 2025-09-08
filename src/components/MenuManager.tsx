import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface MenuManagerProps {
  items: MenuItem[];
  onItemsChange: (items: MenuItem[]) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  readOnly?: boolean;
}

export function MenuManager({ items, onItemsChange, categories, onCategoriesChange, readOnly = false }: MenuManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: ''
  });
  const { toast } = useToast();

  // Categories are now passed as props

  const resetForm = () => {
    setFormData({ name: '', price: '', category: categories[0] || '', image: '' });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      // Update existing item
      const updatedItems = items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              price,
              category: formData.category,
              image: formData.image || item.image
            }
          : item
      );
      onItemsChange(updatedItems);
      
      toast({
        title: "Item updated",
        description: `${formData.name} has been updated.`,
      });
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formData.name,
        price,
        category: formData.category,
        image: formData.image || '/placeholder.svg'
      };
      
      onItemsChange([...items, newItem]);
      
      toast({
        title: "Item added",
        description: `${formData.name} has been added to the menu.`,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedItems = items.filter(i => i.id !== itemId);
    onItemsChange(updatedItems);
    
    toast({
      title: "Item deleted",
      description: `${item.name} has been removed from the menu.`,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Menu Management</h2>
        {!readOnly && (
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2" size={16} />
            Add Item
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="rounded-2xl shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-16 h-16 object-cover rounded-xl bg-muted"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-muted-foreground text-sm">{item.category}</p>
                <p className="font-medium text-primary">₹{item.price}</p>
              </div>
              {!readOnly && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(item)}
                    className="rounded-xl"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {items.length === 0 && (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No menu items yet</p>
              {!readOnly && (
                <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="image">Item Image</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2" size={16} />
                  {formData.image ? 'Change Image' : 'Upload Image'}
                </Button>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}