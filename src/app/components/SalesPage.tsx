import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Plus,
  Search,
  Check,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState, useEffect, useRef } from "react";
import { Product, SalesHistory, MemberSummary } from "../../types/types";
import { ConfirmDialog } from "./ConfirmDialog";

export function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
   
const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
const [lastSaleData, setLastSaleData] = useState<any>(null);

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const total = selectedItems.reduce((cents, item) => cents + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutRef = useRef(false);
  const pendingCheckout = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Card">(
    "Cash",
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>("walk_in");
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "default";
  } | null>(null);

  // New Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    type: "Product",
    stock: "10",
  });

 const loadData = async () => {
    try {
      const prods = await window.api.products.getAll();
      
      // ONLY keep products that are active (is_active is 1)
     const activeProducts = prods.filter((p: Product) => p.is_active !== 0);
      setProducts(activeProducts);

      const sales = await window.api.sales.getRecent(10);
      setRecentSales(sales);

      const mems = await window.api.members.getAll();
      setMembers(mems);
    } catch (error) {
      // This is the catch block that was missing!
      console.error("Failed to load sales data", error);
    }
  };
  // 1. Load data when the page first opens
  useEffect(() => {
    loadData();

    // Backup timer just in case the database takes a split second to wake up
    const backupTimer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(backupTimer);
  }, []); // The empty [] means "only run this once when the page loads"

  // // 2. Auto-print the receipt when the modal opens
  // useEffect(() => {
  //   if (isReceiptModalOpen && lastSaleData) {
  //     // Wait 300ms to let the modal fully draw on the screen, then print
  //     const printTimer = setTimeout(() => {
  //       window.print();
  //     }, 300);
      
  //     return () => clearTimeout(printTimer);
  //   }
  // }, [isReceiptModalOpen, lastSaleData]);

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return alert("Please fill name and price.");

    try {
      if (editingProductId) {
        await window.api.products.update(editingProductId, {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          type: newProduct.type,
          stock: parseInt(newProduct.stock) || 0,
        });
      } else {
        await window.api.products.create({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          type: newProduct.type,
          stock: parseInt(newProduct.stock) || 0,
          is_active: 1,
        });
      }
      closeProductModal();
      loadData(); // Refresh list
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product");
    }
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setNewProduct({ name: "", price: "", type: "Product", stock: "10" });
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // prevent adding to cart
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      type: product.type,
      stock: product.stock.toString(),
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (
    e: React.MouseEvent,
    product: Product, // <-- Notice I changed productId to the whole product object
  ) => {
    e.stopPropagation(); 
    setConfirmConfig({
      title: "Remove Product",
      message: `Are you sure you want to remove ${product.name}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await window.api.products.update(product.id, {
            name: product.name,
            price: product.price,
            type: product.type,
            stock: product.stock,
            is_active: 0,
          });
          loadData();
        } catch (error) {
          console.error("Failed to archive product", error);
          alert("Failed to remove product.");
        }
        setConfirmConfig(null);
      },
    });
  };

  const addItem = (product: Product) => {
    if (checkoutRef.current) return;
    const quantity = selectedItems.find(item => item.id === product.id)?.quantity || 0;
    if (quantity >= product.stock) {
      alert(`Not enough stock for ${product.name}.`);
      return;
    }
    setSelectedItems(previous => {
      const current = previous.find(item => item.id === product.id);
      if ((current?.quantity || 0) >= product.stock) return previous;
      return current
        ? previous.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...previous, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (index: number) => {
    if (!checkoutRef.current) setSelectedItems(previous => previous.filter((_, i) => i !== index));
  };

  const resetCart = () => {
    setSelectedItems([]);
    setSelectedMemberId("walk_in");
  };

  const clearCart = () => {
    if (!checkoutRef.current) resetCart();
  };

  const processSale = async () => {
    if (checkoutRef.current) return;
    if (selectedItems.length === 0) {
      alert("Please add items to the cart first");
      return;
    }
    checkoutRef.current = true;
    setIsCheckingOut(true);
    try {
      const actualMemberId = selectedMemberId === "walk_in" ? null : selectedMemberId;
      const selectedMember = members.find(member => member.id === actualMemberId);
      const salesBatch = selectedItems.map(item => ({
        product_id: item.id, member_id: actualMemberId, quantity: item.quantity,
        unit_price: item.price, total_price: Math.round(item.price * 100) * item.quantity / 100,
        payment_method: selectedPayment,
      }));
      const fingerprint = JSON.stringify(salesBatch);
      if (pendingCheckout.current?.fingerprint !== fingerprint) {
        pendingCheckout.current = { fingerprint, requestId: crypto.randomUUID() };
      }
      const completed = await window.api.sales.createBatch(salesBatch, pendingCheckout.current.requestId);
      setLastSaleData({
        items: completed.map(item => ({
          name: item.product_name, price: item.unit_price, quantity: item.quantity, total_price: item.total_price,
        })),
        total: completed.reduce((cents, item) => cents + Math.round(item.total_price * 100), 0) / 100,
        payment: selectedPayment, date: new Date(),
        memberName: selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Walk-in",
      });
      pendingCheckout.current = null;
      setIsReceiptModalOpen(true);
      resetCart();
      await loadData();
    } catch (error) {
      console.error("Sale processing failed", error);
      alert(error instanceof Error ? error.message : "Failed to process sale.");
    } finally {
      checkoutRef.current = false;
      setIsCheckingOut(false);
    }
  };

    const handlePrintReceipt = () => {
  window.print();
  setIsReceiptModalOpen(false); // Optional: close the modal after opening the print dialog
};
  return (
    <div className="p-6">
      {/* --- RECEIPT MODAL --- */}
<Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-2xl font-bold border-b pb-4">
        GymApp Receipt
      </DialogTitle>
    </DialogHeader>
    
    {/* Only render this if we actually have sale data saved */}
    {lastSaleData && (
      <div id="printable-receipt" className="space-y-4 py-4 text-black">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Date: {lastSaleData.date.toLocaleString()}</span>
          <span>Customer: {lastSaleData.memberName}</span>
        </div>
        
        {/* Map through the saved items */}
        <div className="border-t border-b border-gray-200 py-4 space-y-2">
          {lastSaleData.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{item.name} x{item.quantity}</span>
              <span>{item.total_price.toLocaleString()} DZD</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{lastSaleData.total.toLocaleString()} DZD</span>
        </div>
        <div className="text-right text-sm text-gray-500">
          Paid via: {lastSaleData.payment}
        </div>
      </div>
    )}

    {/* Buttons: Print or Close */}
    {/* Buttons: Print or Close */}
    <div className="flex flex-col gap-3 mt-6">
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white hide-on-print"
        onClick={handlePrintReceipt}
      >
        Print Receipt
      </Button>
      <Button 
        variant="outline" 
        className="w-full hide-on-print"
        onClick={() => setIsReceiptModalOpen(false)}
      >
        No Thanks
      </Button>
    </div>
  </DialogContent>
</Dialog>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-3">
                <ShoppingCart className="w-8 h-8" />
                Products & Services
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 relative z-10 focus-within:ring-2 focus-within:ring-white/50 transition-all">
                  <Search className="w-5 h-5 text-white pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="bg-transparent border-0 text-white placeholder:text-white/70 focus-visible:ring-0 min-w-[200px] p-0 h-auto cursor-text relative z-20"
                  />
                </div>

                <Dialog
                  open={isProductModalOpen}
                  onOpenChange={(open) => !open && closeProductModal()}
                >
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsProductModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Product
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingProductId ? "Edit Product" : "Add New Product"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Protein Bar"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price (DZD)</Label>
                          <Input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                stock: e.target.value,
                              })
                            }
                            placeholder="10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={newProduct.type}
                          onValueChange={(val) =>
                            setNewProduct({ ...newProduct, type: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Product">Product</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Package">Package</SelectItem>
                            <SelectItem value="Subscription">
                              Subscription
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleCreateProduct}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {editingProductId ? "Save Changes" : "Create Product"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="p-6">
              {products.filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              ).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>
                    {searchQuery
                      ? "No products match your search."
                      : "No products found. Add a new product to get started."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addItem(product)}
                        className="border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-all hover:shadow-lg flex flex-col items-start h-auto relative group"
                      >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            onClick={(e) => handleEditProduct(e, product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => handleDeleteProduct(e, product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2 mt-6">
                          <Badge
                            className={
                              product.type === "Subscription"
                                ? "bg-blue-600 w-fit"
                                : product.type === "Package"
                                  ? "bg-green-600 w-fit"
                                  : product.type === "Product"
                                    ? "bg-purple-600 w-fit"
                                    : "bg-orange-600 w-fit"
                            }
                          >
                            {product.type}
                          </Badge>
                          <h3 className="text-blue-900 font-medium leading-tight">
                            {product.name}
                          </h3>
                        </div>
                        <p className="text-xl text-blue-600 font-semibold mt-4">
                          {product.price.toLocaleString()} DZD
                        </p>
                        <p className={product.stock > 0 ? "text-sm text-gray-500" : "text-sm text-red-600"}>
                          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-t-lg">
              <h3 className="text-white text-xl">Recent Sales</h3>
            </div>
            <div className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-blue-200 bg-blue-50">
                    <th className="text-left py-3 px-6 text-blue-900 font-semibold text-sm">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-6 text-blue-900 font-semibold text-sm">
                      Member
                    </th>
                    <th className="text-left py-3 px-6 text-blue-900 font-semibold text-sm">
                      Product
                    </th>
                    <th className="text-right py-3 px-6 text-blue-900 font-semibold text-sm">
                      Amount
                    </th>
                    <th className="text-center py-3 px-6 text-blue-900 font-semibold text-sm">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-blue-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-3 px-6 text-blue-900 text-sm whitespace-nowrap">
                        {new Date(sale.sale_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-6 text-blue-900 text-sm">
                        {sale.first_name ? (
                          `${sale.first_name} ${sale.last_name}`
                        ) : (
                          <span className="text-gray-400 italic">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-blue-900 text-sm">
                        {sale.product_name}
                        {sale.quantity > 1 && (
                          <span className="text-gray-500 ml-1">
                            x{sale.quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-blue-900 font-medium text-right whitespace-nowrap">
                        {sale.total_price.toLocaleString()} DZD
                      </td>
                      <td className="py-3 px-6 text-center">
                        <Badge
                          variant="outline"
                          className={
                            sale.payment_method?.toUpperCase() === "CASH"
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-blue-500 text-blue-700 bg-blue-50"
                          }
                        >
                          {sale.payment_method}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No recent sales found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 sticky top-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-white text-xl flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Current Sale
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Selection */}
              <div className="space-y-2">
                <Label htmlFor="member">Link to Member (Optional)</Label>
                <Select
                  value={selectedMemberId}
                  disabled={isCheckingOut}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="border-blue-300">
                    <SelectValue placeholder="Select member (Walk-in default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">Customer</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <div className="border-2 border-blue-200 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50/50">
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <ShoppingCart className="w-8 h-8 opacity-50" />
                    <p>No items added</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-blue-100 pb-3 bg-white p-2 rounded shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="text-blue-900 font-medium text-sm">
                            {item.name}
                          </p>
                          <p className="text-blue-600 text-xs mt-1 font-semibold">
                            {item.quantity} × {item.price.toLocaleString()} DZD = {(Math.round(item.price * 100) * item.quantity / 100).toLocaleString()} DZD
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1 h-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Section */}
              <div className="border-t-2 border-blue-200 pt-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-blue-900 font-semibold">
                      Total Due:
                    </span>
                    <span className="text-3xl text-green-600 font-bold">
                      {total.toLocaleString()} DZD
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-semibold text-gray-700">
                    Payment Method
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={
                        selectedPayment === "Cash" ? "default" : "outline"
                      }
                      className={
                        selectedPayment === "Cash"
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }
                      disabled={isCheckingOut}
                      onClick={() => setSelectedPayment("Cash")}
                    >
                      {selectedPayment === "Cash" && (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Cash
                    </Button>
                    <Button
                      variant={
                        selectedPayment === "Card" ? "default" : "outline"
                      }
                      className={
                        selectedPayment === "Card"
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }
                      disabled={isCheckingOut}
                      onClick={() => setSelectedPayment("Card")}
                    >
                      {selectedPayment === "Card" && (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Card / Transfer
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                     onClick={processSale}
                     disabled={isCheckingOut || selectedItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    <DollarSign className="w-6 h-6 mr-2" />
                    {isCheckingOut ? "Processing..." : "Complete Sale"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    disabled={isCheckingOut || selectedItems.length === 0}
                    className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
        variant={confirmConfig?.variant}
      />
    </div>
  );
}
