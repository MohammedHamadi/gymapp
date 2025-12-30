import { DollarSign, ShoppingCart, CreditCard, Plus, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useState } from 'react';

export function SalesPage() {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const products = [
    { id: 1, name: 'Monthly Subscription', price: 3000, category: 'Subscription' },
    { id: 2, name: 'Quarterly Subscription', price: 8000, category: 'Subscription' },
    { id: 3, name: 'Annual Subscription', price: 28000, category: 'Subscription' },
    { id: 4, name: 'Single Session', price: 300, category: 'Session' },
    { id: 5, name: '10 Sessions Package', price: 2500, category: 'Package' },
    { id: 6, name: '20 Sessions Package', price: 4500, category: 'Package' },
    { id: 7, name: 'Protein Shake', price: 400, category: 'Product' },
    { id: 8, name: 'Energy Drink', price: 200, category: 'Product' },
    { id: 9, name: 'Gym Towel', price: 800, category: 'Product' },
    { id: 10, name: 'Water Bottle', price: 500, category: 'Product' },
    { id: 11, name: 'Gym Bag', price: 2000, category: 'Product' },
    { id: 12, name: 'Personal Training Session', price: 1500, category: 'Service' },
  ];

  const recentSales = [
    { id: 1, time: '10:30 AM', member: 'Ahmed BENALI', items: 'Monthly Subscription', amount: 3000, payment: 'Cash' },
    { id: 2, time: '11:15 AM', member: 'Yasmine DJAMEL', items: 'Protein Shake, Water Bottle', amount: 900, payment: 'Card' },
    { id: 3, time: '12:00 PM', member: 'Karim LARBI', items: '10 Sessions Package', amount: 2500, payment: 'Cash' },
    { id: 4, time: '01:30 PM', member: 'Fatima OMAR', items: 'Single Session, Energy Drink', amount: 500, payment: 'Card' },
    { id: 5, time: '02:45 PM', member: 'Mohamed SALAH', items: 'Quarterly Subscription', amount: 8000, payment: 'Cash' },
  ];

  const addItem = (product: any) => {
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
  };

  const processSale = () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the cart first');
      return;
    }
    if (confirm(`Process sale for ${total.toLocaleString()} DZD?`)) {
      alert('Sale processed successfully!');
      clearCart();
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
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Search className="w-5 h-5 text-white" />
                <Input 
                  placeholder="Search products..." 
                  className="bg-transparent border-0 text-white placeholder:text-white/70 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-2">
                      <Badge className={
                        product.category === 'Subscription' ? 'bg-blue-600 w-fit' :
                        product.category === 'Package' ? 'bg-green-600 w-fit' :
                        product.category === 'Product' ? 'bg-purple-600 w-fit' :
                        'bg-orange-600 w-fit'
                      }>
                        {product.category}
                      </Badge>
                      <h3 className="text-blue-900">{product.name}</h3>
                      <p className="text-xl text-blue-600">{product.price.toLocaleString()} DZD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-t-lg">
              <h3 className="text-white text-xl">Recent Sales Today</h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-blue-200">
                    <th className="text-left py-2 text-blue-900">Time</th>
                    <th className="text-left py-2 text-blue-900">Member</th>
                    <th className="text-left py-2 text-blue-900">Items</th>
                    <th className="text-right py-2 text-blue-900">Amount</th>
                    <th className="text-center py-2 text-blue-900">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="py-3 text-blue-900">{sale.time}</td>
                      <td className="py-3 text-blue-900">{sale.member}</td>
                      <td className="py-3 text-blue-900">{sale.items}</td>
                      <td className="py-3 text-blue-900 text-right">{sale.amount.toLocaleString()} DZD</td>
                      <td className="py-3 text-center">
                        <Badge className={sale.payment === 'Cash' ? 'bg-green-600' : 'bg-blue-600'}>
                          {sale.payment}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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

            <div className="p-6 space-y-4">
              {/* Member Selection */}
              <div>
                <Label htmlFor="member">Member (Optional)</Label>
                <Input 
                  id="member" 
                  placeholder="Search member..." 
                  className="border-blue-300"
                />
              </div>

              {/* Cart Items */}
              <div className="border-2 border-blue-200 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No items added</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <div className="flex-1">
                          <p className="text-blue-900 text-sm">{item.name}</p>
                          <p className="text-blue-600 text-xs">{item.price.toLocaleString()} DZD</p>
                        </div>
                        <Button 
                          onClick={() => removeItem(index)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t-2 border-blue-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl text-blue-900">Total:</span>
                  <span className="text-2xl text-green-600">{total.toLocaleString()} DZD</span>
                </div>

                {/* Payment Method */}
                <div className="space-y-2 mb-4">
                  <Label>Payment Method</Label>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Cash
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      Card
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={processSale}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  >
                    <DollarSign className="w-6 h-6 mr-2" />
                    Process Sale
                  </Button>
                  <Button 
                    onClick={clearCart}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Clear Cart
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
