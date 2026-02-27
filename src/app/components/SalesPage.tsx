import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Plus,
  Search,
  Check,
  AlertCircle,
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
import { useState, useEffect } from "react";
import { Product, SalesHistory, Member } from "../../types/types";

export function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Card">(
    "Cash",
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>("walk_in");

  // New Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    type: "Product",
    stock: "10",
  });

  const loadData = async () => {
    try {
      const prods = await window.api.products.getAll();
      setProducts(prods);

      const sales = await window.api.sales.getRecent(10);
      setRecentSales(sales);

      const mems = await window.api.members.getAll();
      setMembers(mems);
    } catch (error) {
      console.error("Failed to load sales data", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return alert("Please fill name and price.");

    try {
      await window.api.products.create({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        type: newProduct.type,
        stock: parseInt(newProduct.stock) || 0,
        is_active: 1,
      });
      setIsProductModalOpen(false);
      setNewProduct({ name: "", price: "", type: "Product", stock: "10" });
      loadData(); // Refresh list
    } catch (error) {
      console.error("Failed to create product", error);
      alert("Failed to create product");
    }
  };

  const addItem = (product: Product) => {
    setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    setTotal(total + product.price);
  };

  const removeItem = (index: number) => {
    const item = selectedItems[index];
    setTotal(total - item.price);
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setSelectedItems([]);
    setTotal(0);
    setSelectedMemberId("walk_in");
  };

  const processSale = async () => {
    if (selectedItems.length === 0) {
      alert("Please add items to the cart first");
      return;
    }

    if (
      !confirm(
        `Process sale for ${total.toLocaleString()} DZD via ${selectedPayment}?`,
      )
    ) {
      return;
    }

    try {
      const actualMemberId =
        selectedMemberId === "walk_in" ? "" : selectedMemberId;

      // 1. Format the cart items for the DB
      const salesBatch = selectedItems.map((item) => ({
        product_id: item.id,
        member_id: actualMemberId || null,
        quantity: item.quantity,
        total_price: item.price,
        payment_method: selectedPayment,
      }));

      // 2. Transact the sales
      await window.api.sales.createBatch(salesBatch);

      // 3. Log a combined transaction to the global ledger
      await window.api.transactions.create({
        member_id: actualMemberId || "WALK_IN",
        amount: total,
        type: "PRODUCT",
        payment_method: selectedPayment,
      });

      alert("Sale processed successfully!");
      clearCart();
      loadData(); // Refresh history
    } catch (error) {
      console.error("Sale processing failed", error);
      alert("Failed to process sale. Check console for details.");
    }
  };

  return (
    <div className="p-6">
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
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <Search className="w-5 h-5 text-white" />
                  <Input
                    placeholder="Search products..."
                    className="bg-transparent border-0 text-white placeholder:text-white/70 focus-visible:ring-0"
                  />
                </div>

                <Dialog
                  open={isProductModalOpen}
                  onOpenChange={setIsProductModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" /> New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
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
                        Create Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="p-6">
              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>No products found. Add a new product to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addItem(product)}
                      className="border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-all hover:shadow-lg flex flex-col items-start h-auto"
                    >
                      <div className="flex flex-col gap-2">
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
                            sale.payment_method === "Cash"
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
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="border-blue-300">
                    <SelectValue placeholder="Select member (Walk-in default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">Walk-in Customer</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.id})
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
                            {item.price.toLocaleString()} DZD
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
                    disabled={selectedItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    <DollarSign className="w-6 h-6 mr-2" />
                    Complete Sale
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    disabled={selectedItems.length === 0}
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
    </div>
  );
}
