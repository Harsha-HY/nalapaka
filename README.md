Smart Restaurant Ordering & Management System

Live Demo
https://nalapaka.vercel.app

Overview

The Smart Restaurant Ordering & Management System is a QR-based digital restaurant platform designed to modernize restaurant operations using real-time dashboards, centralized order management, digital payments, voice-assisted ordering, and automated workflows.

Customers can scan a QR code placed at their table and directly access the menu of that specific hotel without creating an account or signing in. Orders are managed in real time through dedicated dashboards for servers, kitchen staff, and managers.

The system supports multiple hotels with separate databases, ensuring that each hotel operates independently while using the same platform.


Traditional Restaurant Problems

Most restaurants still follow manual workflows:

- Waiters manually take orders
- Orders are verbally communicated to the kitchen
- Wrong orders happen frequently
- Billing takes additional time
- Customers wait longer
- Managers cannot monitor operations in real time
- Extra orders increase waiter workload

This project solves these problems using a fully digital workflow.


Main Features

- QR-based ordering system
- Real-time order management
- Multi-hotel support
- Separate dashboards
- Table locking system
- Online QR payment
- Analytics and reports
- Review and rating system
- Menu management
- Voice-assisted ordering
- Automatic table reset system
- Live notifications
- Today’s special management
- Food sales tracking
- Customer order history
- Server contact support

Multi-Hotel System

The platform supports multiple hotels/restaurants using the same application.

How It Works

- The application owner creates hotel accounts.
- Every hotel receives:
  - Separate database
  - Separate menu
  - Separate dashboards
  - Separate QR codes
  - Separate analytics
  - Separate payment settings

The login page remains common for all hotels, but all data is isolated based on hotel identification.

One hotel cannot access another hotel’s data.


QR Code System

Every table has a unique QR code.

The QR code contains:

- Hotel identification
- Table number
- Seat/block information

When customers scan the QR code:

- The system automatically detects:
  - Hotel
  - Table number
- The customer directly opens the menu page of that specific hotel.

No signup or login is required for customers.

Customers only access the menu of the hotel linked to that QR code.


Customer Workflow

Step 1 – Scan QR Code

Customer scans the QR code placed on the table.

The system automatically:

- Opens the menu page
- Detects the hotel
- Detects the table number


Step 2 – Browse Menu

Customers can:

- View food categories
- View food images
- View prices
- Add items to cart
- Remove items
- Increase/decrease quantity

If an item is unavailable:

- System shows:
  "This item is currently not available."

Step 3 – Dining Details

Customers select:

- Dine-in or Parcel
- Seat/block if applicable

Table number is automatically filled from the QR code.


Step 4 – Voice-Assisted Ordering

The system supports voice-assisted ordering using Gemini API.

Customers can:

- Add items using voice
- Remove items using voice
- Move to next page
- Proceed order using voice

Supported languages:

- English
- Kannada
- Hindi
- Mixed-language commands

Example:

- "Add two dosa"
- "Remove idli"
- "Proceed order"

The voice system converts commands into backend actions.


Step 5 – Place Order

Once confirmed:

- Order is stored in database.
- Order is sent in real time to:
  - Server dashboard
  - Kitchen dashboard
  - Manager dashboard


Table Locking System

If:

- Payment is pending
- Order is still active

Then:

- Table remains locked
- Same QR scan shows:
  "Seat is currently blocked until payment is completed."

After payment:

- Table resets automatically.


Customer Contact Support

Customers can contact the assigned server directly from the customer page if assistance is needed.

Examples:

- Need water
- Need extra plates
- Billing support
- Order clarification

The notification is sent directly to the assigned server dashboard.


Dashboards

The system contains multiple dashboards.

1. Server Dashboard

Servers can:

- View assigned tables
- View customer orders
- Accept orders
- Receive live notifications
- Track preparation status
- Receive customer assistance requests

When server accepts an order:

- Customer receives confirmation
- Kitchen receives notification
- Manager dashboard updates automatically


2. Kitchen Dashboard

Kitchen staff can:

- View active food orders
- View quantities
- View table number
- Mark orders as prepared

Kitchen dashboard does NOT display:

- Revenue
- Payment details
- Pricing

Prepared orders remain visible for 24 hours.

At midnight:

- Orders archive automatically
- Dashboard resets for next day


3. Manager Dashboard

Manager has complete restaurant control.

Manager can:

- Monitor all orders
- Add menu items
- Edit menu
- Add Today’s Special items
- View analytics
- View sales reports
- Track revenue
- Generate final bills
- Manage tables
- Add server accounts
- Add kitchen accounts
- Generate QR codes
- Track reviews and ratings
- Monitor food sales
- View pending payments


Staff Account Creation System

The hotel owner/manager can create separate accounts for:

1. Server Dashboard Access
2. Kitchen Dashboard Access

While creating staff accounts, the manager enters:

- Staff name
- Gmail address
- Phone number
- Password
- Assigned role

The system securely stores the account using Supabase Authentication.

Each staff member logs in using:

- Gmail
- Password

The dashboard shown depends on the assigned role.

Example:

- Server role → Server Dashboard
- Kitchen role → Kitchen Dashboard

Staff can only access their assigned hotel dashboard.

Real-Time Notification System

Every dashboard receives live updates.

Example:

- Customer places order
- Server receives instantly
- Kitchen receives instantly
- Manager dashboard updates instantly

No manual communication is required.


Payment System

Supports:

- Cash payment
- Online QR payment

For online payment:

- QR generated dynamically
- Exact bill amount displayed

After successful payment:

- Final bill generated
- Print option enabled

No duplicate bills are generated.


Reviews & Ratings

Customers can:

- Rate food
- Rate service
- Leave reviews

Manager dashboard includes:

- Customer feedback analytics
- Review management
- Service insights

Analytics System

Manager dashboard provides:

- Daily sales
- Monthly sales
- Best-selling food items
- Order trends
- Revenue tracking
- Customer statistics


Customer Order History

Customers can view:

- Previously ordered items
- Payment status
- Order history
- Completed and pending orders

If payment is pending:

- Order remains active
- Table remains locked

Technologies Used

Frontend Technologies

- React (Vite)
- JavaScript / TypeScript
- Tailwind CSS
- ShadCN UI
- HTML5
- CSS3

Backend Technologies

- Supabase
- PostgreSQL Database
- Supabase Authentication
- Real-time Database Sync

AI & Voice Technologies

- Gemini API
- Web Speech API
- Speech Recognition
- Text-to-Speech

Features & Integrations

- QR Code Integration
- Real-time Notifications
- Role-based Dashboard System
- Multi-hotel Architecture
- Table Locking System
- Online QR Payment System

Deployment & Hosting

- Lovable
- Web-based Cloud Deployment

Dashboards Included

- Customer Interface
- Server Dashboard
- Kitchen Dashboard
- Manager Dashboard


Core Functionalities

- Digital Menu System
- Order Management
- Real-time Order Tracking
- Billing & Payment Management
- Analytics & Reports
- Review & Rating System
- Food Sales Monitoring
- Automatic Table Reset System


Future Scope

Future improvements may include:

- AI recommendations
- Inventory management
- Smart table sensors
- Advanced analytics
- Full AI automation
- Loyalty programs

Final Conclusion

The Smart Restaurant Ordering & Management System is a complete restaurant automation platform that modernizes traditional restaurant workflows using QR ordering, real-time dashboards, centralized management, digital payments, and automated operations.

The system improves restaurant efficiency, reduces manual workload, minimizes order mistakes, and creates a faster and smoother dining experience for customers, servers, kitchen staff, and managers.
