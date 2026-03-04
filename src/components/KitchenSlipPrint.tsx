import { Order } from '@/hooks/useOrders';

interface KitchenSlipItem {
  name: string;
  nameKn: string;
  quantity: number;
}

export function printKitchenSlip(
  order: Order, 
  items: KitchenSlipItem[], 
  isExtra: boolean = false
) {
  const seats = (order as any).seats || [];
  const seatsDisplay = seats.length > 0 ? seats.join(', ') : 'N/A';
  const orderType = (order as any).order_type || 'dine-in';

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen Slip</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          max-width: 300px; 
          margin: 0 auto; 
          padding: 10px; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 10px;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
        }
        .header h1 { margin: 0; font-size: 18px; }
        .extra-badge {
          background: #000;
          color: #fff;
          padding: 4px 12px;
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 5px;
        }
        .info { font-size: 16px; font-weight: bold; margin: 5px 0; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .item { 
          font-size: 14px; 
          margin: 8px 0; 
          display: flex; 
          justify-content: space-between;
        }
        .item-name { font-weight: bold; }
        .timestamp { 
          text-align: center; 
          font-size: 10px; 
          margin-top: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${isExtra ? '<div class="extra-badge">⚡ EXTRA ORDER ⚡</div>' : '<h1>KITCHEN ORDER</h1>'}
      </div>
      
      ${orderType === 'parcel' 
        ? '<div class="info">📦 PARCEL</div>' 
        : `<div class="info">🪑 TABLE ${order.table_number} | SEATS: ${seatsDisplay}</div>`
      }
      
      <div class="divider"></div>
      
      ${items.map(item => `
        <div class="item">
          <span class="item-name">${item.name}</span>
          <span>× ${item.quantity}</span>
        </div>
      `).join('')}
      
      <div class="divider"></div>
      <div class="timestamp">
        Printed: ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
}

export function printBill(order: Order) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const seats = (order as any).seats || [];
  const seatsDisplay = seats.length > 0 ? seats.join(', ') : '';
  const orderType = (order as any).order_type || 'dine-in';

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - Nalapaka</title>
      <style>
        body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 12px; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
        .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        .info { font-size: 11px; margin: 3px 0; }
        .badge { display: inline-block; padding: 2px 8px; background: #eee; border-radius: 4px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>NALAPAKA</h1>
        <p>Nanjangud</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
      <div class="divider"></div>
      <div class="info"><span class="badge">${orderType === 'parcel' ? 'PARCEL' : 'DINE-IN'}</span></div>
      ${orderType === 'dine-in' ? `<div class="info">Table: ${order.table_number}${seatsDisplay ? ` | Seats: ${seatsDisplay}` : ''}</div>` : ''}
      <div class="info">Customer: ${order.customer_name}</div>
      <div class="info">Phone: ${order.phone_number}</div>
      <div class="divider"></div>
      ${orderedItems.map(item => `
        <div class="item">
          <span>${item.name} x ${item.quantity}</span>
          <span>₹${item.price * item.quantity}</span>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="total">
        <span>TOTAL</span>
        <span>₹${order.total_amount}</span>
      </div>
      <div class="divider"></div>
      <div class="info">Payment: ${order.payment_mode} ✓</div>
      <div class="footer">
        <p>Thank you for dining with us!</p>
        <p>Visit again!</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
}
